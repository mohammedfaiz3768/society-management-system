const express = require("express");
const router = express.Router();
const {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    updateUserRole
} = require("./user.controller");

const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.get("/", requireRole("admin"), getAllUsers);
router.post("/", requireRole("admin"), createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.patch("/:id/role", requireRole("admin"), updateUserRole);

module.exports = router;
