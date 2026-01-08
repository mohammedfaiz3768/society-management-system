const express = require("express");
const router = express.Router();

const emergencyAlertController = require("./emergencyAlertController");
const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.post(
  "/",
  auth,
  requireRole("admin"),
  emergencyAlertController.createEmergencyAlert
);

router.get("/", auth, emergencyAlertController.listEmergencyAlerts);

router.post(
  "/:id/acknowledge",
  auth,
  emergencyAlertController.acknowledgeEmergencyAlert
);

router.get(
  "/:id/acknowledgements",
  auth,
  requireRole("admin"),
  emergencyAlertController.getAlertAcknowledgements
);

module.exports = router;
