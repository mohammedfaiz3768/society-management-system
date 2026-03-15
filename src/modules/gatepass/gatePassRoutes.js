const express = require("express");
const router = express.Router();

const {
   createGatePass,
   getGatePasses,
   getGatePassById,
   verifyGatePass,
   markEntry,
   markExit,
   deleteGatePass
} = require("./gatePassController");

const { getAllGatePassesAdmin } = require("./adminGatePassController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/admin/all", requireRole("admin"), getAllGatePassesAdmin);

router.post("/create", requireRole("resident", "admin"), createGatePass);
router.get("/", requireRole("resident", "admin"), getGatePasses);
router.get("/:id", requireRole("resident", "guard", "admin"), getGatePassById);
router.delete("/:id", requireRole("resident", "admin"), deleteGatePass);

router.post("/verify", requireRole("guard", "admin"), verifyGatePass);
router.put("/:id/entry", requireRole("guard", "admin"), markEntry);
router.put("/:id/exit", requireRole("guard", "admin"), markExit);

module.exports = router;
