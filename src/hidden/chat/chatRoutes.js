const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMyChats,
  getMessages
} = require("./chatController");

const auth = require("../../middleware/authMiddleware");

// All chat routes require login
router.use(auth);

// Send a message
router.post("/send", sendMessage);

// Get my chat rooms
router.get("/rooms", getMyChats);

// Get messages of a room
router.get("/messages/:room_id", getMessages);

module.exports = router;
