const express = require("express");
const router = express.Router();

const {
  createCheckpoint,
  getAllCheckpoints,
  assignGuard,
  checkIn,
  getPatrolLogs,
  getDailySummary
} = require("./patrolController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/checkpoint", requireRole("admin"), createCheckpoint);
router.get("/checkpoint", requireRole("admin", "guard"), getAllCheckpoints);
router.post("/schedule", requireRole("admin"), assignGuard);
router.get("/logs", requireRole("admin"), getPatrolLogs);
router.get("/summary", requireRole("admin"), getDailySummary);

router.post("/checkin", requireRole("guard"), checkIn);

module.exports = router;
