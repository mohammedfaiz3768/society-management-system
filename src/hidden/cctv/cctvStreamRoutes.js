const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const db = require("../../config/db");

function isPrivileged(user) {
  if (!user || !user.role) return false;
  const role = String(user.role).toUpperCase();
  return role === "ADMIN" || role === "SECURITY";
}

router.get("/proxy/:cameraId", auth, async (req, res) => {
  try {
    const user = req.user;
    const cameraId = parseInt(req.params.cameraId, 10);
    const accessKey = req.query.key || null;

    if (isNaN(cameraId)) {
      return res.status(400).json({ error: "Invalid cameraId" });
    }

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

    if (!isPrivileged(user)) {
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

    await db.query(
      `INSERT INTO camera_access_logs (user_id, camera_id, key_used)
       VALUES ($1, $2, $3)`,
      [user.id, cameraId, accessKey]
    );

    const base = process.env.CCTV_PUBLIC_STREAM_BASE;
    if (!base) {
      return res
        .status(500)
        .json({ error: "CCTV_PUBLIC_STREAM_BASE not configured" });
    }

    const streamUrl = `${base.replace(/\/$/, "")}/${camera.stream_path}`;

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
