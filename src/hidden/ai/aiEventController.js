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

    const result = await db.query(
      `INSERT INTO ai_events 
        (event_type, camera_id, confidence, snapshot_url, raw_data)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [event_type, camera_id, confidence, snapshot_url, raw_data]
    );

    const event = result.rows[0];

    logAiEvent(event).catch(console.error);

    sendAiEventPush(event).catch(console.error);

    extractClipForEvent(event).catch(console.error);

    res.json({ success: true, event });
  } catch (err) {
    console.error("AI event error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
