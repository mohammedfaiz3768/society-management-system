const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");
const db = require("../../config/db");
const crypto = require("crypto");

router.post("/approve", auth, requireRole("admin"), async (req, res) => {
  try {
    const { request_id, duration_minutes } = req.body;

    const reqData = await db.query(
      `SELECT * FROM camera_access_requests WHERE id=$1`,
      [request_id]
    );

    if (!reqData.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = reqData.rows[0];

    const accessKey = crypto.randomBytes(16).toString("hex"); 
    const expiresAt = new Date(Date.now() + (duration_minutes || 10) * 60000);

    await db.query(
      `INSERT INTO camera_access_keys (key, user_id, camera_id, expires_at)
       VALUES ($1,$2,$3,$4)`,
      [accessKey, request.user_id, request.camera_id, expiresAt]
    );

    await db.query(
      `UPDATE camera_access_requests
       SET status='APPROVED', responded_at=NOW()
       WHERE id=$1`,
      [request_id]
    );

    res.json({
      message: "Access approved",
      access_key: accessKey,
      expires_at: expiresAt
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
