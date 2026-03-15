const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const {
    createInvitation,
    getInvitations,
    revokeInvitation,
    validateInvitation,
} = require("./invitationController");

router.post("/validate", validateInvitation);

router.post("/", authMiddleware, createInvitation);
router.get("/", authMiddleware, getInvitations);
router.delete("/:id", authMiddleware, revokeInvitation);

module.exports = router;
