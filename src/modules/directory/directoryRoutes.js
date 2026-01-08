const express = require("express");
const router = express.Router();

const {
  getResidentDirectory,
  getStaffDirectory,
  searchDirectory
} = require("./directoryController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.get("/residents", requireRole("resident", "admin"), getResidentDirectory);
router.get("/staff", requireRole("resident", "admin"), getStaffDirectory);
router.get("/search", requireRole("resident", "admin"), searchDirectory);

module.exports = router;
