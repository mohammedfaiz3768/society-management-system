const express = require("express");
const router = express.Router();

const {
  addAsset,
  updateAsset,
  deleteAsset,
  getAllAssets,
  getMyAssignedAssets,
  addMaintenanceLog,
  getMaintenanceLogs
} = require("./inventoryController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), addAsset);
router.put("/:id", requireRole("admin"), updateAsset);
router.delete("/:id", requireRole("admin"), deleteAsset);

router.get("/", requireRole("admin", "guard"), getAllAssets);

router.get("/assigned/mine", requireRole("guard", "admin"), getMyAssignedAssets);

router.post("/maintenance", requireRole("guard", "admin"), addMaintenanceLog);

router.get("/:asset_id/logs", requireRole("admin"), getMaintenanceLogs);

module.exports = router;
