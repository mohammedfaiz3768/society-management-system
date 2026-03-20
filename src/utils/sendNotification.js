const pool = require("../config/db");
const { admin, isInitialized } = require("../config/firebase");

exports.sendNotification = async (userId, title, message, type = "general", req = null) => {

  if (!userId || !title || !message) {
    console.warn("[sendNotification] Skipped — missing userId, title or message");
    return;
  }

  try {
    const userResult = await pool.query(
      "SELECT fcm_token, society_id FROM users WHERE id=$1",
      [userId]
    );

    const user = userResult.rows[0];
    const societyId = user?.society_id || null;
    const fcmToken = user?.fcm_token || null;

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, society_id)
             VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, societyId]
    );

    if (req) {
      const io = req.app?.get("socketio");
      const onlineUsers = req.app?.get("onlineUsers");
      const socketId = onlineUsers?.[userId];

      if (io && socketId) {
        io.to(socketId).emit("notification", { title, message, type });
      }
    }

    if (isInitialized && admin && fcmToken) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: { title, body: message },
          data: { type: String(type) },
        });
      } catch (fcmErr) {
        if (
          fcmErr.code === "messaging/invalid-registration-token" ||
          fcmErr.code === "messaging/registration-token-not-registered"
        ) {
          await pool.query(
            "UPDATE users SET fcm_token=NULL WHERE id=$1",
            [userId]
          );
          console.warn(`[sendNotification] Cleared invalid FCM token for user ${userId}`);
        } else {
          console.error("[sendNotification] FCM error:", fcmErr.message);
        }
      }
    }

  } catch (err) {
    console.error("[sendNotification] error:", err.message);
  }
};
