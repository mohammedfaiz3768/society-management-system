const express = require("express");
const router = express.Router();
const {
    registerSociety,
    verifyEmail,
    checkAvailability,
    resendVerification,
} = require("./registrationController");
const { demoModeGuard } = require("../../middleware/demoMode");

// Public routes (no auth required)
// Apply demo mode guard to prevent spam registrations in demo environment
router.post("/register", demoModeGuard, registerSociety);
router.get("/verify/:token", verifyEmail);
router.get("/check-availability", checkAvailability);
router.post("/resend-verification", resendVerification);

module.exports = router;
