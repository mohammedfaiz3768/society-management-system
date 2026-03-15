const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

exports.createPoll = async (req, res) => {
  const adminId = req.user.id;
  const societyId = req.societyId;
  const { question, options, closes_at } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: "Question and at least 2 options required" });
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

    for (let text of options) {
      await client.query(
        `INSERT INTO poll_options (poll_id, text)
         VALUES ($1, $2)`,
        [pollId, text]
      );
    }

    const users = await client.query(
      `SELECT id FROM users WHERE role = 'resident' AND society_id = $1`,
      [societyId]
    );

    for (let u of users.rows) {
      sendNotification(
        u.id,
        "New Poll Available",
        `${question}`,
        "poll_new",
        req
      );
    }

    await logActivity({
      userId: adminId,
      type: "poll_created",
      entityType: "poll",
      entityId: pollId,
      title: "New poll created",
      description: question
    });

    await client.query("COMMIT");
    res.status(201).json({ poll: pollResult.rows[0], options });
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
      `SELECT * FROM polls 
       WHERE (closes_at IS NULL OR closes_at >= NOW()) AND society_id = $1
       ORDER BY created_at DESC`,
      [societyId]
    );

    const polls = result.rows;

    const pollsWithOptions = await Promise.all(
      polls.map(async (poll) => {
        const optionsRes = await pool.query(
          `SELECT id, text, 
           (SELECT COUNT(*) FROM poll_votes WHERE option_id = poll_options.id) as votes
           FROM poll_options 
           WHERE poll_id = $1`,
          [poll.id]
        );
        return { ...poll, options: optionsRes.rows };
      })
    );

    res.json(pollsWithOptions);
  } catch (err) {
    console.error("getActivePolls error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPollDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const poll = await pool.query(
      `SELECT * FROM polls WHERE id = $1`,
      [id]
    );

    if (poll.rows.length === 0)
      return res.status(404).json({ message: "Poll not found" });

    const options = await pool.query(
      `SELECT * FROM poll_options WHERE poll_id = $1`,
      [id]
    );

    res.json({ poll: poll.rows[0], options: options.rows });
  } catch (err) {
    console.error("getPollDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.submitVote = async (req, res) => {
  const userId = req.user.id;
  const poll_id = req.params.id; 
  const { option_id } = req.body; 

  if (!poll_id || !option_id)
    return res.status(400).json({ message: "Poll ID and Option ID required" });

  try {
    const poll = await pool.query(
      `SELECT * FROM polls WHERE id = $1`,
      [poll_id]
    );

    if (poll.rows.length === 0)
      return res.status(404).json({ message: "Poll not found" });

    const type = poll.rows[0].type;

    if (type === "single") {
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
      description: `User voted for option ${option_id} in poll ${poll_id}`
    });

    res.json({ message: "Vote submitted", vote: vote.rows[0] || null });
  } catch (err) {
    console.error("submitVote error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPollResults = async (req, res) => {
  const { id } = req.params;

  try {
    const options = await pool.query(
      `SELECT po.id, po.text, 
       (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id) AS votes
       FROM poll_options po
       WHERE po.poll_id = $1`,
      [id]
    );

    res.json(options.rows);
  } catch (err) {
    console.error("getPollResults error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
