const express = require("express");
const router = express.Router();
const {
    createSociety,
    getMySociety,
    updateSociety,
} = require("./society.controller");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), createSociety);

router.get("/me", getMySociety);

router.put("/me", requireRole("admin"), updateSociety);

module.exports = router;
