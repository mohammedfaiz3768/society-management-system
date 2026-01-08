const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

exports.createVisitor = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { name, phone, purpose, flat_number } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO visitors (user_id, name, phone, purpose, flat_number, society_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, phone || "", purpose || "", flat_number, societyId]
    );

    const visitor = result.rows[0];

    const resident = await pool.query(
      `SELECT owner_id FROM flats WHERE flat_number = $1 AND society_id = $2`,
      [flat_number, societyId]
    );

    if (resident.rows.length > 0 && resident.rows[0].owner_id) {
      await sendNotification(
        resident.rows[0].owner_id,
        "Visitor Request",
        `${name} wants to visit your flat (${flat_number})`,
        "visitor_request",
        req
      );
    }

    await logActivity({
      userId: userId,
      type: "visitor_in",
      entityType: "visitor",
      entityId: visitor.id,
      title: "Visitor entry logged",
      description: `${name} entered for flat ${flat_number}`
    });

    res.status(201).json(visitor);
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

  try {
    const visitor = await pool.query(
      `SELECT * FROM visitors WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (visitor.rows.length === 0) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Ensure the resident approving is the owner of the flat the visitor is visiting
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

    await sendNotification(
      updatedVisitor.user_id, // Changed from guard_id to user_id
      "Visitor Approval Update",
      `Visitor ID ${id} was ${approved ? "approved" : "denied"} by the resident`,
      "visitor_approval",
      req
    );

    await logActivity({
      userId: residentId,
      type: approved ? "visitor_approved" : "visitor_denied",
      entityType: "visitor",
      entityId: id,
      title: `Visitor ${approved ? "approved" : "denied"}`,
      description: `Visitor ID ${id} was ${approved ? "approved" : "denied"}`
    });

    res.json(updatedVisitor);
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
    const updated = await pool.query(
      `UPDATE visitors
       SET out_time = NOW()
       WHERE id = $1 AND society_id = $2
       RETURNING *`,
      [id, societyId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const visitor = updated.rows[0];

    await logActivity({
      userId: guardId,
      type: "visitor_out",
      entityType: "visitor",
      entityId: id,
      title: "Visitor exit logged",
      description: `Visitor ID ${id} marked exited`
    });

    res.json(visitor);
  } catch (err) {
    console.error("markExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getResidentVisitors = async (req, res) => {
  const residentId = req.user.id;
  const societyId = req.societyId;

  try {
    // First, find all flat numbers owned by the resident in the current society
    const flats = await pool.query(
      `SELECT flat_number FROM flats WHERE owner_id = $1 AND society_id = $2`,
      [residentId, societyId]
    );

    if (flats.rows.length === 0) {
      return res.json([]); // Resident doesn't own any flats in this society
    }

    const flatNumbers = flats.rows.map(f => f.flat_number);

    const result = await pool.query(
      `SELECT * FROM visitors
       WHERE flat_number = ANY($1::text[]) AND society_id = $2
       ORDER BY in_time DESC`,
      [flatNumbers, societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getResidentVisitors error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllVisitors = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT v.*, u.name as resident_name 
       FROM visitors v
       LEFT JOIN users u ON v.resident_id = u.id
       WHERE v.society_id = $1
       ORDER BY v.in_time DESC`, // Changed to v.in_time as created_at is not in original schema
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllVisitors error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
