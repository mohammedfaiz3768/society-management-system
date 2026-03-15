const pool = require("../config/db");

async function logActivity({ userId, type, entityType, entityId, title, description, societyId }) {
  try {
    const action = title || type; 
    const details = description || '';

    await pool.query(
      `INSERT INTO activity_feed (user_id, society_id, action, entity_type, entity_id, details, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, societyId, action, entityType, entityId, details]
    );
  } catch (err) {
    console.error('logActivity error:', err);
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
