const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");
const { sendNotification } = require("../../utils/sendNotification");

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

exports.createComplaint = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  // ✅ Length validation
  if (title.length > 100) {
    return res.status(400).json({ message: "Title must be under 100 characters" });
  }
  if (description && description.length > 1000) {
    return res.status(400).json({ message: "Description must be under 1000 characters" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaints (user_id, title, description, society_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [userId, title, description || "", societyId]
    );

    const complaint = result.rows[0];

    await logActivity({
      userId,
      type: "complaint_created",
      entityType: "complaint",
      entityId: complaint.id,
      title: "New complaint created",
      description: title,
    });

    return res.status(201).json(complaint);

  } catch (err) {
    console.error("createComplaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyComplaints = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM complaints
             WHERE user_id = $1 AND society_id = $2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
      [userId, societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getMyComplaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllComplaints = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Pagination + optional status filter
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;
  const { status } = req.query;

  // ✅ Validate status filter if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`
    });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, u.name, u.phone
             FROM complaints c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.society_id = $1
               ${status ? "AND c.status = $4" : ""}
             ORDER BY c.created_at DESC
             LIMIT $2 OFFSET $3`,
      status ? [societyId, limit, offset, status] : [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllComplaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { status, admin_comment } = req.body;
  const societyId = req.societyId;

  // ✅ Only admins can update complaints
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update complaints" });
  }

  // ✅ Validate status if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
    });
  }

  try {
    const oldResult = await pool.query(
      `SELECT * FROM complaints WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const old = oldResult.rows[0];

    const updated = await pool.query(
      `UPDATE complaints
             SET status        = $1,
                 admin_comment = $2,
                 updated_at    = NOW()
             WHERE id = $3 AND society_id = $4
             RETURNING *`,
      [
        status || old.status,
        // ✅ Only overwrite comment if explicitly provided — preserves existing
        admin_comment !== undefined ? admin_comment : old.admin_comment,
        id,
        societyId, // ✅ UPDATE also scoped to society
      ]
    );

    const updatedComplaint = updated.rows[0];

    // ✅ Notify the resident their complaint was acted on
    await sendNotification(
      old.user_id,
      "Complaint Update",
      `Your complaint "${old.title}" status: ${updatedComplaint.status}`,
      "complaint_update",
      req
    );

    await logActivity({
      userId: req.user.id,
      type: "complaint_updated",
      entityType: "complaint",
      entityId: id,
      title: `Complaint #${id} updated`,
      description: `Status: ${updatedComplaint.status}`,
    });

    return res.json(updatedComplaint);

  } catch (err) {
    console.error("updateComplaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
};