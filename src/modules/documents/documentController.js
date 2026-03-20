const pool = require("../../config/db");
const path = require("path");
const fs = require("fs");

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

exports.uploadDocument = async (req, res) => {
  const adminId = req.user.id;
  const societyId = req.societyId;
  const { title, description } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can upload documents" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (title.length > 150) {
    return res.status(400).json({ message: "Title must be under 150 characters" });
  }

  if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: "File type not allowed. Use PDF, images, or Office documents."
    });
  }

  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ message: "File size must be under 10MB" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO documents (title, description, file_path, file_type, uploaded_by, society_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, description, file_type, uploaded_by, society_id, created_at`,
      [title, description || null, req.file.filename, req.file.mimetype, adminId, societyId]
    );

    const doc = result.rows[0];

    return res.status(201).json({
      ...doc,
      download_url: `/api/documents/${doc.id}/download`,
    });

  } catch (err) {
    console.error("uploadDocument error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDocuments = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT id, title, description, file_type, uploaded_by, society_id, created_at
             FROM documents
             WHERE society_id=$1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    const docs = result.rows.map(doc => ({
      ...doc,
      download_url: `/api/documents/${doc.id}/download`,
    }));

    return res.json(docs);

  } catch (err) {
    console.error("getDocuments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.downloadDocument = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    const doc = await pool.query(
      "SELECT * FROM documents WHERE id=$1 AND society_id=$2",
      [id, societyId]
    );

    if (!doc.rows.length) {
      return res.status(404).json({ message: "Document not found" });
    }

    const safeFilename = path.basename(doc.rows[0].file_path);
    const filePath = path.join(__dirname, "../../../uploads/documents", safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    return res.download(filePath);

  } catch (err) {
    console.error("downloadDocument error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteDocument = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete documents" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM documents WHERE id=$1 AND society_id=$2 RETURNING id, file_path",
      [id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Document not found" });
    }

    const safeFilename = path.basename(result.rows[0].file_path);
    const filePath = path.join(__dirname, "../../../uploads/documents", safeFilename);
    fs.unlink(filePath, (err) => {
      if (err) console.error("[documents] File delete failed (non-critical):", err.message);
    });

    return res.json({ message: "Document deleted" });

  } catch (err) {
    console.error("deleteDocument error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
