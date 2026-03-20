const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

exports.createPoll = async (req, res) => {
  const adminId = req.user.id;
  const societyId = req.societyId;
  const { question, options, closes_at } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create polls" });
  }

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: "Question and at least 2 options required" });
  }

  if (options.length > 10) {
    return res.status(400).json({ message: "Maximum 10 options allowed" });
  }
  const cleanOptions = options.map(o => o?.toString().trim()).filter(Boolean);
  if (cleanOptions.length < 2) {
    return res.status(400).json({ message: "At least 2 non-empty options required" });
  }
  if (new Set(cleanOptions).size !== cleanOptions.length) {
    return res.status(400).json({ message: "Duplicate options are not allowed" });
  }

  if (closes_at && new Date(closes_at) <= new Date()) {
    return res.status(400).json({ message: "closes_at must be a future date" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pollResult = await client.query(
      `INSERT INTO polls (question, created_by, closes_at, society_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [question, adminId, closes_at || null, societyId]
    );

    const pollId = pollResult.rows[0].id;

    for (const text of cleanOptions) {
      await client.query(
        `INSERT INTO poll_options (poll_id, text) VALUES ($1, $2)`,
        [pollId, text]
      );
    }

    await logActivity({
      userId: adminId,
      type: "poll_created",
      entityType: "poll",
      entityId: pollId,
      title: "New poll created",
      description: question,
    });

    await client.query("COMMIT");

    const users = await pool.query(
      `SELECT id FROM users WHERE role = 'resident' AND society_id = $1`,
      [societyId]
    );
    const notifyPromises = users.rows.map(u =>
      sendNotification(u.id, "New Poll Available", question, "poll_new", req)
    );
    Promise.allSettled(notifyPromises).catch(console.error);

    return res.status(201).json({ poll: pollResult.rows[0], options: cleanOptions });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createPoll error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

exports.getActivePolls = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT 
                p.id, p.question, p.closes_at, p.created_at,
                po.id as option_id,
                po.text as option_text,
                COUNT(pv.id) as votes
             FROM polls p
             LEFT JOIN poll_options po ON po.poll_id = p.id
             LEFT JOIN poll_votes pv ON pv.option_id = po.id
             WHERE (p.closes_at IS NULL OR p.closes_at >= NOW())
               AND p.society_id = $1
             GROUP BY p.id, po.id
             ORDER BY p.created_at DESC`,
      [societyId]
    );

    const pollMap = new Map();
    for (const row of result.rows) {
      if (!pollMap.has(row.id)) {
        pollMap.set(row.id, {
          id: row.id,
          question: row.question,
          closes_at: row.closes_at,
          created_at: row.created_at,
          options: [],
        });
      }
      if (row.option_id) {
        pollMap.get(row.id).options.push({
          id: row.option_id,
          text: row.option_text,
          votes: parseInt(row.votes),
        });
      }
    }

    return res.json([...pollMap.values()]);

  } catch (err) {
    console.error("getActivePolls error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPollDetails = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    const poll = await pool.query(
      `SELECT * FROM polls WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (!poll.rows.length) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const options = await pool.query(
      `SELECT * FROM poll_options WHERE poll_id = $1`,
      [id]
    );

    return res.json({ poll: poll.rows[0], options: options.rows });

  } catch (err) {
    console.error("getPollDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.submitVote = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const poll_id = req.params.id;
  const { option_id } = req.body;

  if (!poll_id || !option_id) {
    return res.status(400).json({ message: "Poll ID and Option ID required" });
  }

  try {
    const pollResult = await pool.query(
      `SELECT * FROM polls WHERE id = $1 AND society_id = $2`,
      [poll_id, societyId]
    );

    if (!pollResult.rows.length) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const poll = pollResult.rows[0];

    if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
      return res.status(400).json({ message: "This poll has closed" });
    }

    const optionCheck = await pool.query(
      `SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2`,
      [option_id, poll_id]
    );
    if (!optionCheck.rows.length) {
      return res.status(400).json({ message: "Invalid option for this poll" });
    }

    const isSingleChoice = !poll.type || poll.type === "single";
    if (isSingleChoice) {
      await pool.query(
        `DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
        [poll_id, userId]
      );
    }

    const vote = await pool.query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING
             RETURNING *`,
      [poll_id, option_id, userId]
    );

    await logActivity({
      userId,
      type: "poll_vote",
      entityType: "poll",
      entityId: poll_id,
      title: "Vote submitted",
      description: `User voted for option ${option_id} in poll ${poll_id}`,
    });

    return res.json({ message: "Vote submitted", vote: vote.rows[0] || null });

  } catch (err) {
    console.error("submitVote error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPollResults = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    const pollCheck = await pool.query(
      `SELECT closes_at FROM polls WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (!pollCheck.rows.length) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const isClosed = pollCheck.rows[0].closes_at &&
      new Date(pollCheck.rows[0].closes_at) < new Date();

    if (!isClosed && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Results are available after the poll closes"
      });
    }

    const options = await pool.query(
      `SELECT po.id, po.text,
                    COUNT(pv.id) AS votes
             FROM poll_options po
             LEFT JOIN poll_votes pv ON pv.option_id = po.id
             WHERE po.poll_id = $1
             GROUP BY po.id
             ORDER BY votes DESC`,
      [id]
    );

    return res.json(options.rows);

  } catch (err) {
    console.error("getPollResults error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
