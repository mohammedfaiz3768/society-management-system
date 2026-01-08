const express = require("express");
const router = express.Router();

const {
  createBill,
  getAllBills,
  updateBill,
  deleteBill,
  getMyBills
} = require("./maintenanceController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/mine", requireRole("resident", "admin"), getMyBills);
router.get("/", requireRole("admin"), getAllBills);
router.post("/", requireRole("admin"), createBill);
router.put("/:id", requireRole("admin"), updateBill);
router.delete("/:id", requireRole("admin"), deleteBill);

module.exports = router;
