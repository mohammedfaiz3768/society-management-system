const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const db = require("../../config/db");

// Resident request access to a camera
router.post("/request", auth, async (req, res) => {
  try {
    const { camera_id, reason } = req.body;
    const userId = req.user.id;

    // Check if non-premium user:
    if (req.user.subscription !== "premium") {
      return res.status(403).json({
        error: "Upgrade to premium to request CCTV access."
      });
    }

    await db.query(
      `INSERT INTO camera_access_requests (user_id, camera_id, reason)
       VALUES ($1, $2, $3)`,
      [userId, camera_id, reason || null]
    );

    res.json({ message: "Request submitted. Admin will approve soon." });
  } catch (err) {
    console.error("Request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
