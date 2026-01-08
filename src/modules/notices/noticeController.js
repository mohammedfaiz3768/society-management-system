const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createNotice = async (req, res) => {
  const { title, content, category, pinned, audience } = req.body;
  const createdBy = req.user.id;
  const societyId = req.societyId;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notices(title, content, category, created_by, society_id, pinned, audience)
VALUES($1, $2, $3, $4, $5, $6, $7)
RETURNING * `,
      [title, content, category || "general", createdBy, societyId, pinned || false, audience || "all"]
    );

    const notice = result.rows[0];

    await logActivity({
      userId: createdBy,
      type: "notice_created",
      entityType: "notice",
      entityId: notice.id,
      title: "New notice created",
      description: title
    });

    res.status(201).json(notice);
  } catch (err) {
    console.error("createNotice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllNotices = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT n.*, u.name AS created_by_name 
       FROM notices n 
       LEFT JOIN users u ON n.created_by = u.id 
       WHERE n.society_id = $1
       ORDER BY n.pinned DESC, n.created_at DESC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getNotices error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getNoticeById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT n.*, u.name AS created_by_name
       FROM notices n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getNoticeById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateNotice = async (req, res) => {
  const { id } = req.params;
  const { title, body, pinned, audience } = req.body;

  try {
    const old = await pool.query("SELECT * FROM notices WHERE id = $1", [id]);

    if (old.rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    const updated = await pool.query(
      `UPDATE notices SET
title = $1,
  body = $2,
  pinned = $3,
  audience = $4
       WHERE id = $5
RETURNING * `,
      [
        title ?? old.rows[0].title,
        body ?? old.rows[0].body,
        pinned ?? old.rows[0].pinned,
        audience ?? old.rows[0].audience,
        id,
      ]
    );

    const updatedNotice = updated.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "notice_updated",
      entityType: "notice",
      entityId: id,
      title: "Notice updated",
      description: title || old.rows[0].title
    });

    res.json(updatedNotice);
  } catch (err) {
    console.error("updateNotice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteNotice = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM notices WHERE id = $1", [id]);

    await logActivity({
      userId: req.user.id,
      type: "notice_deleted",
      entityType: "notice",
      entityId: id,
      title: "Notice deleted",
      description: `Notice ID ${id} was removed`
    });

    res.json({ message: "Notice deleted" });
  } catch (err) {
    console.error("deleteNotice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
