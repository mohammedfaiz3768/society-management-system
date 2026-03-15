const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const {
  getSummaryStats,
  getEventTrend,
  getCameraStats,
  getCriticalAlerts,
  getRecentEvents
} = require("./aiDashboardController");

router.get("/summary", auth, requireRole("admin"), getSummaryStats);
router.get("/trend", auth, requireRole("admin"), getEventTrend);
router.get("/cameras", auth, requireRole("admin"), getCameraStats);
router.get("/critical", auth, requireRole("admin"), getCriticalAlerts);
router.get("/recent", auth, requireRole("admin"), getRecentEvents);

module.exports = router;
