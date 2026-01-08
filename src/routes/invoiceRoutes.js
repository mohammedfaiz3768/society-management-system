const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const db = require("../config/db");

router.get("/", auth, async (req, res) => {
  const userId = req.user.id;
  const { rows } = await db.query(
    `SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  res.json(rows);
});

module.exports = router;
