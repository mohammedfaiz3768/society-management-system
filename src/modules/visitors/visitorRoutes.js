const express = require("express");
const router = express.Router();

const {
  createVisitor,
  approveVisitor,
  markExit,
  getResidentVisitors,
  getAllVisitors
} = require("./visitorController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.post("/", requireRole("guard", "admin"), createVisitor);
router.put("/approve/:id", requireRole("resident", "admin"), approveVisitor);
router.put("/exit/:id", requireRole("guard", "admin"), markExit);
router.get("/mine", requireRole("resident", "admin"), getResidentVisitors);
router.get("/", requireRole("admin"), getAllVisitors);

module.exports = router;
