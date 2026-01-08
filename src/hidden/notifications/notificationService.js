const db = require("../../config/db");
const admin = require("../../config/firebase");

async function getFcmTokensForUsers(userIds) {
  if (!userIds || !userIds.length) return [];

  const { rows } = await db.query(
    `SELECT DISTINCT fcm_token FROM users 
     WHERE id = ANY($1::int[]) AND fcm_token IS NOT NULL`,
    [userIds]
  );

  return rows.map((r) => r.fcm_token);
}

async function getTargetUserIdsForAlert(target) {
  const { scope, block, flat, role } = target;

  let query = `SELECT id FROM users`;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (scope === "BLOCK" && block) {
    conditions.push(`LEFT(flat_number, 1) = $${idx++}`);
    params.push(block);
  }

  if (scope === "FLAT" && flat) {
    conditions.push(`flat_number = $${idx++}`);
    params.push(flat);
  }

  if (scope === "ROLE" && role) {
    conditions.push(`LOWER(role) = LOWER($${idx++})`);
    params.push(role);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  const { rows } = await db.query(query, params);
  return rows.map((r) => r.id);
}

async function sendSosPush(sos) {
  try {
    const { rows } = await db.query(
      `SELECT fcm_token FROM users 
       WHERE LOWER(role) IN ('admin','security') AND fcm_token IS NOT NULL`
    );

    const tokens = rows.map((r) => r.fcm_token);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: "🚨 SOS Emergency Alert",
        body: `${sos.user_name} (${sos.block}-${sos.flat}) triggered SOS!`,
      },
      data: {
        type: "SOS_ALERT",
        sos_id: sos.id.toString(),
      },
      tokens,
    };

    await admin.messaging().sendEachForMulticast(message);
    console.log("📢 SOS alert sent to admin/security");
  } catch (err) {
    console.error("sendSosPush error:", err);
  }
}

async function sendEmergencyAlertPush(alert, target) {
  try {
    const userIds = await getTargetUserIdsForAlert(target);
    if (!userIds.length) return;

    const tokens = await getFcmTokensForUsers(userIds);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: alert.title || "Emergency Alert",
        body: alert.message,
      },
      data: {
        type: "EMERGENCY_ALERT",
        alertId: alert.id.toString(),
      },
      tokens,
    };

    await admin.messaging().sendEachForMulticast(message);
    console.log("📢 Emergency alert sent to", tokens.length, "devices");
  } catch (err) {
    console.error("sendEmergencyAlertPush error:", err);
  }
}

async function sendAiEventPush(event) {
  try {
    const { rows } = await db.query(
      `SELECT fcm_token FROM users 
       WHERE role IN ('admin', 'security') AND fcm_token IS NOT NULL`
    );

    const tokens = rows.map(r => r.fcm_token);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: `⚠️ AI DETECTED: ${event.event_type.toUpperCase()}`,
        body: `Camera ${event.camera_id} • Confidence: ${event.confidence || 0}%`
      },
      data: {
        type: "AI_EVENT",
        event_id: event.id.toString()
      },
      tokens
    };

    await admin.messaging().sendEachForMulticast(message);
    console.log("📢 AI event push sent");
  } catch (err) {
    console.error("sendAiEventPush error:", err);
  }
}

async function sendVisitorEntryPush(residentId, visitor) {
  try {
    const { rows } = await db.query(
      `SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL`,
      [residentId]
    );

    if (!rows.length) return;
    const token = rows[0].fcm_token;

    const message = {
      token,
      notification: {
        title: "Visitor Entry",
        body: `${visitor.name} (${visitor.type}) has entered the society.`,
      },
      data: {
        type: "VISITOR_ENTRY"
      }
    };

    await admin.messaging().send(message);
    console.log("📢 Visitor entry push sent to resident:", residentId);
  } catch (err) {
    console.error("sendVisitorEntryPush error:", err);
  }
}

async function sendGatePassRejectedPush(userId, pass) {
  try {
    const { rows } = await db.query(
      `SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL`,
      [userId]
    );

    if (!rows.length) return;
    const token = rows[0].fcm_token;

    const message = {
      token,
      notification: {
        title: "Gate Pass Rejected",
        body: `Your gate pass for ${pass.visitor_name} was rejected.`,
      },
      data: {
        type: "GATEPASS_REJECTED"
      }
    };

    await admin.messaging().send(message);
    console.log("📢 Gate pass rejected push sent to resident:", userId);
  } catch (err) {
    console.error("sendGatePassRejectedPush error:", err);
  }
}

module.exports = {
  sendEmergencyAlertPush,
  sendSosPush,
  getFcmTokensForUsers,
  getTargetUserIdsForAlert,
  sendAiEventPush,
  sendGatePassRejectedPush,
  sendVisitorEntryPush
};
