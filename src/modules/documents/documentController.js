const pool = require("../../config/db");

exports.uploadDocument = async (req, res) => {
  const adminId = req.user.id;
  const societyId = req.societyId;
  const { title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO documents (title, description, file_path, file_type, uploaded_by, society_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title,
        description,
        req.file.filename,
        req.file.mimetype,
        adminId,
        societyId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("uploadDocument error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDocuments = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT * FROM documents WHERE society_id = $1 ORDER BY created_at DESC`,
      [societyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getDocuments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.downloadDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await pool.query(`SELECT * FROM documents WHERE id = $1`, [id]);

    if (doc.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = `uploads/documents/${doc.rows[0].file_path}`;
    res.download(filePath);
  } catch (err) {
    console.error("downloadDocument error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
    res.json({ message: "Document deleted" });
  } catch (err) {
    console.error("deleteDocument error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
