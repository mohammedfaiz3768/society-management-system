const express = require("express");
const router = express.Router();

const {
  getGlobalTimeline,
  getMyTimeline,
  getFilteredTimeline
} = require("./timelineController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.get("/me", getMyTimeline);
router.get("/global", requireRole("admin"), getGlobalTimeline);
router.get("/filter", requireRole("admin"), getFilteredTimeline);

module.exports = router;
