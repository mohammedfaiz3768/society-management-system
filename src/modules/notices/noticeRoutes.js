const express = require("express");
const router = express.Router();

const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require("./noticeController");

const authMiddleware = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/", getNotices);
router.get("/:id", getNoticeById);
router.post("/", requireRole("admin"), createNotice);
router.put("/:id", requireRole("admin"), updateNotice);
router.delete("/:id", requireRole("admin"), deleteNotice);

module.exports = router;
