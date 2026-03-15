const express = require("express");
const router = express.Router();

const {
  createSlot,
  assignSlot,
  getAllSlots,
  getMySlot,
  addVehicle,
  getMyVehicles,
  addVisitorVehicle,
  exitVisitorVehicle,
  getVisitorLogs
} = require("./parkingController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.get("/", requireRole("admin"), getAllSlots);

router.post("/slot", requireRole("admin"), createSlot);
router.post("/slot/assign", requireRole("admin"), assignSlot);
router.get("/slot", requireRole("admin"), getAllSlots);
router.get("/slot/mine", requireRole("resident", "admin"), getMySlot);
router.post("/vehicle", requireRole("resident", "admin"), addVehicle);
router.get("/vehicle/mine", requireRole("resident", "admin"), getMyVehicles);
router.post("/visitor", requireRole("guard", "admin"), addVisitorVehicle);
router.put("/visitor/:id/exit", requireRole("guard", "admin"), exitVisitorVehicle);
router.get("/visitor/logs", requireRole("admin"), getVisitorLogs);

module.exports = router;
