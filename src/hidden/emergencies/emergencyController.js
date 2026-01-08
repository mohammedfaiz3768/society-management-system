const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");

// RESIDENT/ADMIN: Create emergency alert
exports.createEmergency = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { type, priority, description } = req.body;

  if (!type) {
    return res.status(400).json({ message: "type is required (e.g. fire, medical)" });
  }

  try {
    // Get user flat number (if any)
    const userResult = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flatNumber = userResult.rows[0]?.flat_number || null;

    const result = await pool.query(
      `INSERT INTO emergency_alerts
        (user_id, flat_number, type, priority, description, society_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, flatNumber, type, priority || "high", description || "", societyId]
    );

    const emergency = result.rows[0];

    // Notify all admins & guards
    const notifyUsers = await pool.query(
      `SELECT id, role FROM users WHERE role IN ('admin', 'guard')`
    );

    for (const row of notifyUsers.rows) {
      await sendNotification(
        row.id,
        `EMERGENCY: ${type.toUpperCase()}`,
        `Priority: ${emergency.priority.toUpperCase()}${flatNumber ? ` | Flat: ${flatNumber}` : ""}`,
        "emergency_new",
        req
      );
    }

    return res.status(201).json(emergency);
  } catch (err) {
    console.error("createEmergency error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// RESIDENT: Get my emergencies
exports.getMyEmergencies = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM emergency_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("getMyEmergencies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ADMIN/GUARD: Get all emergencies (latest first)
exports.getAllEmergencies = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT e.*, u.name AS user_name, u.phone AS user_phone
       FROM emergency_alerts e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.society_id = $1
       ORDER BY
         CASE e.status
           WHEN 'open' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'resolved' THEN 3
           ELSE 4
         END,
         e.created_at DESC`,
      [societyId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("getAllEmergencies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ADMIN/GUARD: Update emergency status (open / in_progress / resolved)
exports.updateEmergencyStatus = async (req, res) => {
  const { id } = req.params;
  const { status, priority, admin_note } = req.body;
  const actingUserId = req.user.id;

  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM emergency_alerts WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const prev = existing.rows[0];

    let resolvedBy = prev.resolved_by;
    let resolvedAt = prev.resolved_at;

    if (status === "resolved") {
      resolvedBy = actingUserId;
      resolvedAt = new Date();
    }

    const updated = await pool.query(
      `UPDATE emergency_alerts
       SET status = $1,
           priority = $2,
           updated_at = NOW(),
           resolved_by = $3,
           resolved_at = $4
       WHERE id = $5
       RETURNING *`,
      [
        status,
        priority || prev.priority,
        resolvedBy,
        resolvedAt,
        id
      ]
    );

    const emergency = updated.rows[0];

    // Notify the original resident who raised it
    if (emergency.user_id) {
      let msg;
      if (status === "resolved") {
        msg = `Your emergency (${emergency.type}) has been marked as RESOLVED.`;
      } else if (status === "in_progress") {
        msg = `Your emergency (${emergency.type}) is being handled (IN PROGRESS).`;
      } else {
        msg = `Status updated to: ${status}`;
      }

      await sendNotification(
        emergency.user_id,
        "Emergency Status Update",
        msg,
        "emergency_update",
        req
      );
    }

    return res.json(emergency);
  } catch (err) {
    console.error("updateEmergencyStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
