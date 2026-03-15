const express = require("express");
const router = express.Router();

const {
  generateResidentQr,
  getMyQr,
  createVisitorQr,
  scanQr,
  getQrLogs
} = require("./qrController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.use(auth);

router.post("/resident/generate", requireRole("resident", "admin"), generateResidentQr);
router.get("/resident/mine", requireRole("resident", "admin"), getMyQr);

router.post("/visitor/create", requireRole("resident", "admin"), createVisitorQr);

router.post("/scan", requireRole("guard", "admin"), scanQr);

router.get("/logs", requireRole("admin"), getQrLogs);

module.exports = router;
