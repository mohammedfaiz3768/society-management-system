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

// All emergency routes require login
router.use(authMiddleware);

// RESIDENT / ADMIN: Create emergency
router.post("/", requireRole("resident", "admin"), createEmergency);

// RESIDENT / ADMIN: My emergencies
router.get("/mine", requireRole("resident", "admin"), getMyEmergencies);

// ADMIN / GUARD: View all emergencies
router.get("/", requireRole("admin", "guard"), getAllEmergencies);

// ADMIN / GUARD: Update status
router.put("/:id/status", requireRole("admin", "guard"), updateEmergencyStatus);

module.exports = router;
