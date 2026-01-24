const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createComplaint = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId; // From society middleware
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
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
      description: title
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error("createComplaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyComplaints = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT * FROM complaints
       WHERE user_id = $1 AND society_id = $2
       ORDER BY created_at DESC`,
      [userId, societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyComplaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllComplaints = async (req, res) => {
  const societyId = req.societyId; // Admin only sees their society

  try {
    const result = await pool.query(
      `SELECT c.*, u.name, u.phone 
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.society_id = $1
       ORDER BY created_at DESC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllComplaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { status, admin_comment } = req.body;
  const societyId = req.societyId;

  try {
    const oldComplaint = await pool.query(
      `SELECT * FROM complaints WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (oldComplaint.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const updated = await pool.query(
      `UPDATE complaints
       SET status = $1,
           admin_comment = $2
       WHERE id = $3
       RETURNING *`,
      [
        status || oldComplaint.rows[0].status,
        admin_comment || oldComplaint.rows[0].admin_comment,
        id,
      ]
    );

    const updatedComplaint = updated.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "complaint_updated",
      entityType: "complaint",
      entityId: id,
      title: `Complaint #${id} updated`,
      description: `Status: ${updatedComplaint.status}`
    });

    res.json(updatedComplaint);
  } catch (err) {
    console.error("updateComplaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
