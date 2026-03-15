const express = require("express");
const router = express.Router();

const {
  createOutage,
  updateOutage,
  cancelOutage,
  getAllOutages,
  getUpcomingOutages,
  getActiveOutages
} = require("./outageController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), createOutage);
router.put("/:id", requireRole("admin"), updateOutage);
router.put("/:id/cancel", requireRole("admin"), cancelOutage);

router.get("/", getAllOutages);
router.get("/upcoming", getUpcomingOutages);
router.get("/active", getActiveOutages);

module.exports = router;
