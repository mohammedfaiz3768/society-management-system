const express = require("express");
const router = express.Router();

const {
  createEmergency,
  getMyEmergencies,
  getAllEmergencies,
  updateEmergencyStatus
} = require("./emergencyController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.post("/", requireRole("resident", "admin"), createEmergency);

router.get("/mine", requireRole("resident", "admin"), getMyEmergencies);

router.get("/", requireRole("admin", "guard"), getAllEmergencies);

router.put("/:id/status", requireRole("admin", "guard"), updateEmergencyStatus);

module.exports = router;
