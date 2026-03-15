const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

const adminOnly = [auth, requireRole("ADMIN")];

router.get("/events", adminOnly, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM ai_events ORDER BY created_at DESC`
  );
  res.json(rows);
});

router.get("/events/:id/clips", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT * FROM ai_event_clips WHERE event_id=$1`,
    [id]
  );
  res.json(rows);
});

module.exports = router;
