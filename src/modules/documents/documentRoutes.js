const express = require("express");
const router = express.Router();

const {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument
} = require("./documentController");

const upload = require("../../middleware/uploadDocument");
const auth = require("../../middleware/authMiddleware");
const requireRole = require("../../middleware/roleMiddleware");

router.use(auth);

router.post("/", requireRole("admin"), upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/:id/download", downloadDocument);
router.delete("/:id", requireRole("admin"), deleteDocument);

module.exports = router;
