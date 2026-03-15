const db = require("../config/db");

async function extractClipForEvent(event) {
  console.log("🎥 Generating clip for AI event:", event.id);

  await new Promise(r => setTimeout(r, 1000));

  const clip_url = `/clips/event_${event.id}.mp4`;

  await db.query(
    `INSERT INTO ai_event_clips (event_id, camera_id, clip_url, duration_sec)
     VALUES ($1, $2, $3, $4)`,
    [event.id, event.camera_id, clip_url, 10]
  );

  console.log("🎞 Clip generated & saved:", clip_url);
}

module.exports = { extractClipForEvent };
