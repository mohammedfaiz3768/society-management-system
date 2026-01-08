const express = require("express");
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getAllRequests,
  assignStaff,
  updateStatus
} = require("../controllers/serviceRequestController");

const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Login required
router.use(auth);

// RESIDENT
router.post("/", requireRole("resident", "admin"), createRequest);
router.get("/mine", requireRole("resident", "admin"), getMyRequests);

// ADMIN
router.get("/", requireRole("admin"), getAllRequests);
router.post("/assign", requireRole("admin"), assignStaff);

// STAFF + ADMIN
router.put("/:id/status", requireRole("admin", "guard"), updateStatus);

module.exports = router;
