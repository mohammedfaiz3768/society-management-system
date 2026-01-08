const express = require("express");
const router = express.Router();

const {
  requestOtp,
  verifyOtp,
  getMe,
  saveFcmToken,
  resendOtp,
  updateEmail,
  requestOtpByEmail,
  verifyOtpByEmail,
  login,
  requestPasswordChangeOtp,
  verifyOtpAndChangePassword,
  adminRequestOtp,
  adminVerifyOtp
} = require("./auth.controller");

const authMiddleware = require("../../middleware/authMiddleware");

router.post("/login", login); // Add this
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/save-token", authMiddleware, saveFcmToken);
router.get("/me", authMiddleware, getMe);
router.post("/resend-otp", resendOtp);
router.post("/update-email", authMiddleware, updateEmail);

// Email OTP routes
router.post("/request-otp-email", requestOtpByEmail);
router.post("/verify-otp-email", verifyOtpByEmail);

// Password change with OTP
router.post("/request-password-change-otp", authMiddleware, requestPasswordChangeOtp);
router.post("/verify-otp-change-password", authMiddleware, verifyOtpAndChangePassword);

// Admin OTP Login (no auth required for these)
router.post("/admin-request-otp", adminRequestOtp);
router.post("/admin-verify-otp", adminVerifyOtp);

module.exports = router;

