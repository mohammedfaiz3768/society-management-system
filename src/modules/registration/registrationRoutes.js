const express = require("express");
const router = express.Router();
const {
    registerSociety,
    verifyEmail,
    checkAvailability,
    resendVerification,
} = require("./registrationController");

// Public routes (no auth required)
router.post("/register", registerSociety);
router.get("/verify/:token", verifyEmail);
router.get("/check-availability", checkAvailability);
router.post("/resend-verification", resendVerification);

module.exports = router;
