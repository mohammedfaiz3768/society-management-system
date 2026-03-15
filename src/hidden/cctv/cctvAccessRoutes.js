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

router.post("/request-access", auth, requestAccess);

router.post("/approve", auth, requireRole("ADMIN"), approveRequest);

router.post("/reject", auth, requireRole("ADMIN"), rejectRequest);

router.get("/validate", validateToken);

module.exports = router;
