const db = require("../../config/db");
const { sendEmergencyAlertPush } = require("../../hidden/notifications/notificationService");

const VALID_TYPES = ["GENERAL", "FIRE", "FLOOD", "EARTHQUAKE", "MEDICAL", "SECURITY"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_SCOPES = ["ALL", "BLOCK", "FLAT", "ROLE"];

exports.createEmergencyAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const societyId = req.societyId;

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create emergency alerts" });
    }

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

    if (title.length > 100) {
      return res.status(400).json({ error: "Title must be under 100 characters" });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "Message must be under 1000 characters" });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
    if (!VALID_SCOPES.includes(target_scope)) {
      return res.status(400).json({ error: `Invalid target_scope. Must be one of: ${VALID_SCOPES.join(", ")}` });
    }

    if (target_scope === "BLOCK" && !target_block) {
      return res.status(400).json({ error: "target_block is required when scope is BLOCK" });
    }
    if (target_scope === "FLAT" && !target_flat) {
      return res.status(400).json({ error: "target_flat is required when scope is FLAT" });
    }
    if (target_scope === "ROLE" && !target_role) {
      return res.status(400).json({ error: "target_role is required when scope is ROLE" });
    }

    const { rows } = await db.query(
      `INSERT INTO emergency_alerts
             (title, message, type, priority, created_by, society_id,
              target_scope, target_block, target_flat, target_role)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING *`,
      [title, message, type, priority, userId, societyId,
        target_scope, target_block || null, target_flat || null, target_role || null]
    );

    const alert = rows[0];

    sendEmergencyAlertPush(alert, {
      scope: target_scope,
      block: target_block,
      flat: target_flat,
      role: target_role,
    }).catch(err => console.error("Emergency push error:", err));

    return res.status(201).json(alert);

  } catch (err) {
    console.error("createEmergencyAlert error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.listEmergencyAlerts = async (req, res) => {
  try {
    const societyId = req.societyId;

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const { rows } = await db.query(
      `SELECT ea.*, u.name AS created_by_name
             FROM emergency_alerts ea
             JOIN users u ON u.id = ea.created_by
             WHERE ea.society_id = $1
             ORDER BY ea.created_at DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
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
    const societyId = req.societyId;

    const alertResult = await db.query(
      "SELECT id FROM emergency_alerts WHERE id=$1 AND society_id=$2",
      [alertId, societyId]
    );
    if (!alertResult.rowCount) {
      return res.status(404).json({ error: "Alert not found or not accessible" });
    }

    await db.query(
      `INSERT INTO emergency_alert_acknowledgements (alert_id, user_id)
             VALUES ($1,$2)
             ON CONFLICT (alert_id, user_id) DO NOTHING`,
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
    const societyId = req.societyId;

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const alertCheck = await db.query(
      "SELECT id FROM emergency_alerts WHERE id=$1 AND society_id=$2",
      [alertId, societyId]
    );
    if (!alertCheck.rowCount) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const { rows } = await db.query(
      `SELECT eaa.user_id, u.name, u.flat_number, u.block, eaa.acknowledged_at
             FROM emergency_alert_acknowledgements eaa
             JOIN users u ON u.id = eaa.user_id
             WHERE eaa.alert_id = $1
             ORDER BY eaa.acknowledged_at ASC`,
      [alertId]
    );

    return res.json(rows);

  } catch (err) {
    console.error("getAlertAcknowledgements error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
