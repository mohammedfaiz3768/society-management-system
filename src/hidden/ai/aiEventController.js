// src/controllers/aiEventController.js
const db = require("../../config/db");
const { extractClipForEvent } = require("../../services/clipExtractorService");
const { sendAiEventPush } = require("../notifications/notificationService");
const { logAiEvent } = require("../../utils/activityLogger");

exports.receiveAiEvent = async (req, res) => {
  try {
    const {
      event_type,
      camera_id,
      confidence,
      snapshot_url,
      raw_data
    } = req.body;

    if (!event_type || !camera_id) {
      return res
        .status(400)
        .json({ error: "event_type and camera_id required" });
    }

    // 1️⃣ Save event in DB
    const result = await db.query(
      `INSERT INTO ai_events 
        (event_type, camera_id, confidence, snapshot_url, raw_data)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [event_type, camera_id, confidence, snapshot_url, raw_data]
    );

    const event = result.rows[0];

    // 2️⃣ Log to activity feed (admin dashboard)
    logAiEvent(event).catch(console.error);

    // 3️⃣ Send push to Admin + Security
    sendAiEventPush(event).catch(console.error);

    // 4️⃣ Trigger video clip extraction (non-blocking)
    extractClipForEvent(event).catch(console.error);

    // 5️⃣ Response back to AI model / device
    res.json({ success: true, event });
  } catch (err) {
    console.error("AI event error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
