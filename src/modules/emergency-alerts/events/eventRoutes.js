const express = require("express");
const router = express.Router();

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getPastEvents,
  getEventById
} = require("./eventController");

const auth = require("../../../middleware/authMiddleware");
const requireRole = require("../../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), createEvent);
router.put("/:id", requireRole("admin"), updateEvent);
router.delete("/:id", requireRole("admin"), deleteEvent);
router.get("/upcoming", getUpcomingEvents);
router.get("/past", getPastEvents);
router.get("/:id", getEventById);

module.exports = router;
