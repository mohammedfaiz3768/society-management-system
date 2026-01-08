const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const {
  requestAccess,
  approveRequest,
  rejectRequest,
  validateToken
} = require("./cctvAccessController");

// -----------------------------
// 1️⃣ Resident requests CCTV access
// -----------------------------
router.post("/request-access", auth, requestAccess);

// -----------------------------
// 2️⃣ Admin approves CCTV access request
// -----------------------------
router.post("/approve", auth, requireRole("ADMIN"), approveRequest);

// -----------------------------
// 3️⃣ Admin rejects CCTV request
// -----------------------------
router.post("/reject", auth, requireRole("ADMIN"), rejectRequest);

// -----------------------------
// 4️⃣ Validate CCTV access token (used before streaming)
// --------------------
router.get("/validate", validateToken);

module.exports = router;
