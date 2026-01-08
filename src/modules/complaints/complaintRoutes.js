const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint
} = require("./complaintController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.post("/", createComplaint);
router.get("/mine", getMyComplaints);
router.get("/", requireRole("admin"), getAllComplaints);
router.put("/:id", requireRole("admin"), updateComplaint);

module.exports = router;
