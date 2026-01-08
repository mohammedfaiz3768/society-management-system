const admin = require("../config/firebase");
const pool = require("../config/db");

// Send notification to one user
async function sendToUser(userId, title, body, data = {}) {
  try {
    const result = await pool.query(
      "SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL",
      [userId]
    );

    if (result.rows.length === 0) return;

    const token = result.rows[0].fcm_token;

    const message = {
      notification: { title, body },
      token,
      data: { click_action: "FLUTTER_NOTIFICATION_CLICK", ...data },
    };

    await admin.messaging().send(message);
    console.log("FCM sent to user", userId);
  } catch (err) {
    console.error("sendToUser error:", err);
  }
}

// Send notification to ALL residents
async function sendToAllResidents(title, body, data = {}) {
  try {
    const result = await pool.query(
      "SELECT fcm_token FROM users WHERE role = 'resident' AND fcm_token IS NOT NULL"
    );

    const tokens = result.rows.map((r) => r.fcm_token);

    if (tokens.length === 0) return;

    const message = {
      notification: { title, body },
      tokens: tokens,
      data,
    };

    await admin.messaging().sendMulticast(message);

    console.log("FCM sent to all residents");
  } catch (err) {
    console.error("sendToAllResidents error:", err);
  }
}

module.exports = { sendToUser, sendToAllResidents };
