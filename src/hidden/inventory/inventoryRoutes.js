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

// Login required
router.use(auth);

// ADMIN
router.post("/", requireRole("admin"), addAsset);
router.put("/:id", requireRole("admin"), updateAsset);
router.delete("/:id", requireRole("admin"), deleteAsset);

// USERS (admin + staff): list assets
router.get("/", requireRole("admin", "guard"), getAllAssets);

// STAFF: my assigned assets
router.get("/assigned/mine", requireRole("guard", "admin"), getMyAssignedAssets);

// STAFF + ADMIN: maintenance log
router.post("/maintenance", requireRole("guard", "admin"), addMaintenanceLog);

// ADMIN: asset log history
router.get("/:asset_id/logs", requireRole("admin"), getMaintenanceLogs);

module.exports = router;
