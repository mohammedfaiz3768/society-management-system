const pool = require("../config/db");

async function logActivity({
  userId = null,
  type,
  entityType = null,
  entityId = null,
  title,
  description = null,
  metadata = null
}) {
  try {
    await pool.query(
      `INSERT INTO activity_feed 
       (user_id, type, entity_type, entity_id, title, description, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        userId,
        type,
        entityType,
        entityId,
        title,
        description,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
  } catch (err) {
    console.error("logActivity error:", err);
  }
}

async function logAiEvent(event) {
  await logActivity({
    userId: null,
    type: "ai_event_detected",
    entityType: "camera",
    entityId: event.camera_id,
    title: `AI detected ${event.event_type}`,
    description: `AI event on camera ${event.camera_id}, confidence ${event.confidence}%`,
    metadata: event
  });
}

module.exports = { logActivity, logAiEvent };
