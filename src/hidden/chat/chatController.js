const pool = require("../../config/db");
const { sendNotification } = require("../utils/sendNotification");
const { logActivity } = require("../utils/activityLogger"); 

async function getOrCreateRoom(user1, user2, societyId) {
  const u1 = Math.min(user1, user2);
  const u2 = Math.max(user1, user2);

  const room = await pool.query(
    `SELECT * FROM chat_rooms WHERE user1 = $1 AND user2 = $2 AND society_id = $3`,
    [u1, u2, societyId]
  );

  if (room.rows.length > 0) return room.rows[0];

  const created = await pool.query(
    `INSERT INTO chat_rooms (user1, user2, society_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [u1, u2, societyId]
  );

  const newRoom = created.rows[0];

  await logActivity({
    userId: user1,
    type: "chat_room_created",
    entityType: "chat_room",
    entityId: newRoom.id,
    title: "Chat room created",
    description: `Chat started between User ${u1} and User ${u2}`
  });

  return newRoom;
}

exports.sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const societyId = req.societyId;
  const { receiver_id, message } = req.body;

  if (!receiver_id || !message)
    return res.status(400).json({ message: "receiver_id and message required" });

  try {
    const room = await getOrCreateRoom(senderId, receiver_id, societyId);

    const result = await pool.query(
      `INSERT INTO chat_messages (room_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [room.id, senderId, message]
    );

    const msg = result.rows[0];

    await logActivity({
      userId: senderId,
      type: "chat_message_sent",
      entityType: "chat_message",
      entityId: msg.id,
      title: "Message sent",
      description: `To User ${receiver_id}: ${message.substring(0, 50)}`
    });

    const io = req.app.get("socketio");
    const onlineUsers = req.app.get("onlineUsers");
    const receiverSocket = onlineUsers[receiver_id];

    if (receiverSocket) {
      io.to(receiverSocket).emit("chat_message", {
        room_id: room.id,
        sender_id: senderId,
        message: message,
        created_at: msg.created_at
      });
    }

    sendNotification(
      receiver_id,
      "New Message",
      message.substring(0, 50),
      "chat_message",
      req
    );

    res.status(201).json(msg);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyChats = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT cr.*, 
        u1.name AS user1_name, u2.name AS user2_name
       FROM chat_rooms cr
       JOIN users u1 ON cr.user1 = u1.id
       JOIN users u2 ON cr.user2 = u2.id
       WHERE cr.user1 = $1 OR cr.user2 = $1
       ORDER BY cr.id DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyChats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  const { room_id } = req.params;
  const userId = req.user.id;

  try {
    const messages = await pool.query(
      `SELECT * FROM chat_messages
       WHERE room_id = $1
       ORDER BY created_at ASC`,
      [room_id]
    );

    await pool.query(
      `UPDATE chat_messages SET is_read = TRUE
       WHERE room_id = $1 AND sender_id != $2`,
      [room_id, userId]
    );

    res.json(messages.rows);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
