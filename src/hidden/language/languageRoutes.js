const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");

const {
    getLanguages,
    changeLanguage
} = require("./languageController");

router.get("/", authMiddleware, getLanguages);

router.post("/select", authMiddleware, changeLanguage);

module.exports = router;
