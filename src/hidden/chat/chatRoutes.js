const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMyChats,
  getMessages
} = require("./chatController");

const auth = require("../../middleware/authMiddleware");

router.use(auth);

router.post("/send", sendMessage);

router.get("/rooms", getMyChats);

router.get("/messages/:room_id", getMessages);

module.exports = router;
