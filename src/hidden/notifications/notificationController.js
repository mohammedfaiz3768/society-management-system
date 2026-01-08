const pool = require("../../config/db");

// Get all my notifications
exports.getMyNotifications = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT n.* FROM notifications n
       JOIN users u ON n.user_id = u.id
       WHERE n.user_id = $1 AND u.society_id = $2
       ORDER BY n.created_at DESC`,
      [userId, societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyNotifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
