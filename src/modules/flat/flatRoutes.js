const express = require("express");
const router = express.Router();

const {
  createFlat,
  assignResident,
  getAllFlats,
  getMyFlat,
  addFlatMember,
  getMyMembers
} = require("./flatController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.post("/", requireRole("admin"), createFlat);
router.post("/assign", requireRole("admin"), assignResident);
router.get("/", requireRole("admin"), getAllFlats);
router.get("/mine", requireRole("resident", "admin"), getMyFlat);
router.post("/member", requireRole("resident", "admin"), addFlatMember);
router.get("/members/mine", requireRole("resident", "admin"), getMyMembers);

module.exports = router;
