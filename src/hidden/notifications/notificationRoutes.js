const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");

const {
  getMyNotifications,
  markAsRead,
  deleteNotification
} = require("./notificationController");

router.use(auth);

// get all notifications for user
router.get("/", getMyNotifications);

// mark single notification as read
router.put("/:id/read", markAsRead);

// delete notification
router.delete("/:id", deleteNotification);

module.exports = router;
