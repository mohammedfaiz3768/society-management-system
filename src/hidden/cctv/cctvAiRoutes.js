const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const db = require("../../config/db");
const { receiveAiEvent } = require("../ai/aiEventController");

router.get("/events", auth, async (req, res) => {
  const rows = await db.query(
    `SELECT * FROM cctv_events ORDER BY detected_at DESC LIMIT 50`
  );
  res.json(rows.rows);
});

router.get("/events/:cameraId", auth, async (req, res) => {
  const { cameraId } = req.params;
  const rows = await db.query(
    `SELECT * FROM cctv_events WHERE camera_id=$1 ORDER BY detected_at DESC`,
    [cameraId]
  );
  res.json(rows.rows);
});

router.post("/event", receiveAiEvent);

// Validate key before streaming
router.post("/validate", auth, async (req, res) => {
  try {
    const { key, camera_id } = req.body;
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT * FROM camera_access_keys
       WHERE key=$1 AND user_id=$2 AND camera_id=$3
       AND expires_at > NOW()
       AND used = FALSE`,
      [key, userId, camera_id]
    );

    if (!rows.length) {
      return res.status(403).json({ error: "Invalid or expired key" });
    }

    // Log access
    await db.query(
      `INSERT INTO camera_access_logs (user_id, camera_id, key_used)
       VALUES ($1,$2,$3)`,
      [userId, camera_id, key]
    );

    res.json({ success: true, message: "Access granted" });
  } catch (err) {
    console.error("Key validate error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

module.exports = router;
