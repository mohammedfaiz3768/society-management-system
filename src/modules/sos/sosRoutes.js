const express = require("express");
const router = express.Router();
const sosController = require("./sosController");
const auth = require("../../middleware/authMiddleware");

// Create SOS alert (resident/admin)
router.post("/create", auth, sosController.createSOS);

// Respond to SOS (admin/guard)
router.post("/respond/:id", auth, sosController.respondSOS);

// Resolve SOS (admin/guard)
router.post("/resolve/:id", auth, sosController.resolveSOS);

// List all SOS alerts (admin/guard)
router.get("/all", auth, sosController.listSOS);

// Get emergency service contacts
router.get("/emergency-contacts", auth, sosController.getEmergencyContacts);

module.exports = router;
