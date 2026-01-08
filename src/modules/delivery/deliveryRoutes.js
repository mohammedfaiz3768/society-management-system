const express = require("express");
const router = express.Router();

const {
  createDeliveryPass,
  deliveryEntry,
  deliveryExit,
  getMyDeliveries,
  getAllDeliveries
} = require("./deliveryController");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/pass", requireRole("resident", "admin"), createDeliveryPass);
router.get("/mine", requireRole("resident", "admin"), getMyDeliveries);
router.post("/entry", requireRole("guard", "admin"), deliveryEntry);
router.put("/exit/:id", requireRole("guard", "admin"), deliveryExit);
router.get("/", requireRole("admin"), getAllDeliveries);

module.exports = router;
