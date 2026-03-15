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

router.post("/login", login); 
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/save-token", authMiddleware, saveFcmToken);
router.get("/me", authMiddleware, getMe);
router.post("/resend-otp", resendOtp);
router.post("/update-email", authMiddleware, updateEmail);

router.post("/request-otp-email", requestOtpByEmail);
router.post("/verify-otp-email", verifyOtpByEmail);

router.post("/request-password-change-otp", authMiddleware, requestPasswordChangeOtp);
router.post("/verify-otp-change-password", authMiddleware, verifyOtpAndChangePassword);

router.post("/admin-request-otp", adminRequestOtp);
router.post("/admin-verify-otp", adminVerifyOtp);

module.exports = router;

