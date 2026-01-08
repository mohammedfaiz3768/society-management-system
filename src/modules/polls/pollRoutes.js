const express = require("express");
const router = express.Router();

const {
  createPoll,
  getActivePolls,
  getPollDetails,
  submitVote,
  getPollResults
} = require("./pollController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), createPoll);
router.get("/:id/results", requireRole("admin"), getPollResults);
router.get("/", getActivePolls);
router.get("/:id", getPollDetails);
router.post("/vote", requireRole("resident", "admin"), submitVote);

module.exports = router;
