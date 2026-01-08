const express = require("express");
const router = express.Router();

const {
  addStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  staffCheckIn,
  staffCheckOut,
  getStaffAttendance,
  addStaffLog,
  getStaffLogs,
  assignStaffToResident,
  getResidentStaff,
  blockStaff,
  unblockStaff,
  markStaffEntry,
  markStaffExit,
  markStaffLeave
} = require("./staffController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");
const { demoModeGuard } = require("../../middleware/demoMode");

router.use(auth);

router.post("/", requireRole("admin"), addStaff);
router.get("/", requireRole("admin"), getAllStaff);
router.put("/:id", requireRole("admin"), updateStaff);
// Protect destructive DELETE operation in demo mode
router.delete("/:id", requireRole("admin"), demoModeGuard, deleteStaff);
router.post("/check-in", requireRole("admin", "guard"), staffCheckIn);
router.post("/check-out", requireRole("admin", "guard"), staffCheckOut);
router.get("/attendance/:staff_id", requireRole("admin"), getStaffAttendance);
router.post("/log", requireRole("admin"), addStaffLog);
router.get("/log/:staff_id", requireRole("admin"), getStaffLogs);
router.post("/assign", requireRole("admin"), assignStaffToResident);
router.get("/assigned/:resident_id", requireRole("admin", "resident"), getResidentStaff);
router.put("/block/:assignment_id", requireRole("admin", "resident"), blockStaff);
router.put("/unblock/:assignment_id", requireRole("admin", "resident"), unblockStaff);
router.post("/entry", requireRole("admin", "guard"), markStaffEntry);
router.post("/exit", requireRole("admin", "guard"), markStaffExit);
router.post("/leave", requireRole("admin", "resident"), markStaffLeave);

module.exports = router;
