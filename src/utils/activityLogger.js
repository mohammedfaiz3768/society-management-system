const pool = require("../config/db");

async function logActivity({
  userId,
  type,
  entityType,
  entityId,
  title,
  description,
  societyId,
  metadata,
}) {
  if (!userId || !type) {
    console.warn("[logActivity] Skipped — missing userId or type");
    return;
  }

  try {
    let resolvedSocietyId = societyId || null;

    if (!resolvedSocietyId && userId) {
      const userResult = await pool.query(
        "SELECT society_id FROM users WHERE id=$1",
        [userId]
      );
      resolvedSocietyId = userResult.rows[0]?.society_id || null;
    }

    const action = title || type;
    const details = description || "";

    const safeEntityId = entityId ? parseInt(entityId) || null : null;

    await pool.query(
      `INSERT INTO activity_feed
             (user_id, society_id, action, entity_type, entity_id, details, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        userId,
        resolvedSocietyId,
        action,
        entityType || null,
        safeEntityId,
        details,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

  } catch (err) {
    console.error("[logActivity] error:", err.message);
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
    societyId: event.society_id || null,
    metadata: event,
  });
}

module.exports = { logActivity, logAiEvent };
