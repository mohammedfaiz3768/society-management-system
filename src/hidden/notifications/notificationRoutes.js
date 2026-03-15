const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");

const {
  getMyNotifications,
  markAsRead,
  deleteNotification
} = require("./notificationController");

router.use(auth);

router.get("/", getMyNotifications);

router.put("/:id/read", markAsRead);

router.delete("/:id", deleteNotification);

module.exports = router;
