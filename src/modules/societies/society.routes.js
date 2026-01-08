const express = require("express");
const router = express.Router();
const {
    createSociety,
    getMySociety,
    updateSociety,
} = require("./society.controller");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

// All routes require authentication
router.use(auth);

// POST /societies - Create society (admin first login)
router.post("/", requireRole("admin"), createSociety);

// GET /societies/me - Get my society
router.get("/me", getMySociety);

// PUT /societies/me - Update my society (admin only)
router.put("/me", requireRole("admin"), updateSociety);

module.exports = router;
