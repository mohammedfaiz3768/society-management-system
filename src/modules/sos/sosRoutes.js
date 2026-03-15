const express = require("express");
const router = express.Router();
const sosController = require("./sosController");
const auth = require("../../middleware/authMiddleware");

router.post("/create", auth, sosController.createSOS);

router.post("/respond/:id", auth, sosController.respondSOS);

router.post("/resolve/:id", auth, sosController.resolveSOS);

router.get("/all", auth, sosController.listSOS);

router.get("/emergency-contacts", auth, sosController.getEmergencyContacts);

module.exports = router;
