const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

const phoneRegex = /^[0-9]{10}$/;

exports.createVisitor = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { name, phone, purpose, flat_number } = req.body;

  // ✅ flat_number added to required check
  if (!name || !phone || !flat_number) {
    return res.status(400).json({ message: "Name, phone and flat_number are required" });
  }

  // ✅ Phone format validation
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Invalid phone number — must be 10 digits" });
  }

  // ✅ Purpose length guard
  if (purpose && purpose.length > 200) {
    return res.status(400).json({ message: "Purpose must be under 200 characters" });
  }

  try {
    // ✅ Validate flat exists BEFORE inserting visitor
    const flatCheck = await pool.query(
      `SELECT owner_id FROM flats WHERE flat_number = $1 AND society_id = $2`,
      [flat_number, societyId]
    );

    if (flatCheck.rows.length === 0) {
      return res.status(404).json({ message: "Flat not found in this society" });
    }

    const result = await pool.query(
      `INSERT INTO visitors (user_id, name, phone, purpose, flat_number, society_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      [userId, name, phone, purpose || "", flat_number, societyId]
    );

    const visitor = result.rows[0];

    // Notify flat owner if they exist
    if (flatCheck.rows[0].owner_id) {
      await sendNotification(
        flatCheck.rows[0].owner_id,
        "Visitor Request",
        `${name} wants to visit your flat (${flat_number})`,
        "visitor_request",
        req
      );
    }

    await logActivity({
      userId,
      type: "visitor_in",
      entityType: "visitor",
      entityId: visitor.id,
      title: "Visitor entry logged",
      description: `${name} entered for flat ${flat_number}`,
    });

    return res.status(201).json(visitor);

  } catch (err) {
    console.error("createVisitor error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveVisitor = async (req, res) => {
  const residentId = req.user.id;
  const societyId = req.societyId;
  const { id } = req.params;
  const { approved } = req.body;

  if (approved === undefined) {
    return res.status(400).json({ message: "approved (true/false) is required" });
  }

  // ✅ Role guard — only residents and admins can approve
  if (!["resident", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only residents can approve visitors" });
  }

  try {
    const visitor = await pool.query(
      `SELECT * FROM visitors WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (visitor.rows.length === 0) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const flatOwner = await pool.query(
      `SELECT owner_id FROM flats WHERE flat_number = $1 AND society_id = $2`,
      [visitor.rows[0].flat_number, societyId]
    );

    if (flatOwner.rows.length === 0 || flatOwner.rows[0].owner_id !== residentId) {
      return res.status(403).json({ message: "You are not authorized to approve this visitor" });
    }

    const updated = await pool.query(
      `UPDATE visitors
             SET approved = $1, resident_id = $2
             WHERE id = $3 AND society_id = $4
             RETURNING *`,
      [approved, residentId, id, societyId]
    );

    const updatedVisitor = updated.rows[0];

    // ✅ More meaningful notification message
    await sendNotification(
      updatedVisitor.user_id,
      "Visitor Approval Update",
      `${updatedVisitor.name} was ${approved ? "approved ✅ — they may enter" : "denied ❌"}`,
      "visitor_approval",
      req
    );

    await logActivity({
      userId: residentId,
      type: approved ? "visitor_approved" : "visitor_denied",
      entityType: "visitor",
      entityId: id,
      title: `Visitor ${approved ? "approved" : "denied"}`,
      description: `Visitor ID ${id} was ${approved ? "approved" : "denied"}`,
    });

    return res.json(updatedVisitor);

  } catch (err) {
    console.error("approveVisitor error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markExit = async (req, res) => {
  const guardId = req.user.id;
  const societyId = req.societyId;
  const { id } = req.params;

  try {
    // ✅ Only mark exit if visitor hasn't already exited
    const updated = await pool.query(
      `UPDATE visitors
             SET out_time = NOW()
             WHERE id = $1 AND society_id = $2 AND out_time IS NULL
             RETURNING *`,
      [id, societyId]
    );

    if (updated.rows.length === 0) {
      // Could be not found OR already exited — check which
      const exists = await pool.query(
        `SELECT id, out_time FROM visitors WHERE id = $1 AND society_id = $2`,
        [id, societyId]
      );

      if (exists.rows.length === 0) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      return res.status(400).json({ message: "Visitor has already exited" });
    }

    await logActivity({
      userId: guardId,
      type: "visitor_out",
      entityType: "visitor",
      entityId: id,
      title: "Visitor exit logged",
      description: `Visitor ID ${id} marked exited`,
    });

    return res.json(updated.rows[0]);

  } catch (err) {
    console.error("markExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getResidentVisitors = async (req, res) => {
  const residentId = req.user.id;
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const flats = await pool.query(
      `SELECT flat_number FROM flats WHERE owner_id = $1 AND society_id = $2`,
      [residentId, societyId]
    );

    if (flats.rows.length === 0) {
      return res.json([]);
    }

    const flatNumbers = flats.rows.map(f => f.flat_number);

    const result = await pool.query(
      `SELECT * FROM visitors
             WHERE flat_number = ANY($1::text[]) AND society_id = $2
             ORDER BY in_time DESC
             LIMIT $3 OFFSET $4`,
      [flatNumbers, societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getResidentVisitors error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllVisitors = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT v.*, u.name as resident_name
             FROM visitors v
             LEFT JOIN users u ON v.resident_id = u.id
             WHERE v.society_id = $1
             ORDER BY v.in_time DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllVisitors error:", err);
    res.status(500).json({ message: "Server error" });
  }
};