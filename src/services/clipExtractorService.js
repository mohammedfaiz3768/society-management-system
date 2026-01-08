const db = require("../config/db");

// Media server integration pending
async function extractClipForEvent(event) {
  console.log("🎥 Generating clip for AI event:", event.id);

  // Simulate processing delay
  await new Promise(r => setTimeout(r, 1000));

  // Dummy URL (later: real clip from RTSP server)
  const clip_url = `/clips/event_${event.id}.mp4`;

  await db.query(
    `INSERT INTO ai_event_clips (event_id, camera_id, clip_url, duration_sec)
     VALUES ($1, $2, $3, $4)`,
    [event.id, event.camera_id, clip_url, 10]
  );

  console.log("🎞 Clip generated & saved:", clip_url);
}

module.exports = { extractClipForEvent };
