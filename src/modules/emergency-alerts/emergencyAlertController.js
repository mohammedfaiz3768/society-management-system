const db = require("../../config/db");
const { sendEmergencyAlertPush } = require("../../hidden/notifications/notificationService");

exports.createEmergencyAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const societyId = req.societyId; // Assuming societyId is available on req
    const {
      title,
      message,
      type = "GENERAL",
      priority = "HIGH",
      target_scope = "ALL",
      target_block,
      target_flat,
      target_role,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "title and message are required" });
    }

    const insertQuery = `
      INSERT INTO emergency_alerts
      (title, message, type, priority, created_by, society_id, target_scope, target_block, target_flat, target_role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      title,
      message,
      type,
      priority,
      userId,
      societyId,
      target_scope,
      target_block || null,
      target_flat || null,
      target_role || null,
    ]);

    const alert = rows[0];

    sendEmergencyAlertPush(alert, {
      scope: target_scope,
      block: target_block,
      flat: target_flat,
      role: target_role,
    }).catch((err) =>
      console.error("Error sending emergency alert push:", err)
    );

    return res.status(201).json(alert);
  } catch (err) {
    console.error("createEmergencyAlert error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.listEmergencyAlerts = async (req, res) => {
  try {
    const societyId = req.societyId; // Assuming societyId is available on req
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const { rows } = await db.query(
      `
      SELECT ea.*, u.name as created_by_name
      FROM emergency_alerts ea
      JOIN users u ON u.id = ea.created_by
      WHERE ea.society_id = $3
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
      `,
      [limit, offset, societyId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("listEmergencyAlerts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.acknowledgeEmergencyAlert = async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;
    const societyId = req.societyId; // Assuming societyId is available on req

    const alertResult = await db.query(
      `SELECT id FROM emergency_alerts WHERE id = $1 AND society_id = $2`,
      [alertId, societyId]
    );
    if (!alertResult.rowCount) {
      return res.status(404).json({ error: "Alert not found or not accessible" });
    }

    await db.query(
      `
      INSERT INTO emergency_alert_acknowledgements (alert_id, user_id)
      VALUES ($1,$2)
      ON CONFLICT (alert_id, user_id) DO NOTHING;
      `,
      [alertId, userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("acknowledgeEmergencyAlert error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAlertAcknowledgements = async (req, res) => {
  try {
    const alertId = req.params.id;

    const { rows } = await db.query(
      `
      SELECT
        eaa.user_id,
        u.name,
        u.flat,
        u.block,
        eaa.acknowledged_at
      FROM emergency_alert_acknowledgements eaa
      JOIN users u ON u.id = eaa.user_id
      WHERE eaa.alert_id = $1
      ORDER BY eaa.acknowledged_at ASC;
      `,
      [alertId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getAlertAcknowledgements error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
