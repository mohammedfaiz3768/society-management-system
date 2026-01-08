const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");

// Controller
const {
    getLanguages,
    changeLanguage
} = require("./languageController");

// --------------------------------------------------
// Get available languages
// --------------------------------------------------
router.get("/", authMiddleware, getLanguages);

// --------------------------------------------------
// Set / Update user language preference
// --------------------------------------------------
router.post("/select", authMiddleware, changeLanguage);

module.exports = router;
