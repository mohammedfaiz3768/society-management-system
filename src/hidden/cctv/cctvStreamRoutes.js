// src/routes/cctvStreamRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const db = require("../../config/db");

// Helper: is admin / security?
function isPrivileged(user) {
  if (!user || !user.role) return false;
  const role = String(user.role).toUpperCase();
  return role === "ADMIN" || role === "SECURITY";
}

// GET /api/cctv-stream/proxy/:cameraId?key=xxxx
router.get("/proxy/:cameraId", auth, async (req, res) => {
  try {
    const user = req.user;
    const cameraId = parseInt(req.params.cameraId, 10);
    const accessKey = req.query.key || null;

    if (isNaN(cameraId)) {
      return res.status(400).json({ error: "Invalid cameraId" });
    }

    // 1️⃣ Check subscription (no CCTV for free users)
    const userRow = await db.query(
      `SELECT id, subscription FROM users WHERE id = $1`,
      [user.id]
    );

    if (!userRow.rows.length) {
      return res.status(401).json({ error: "User not found" });
    }

    const subscription = (userRow.rows[0].subscription || "").toLowerCase();

    if (!["basic", "premium"].includes(subscription) && !isPrivileged(user)) {
      return res
        .status(403)
        .json({ error: "Upgrade plan to access CCTV streams." });
    }

    // 2️⃣ Load camera (and stream_path)
    const camResult = await db.query(
      `SELECT id, name, stream_path FROM cctv_cameras WHERE id = $1`,
      [cameraId]
    );

    if (!camResult.rows.length) {
      return res.status(404).json({ error: "Camera not found" });
    }

    const camera = camResult.rows[0];

    if (!camera.stream_path) {
      return res
        .status(500)
        .json({ error: "Camera stream not configured on server" });
    }

    // 3️⃣ PERMISSION LOGIC
    // Admin / Security -> full direct access (no key needed)
    if (!isPrivileged(user)) {
      // Resident -> MUST have a valid access key from admin
      if (!accessKey) {
        return res
          .status(403)
          .json({ error: "Access key required for this camera" });
      }

      const keyResult = await db.query(
        `SELECT *
         FROM camera_access_keys
         WHERE key = $1
           AND user_id = $2
           AND camera_id = $3
           AND expires_at > NOW()`,
        [accessKey, user.id, cameraId]
      );

      if (!keyResult.rows.length) {
        return res
          .status(403)
          .json({ error: "Invalid or expired access key" });
      }
    }

    // 4️⃣ Log access
    await db.query(
      `INSERT INTO camera_access_logs (user_id, camera_id, key_used)
       VALUES ($1, $2, $3)`,
      [user.id, cameraId, accessKey]
    );

    // 5️⃣ Build proxy URL (we NEVER send RTSP / NVR IP)
    const base = process.env.CCTV_PUBLIC_STREAM_BASE;
    if (!base) {
      return res
        .status(500)
        .json({ error: "CCTV_PUBLIC_STREAM_BASE not configured" });
    }

    // final HLS URL used by the player in app
    const streamUrl = `${base.replace(/\/$/, "")}/${camera.stream_path}`;

    // You can return JSON (mobile app will use this URL in a video player)
    return res.json({
      success: true,
      camera: {
        id: camera.id,
        name: camera.name,
      },
      streamUrl,
    });
  } catch (err) {
    console.error("CCTV proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
