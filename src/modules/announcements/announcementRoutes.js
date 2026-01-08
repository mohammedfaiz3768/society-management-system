const express = require("express");
const router = express.Router();

const {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  getAnnouncementById
} = require("./announcementController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), createAnnouncement);
router.delete("/:id", requireRole("admin"), deleteAnnouncement);
router.get("/", getAnnouncements);
router.get("/:id", getAnnouncementById);

module.exports = router;
