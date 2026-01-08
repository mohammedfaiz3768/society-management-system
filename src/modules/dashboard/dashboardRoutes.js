const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getResidentStats,
  getGuardStats
} = require("./dashboardController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.get("/admin", requireRole("admin"), getAdminStats);
router.get("/resident", requireRole("resident", "admin"), getResidentStats);
router.get("/guard", requireRole("guard", "admin"), getGuardStats);

module.exports = router;
