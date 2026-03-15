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

router.use(auth);

router.post("/", requireRole("resident", "admin"), createRequest);
router.get("/mine", requireRole("resident", "admin"), getMyRequests);

router.get("/", requireRole("admin"), getAllRequests);
router.post("/assign", requireRole("admin"), assignStaff);

router.put("/:id/status", requireRole("admin", "guard"), updateStatus);

module.exports = router;
