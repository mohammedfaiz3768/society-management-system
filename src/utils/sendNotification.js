const pool = require("../config/db");
const { admin, isInitialized } = require("../config/firebase");

exports.sendNotification = async (userId, title, message, type = "general", req = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [userId, title, message, type]
    );

    if (req) {
      const io = req.app.get("socketio");
      const onlineUsers = req.app.get("onlineUsers");
      const socketId = onlineUsers[userId];

      if (socketId) {
        io.to(socketId).emit("notification", { title, message, type });
      }
    }

    if (isInitialized && admin) {
      const tokenResult = await pool.query(
        `SELECT fcm_token FROM users WHERE id = $1`,
        [userId]
      );

      const fcmToken = tokenResult.rows[0]?.fcm_token;

      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: title,
            body: message,
          },
          data: {
            type: type
          }
        });
      }
    }
  } catch (err) {
    console.error("sendNotification error:", err);
  }
};
