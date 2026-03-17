const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

const VALID_AUDIENCES = ["all", "residents", "guards", "staff", "admin"];
const VALID_CATEGORIES = ["general", "maintenance", "event", "urgent", "finance"];

exports.createNotice = async (req, res) => {
  const { title, content, category, pinned, audience } = req.body;
  const createdBy = req.user.id;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create notices" });
  }

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  // ✅ Length validation
  if (title.length > 150) {
    return res.status(400).json({ message: "Title must be under 150 characters" });
  }
  if (content.length > 3000) {
    return res.status(400).json({ message: "Content must be under 3000 characters" });
  }

  // ✅ Audience validation
  if (audience && !VALID_AUDIENCES.includes(audience)) {
    return res.status(400).json({
      message: `Invalid audience. Must be one of: ${VALID_AUDIENCES.join(", ")}`
    });
  }

  // ✅ Category validation
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notices (title, content, category, created_by, society_id, pinned, audience)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
      [title, content, category || "general", createdBy, societyId, pinned || false, audience || "all"]
    );

    const notice = result.rows[0];

    await logActivity({
      userId: createdBy,
      type: "notice_created",
      entityType: "notice",
      entityId: notice.id,
      title: "New notice created",
      description: title,
    });

    return res.status(201).json(notice);

  } catch (err) {
    console.error("createNotice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllNotices = async (req, res) => {
  const societyId = req.societyId;
  const role = req.user.role;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    // ✅ Admins see all notices — others only see notices for their role or "all"
    const result = await pool.query(
      `SELECT n.*, u.name AS created_by_name
             FROM notices n
             LEFT JOIN users u ON n.created_by = u.id
             WHERE n.society_id = $1
               AND ($2 = 'admin' OR n.audience = 'all' OR n.audience = $2)
             ORDER BY n.pinned DESC, n.created_at DESC
             LIMIT $3 OFFSET $4`,
      [societyId, role, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getNotices error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getNoticeById = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;
  const role = req.user.role;

  try {
    // ✅ Scoped to society + audience filter
    const result = await pool.query(
      `SELECT n.*, u.name AS created_by_name
             FROM notices n
             LEFT JOIN users u ON n.created_by = u.id
             WHERE n.id = $1
               AND n.society_id = $2
               AND ($3 = 'admin' OR n.audience = 'all' OR n.audience = $3)`,
      [id, societyId, role]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("getNoticeById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateNotice = async (req, res) => {
  const { id } = req.params;
  const { title, content, pinned, audience } = req.body; // ✅ 'content' not 'body'
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update notices" });
  }

  // ✅ Audience validation if provided
  if (audience && !VALID_AUDIENCES.includes(audience)) {
    return res.status(400).json({
      message: `Invalid audience. Must be one of: ${VALID_AUDIENCES.join(", ")}`
    });
  }

  try {
    // ✅ Society scoped SELECT
    const old = await pool.query(
      "SELECT * FROM notices WHERE id = $1 AND society_id = $2",
      [id, societyId]
    );

    if (!old.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    // ✅ Society scoped UPDATE, consistent 'content' column name
    const updated = await pool.query(
      `UPDATE notices
             SET title    = $1,
                 content  = $2,
                 pinned   = $3,
                 audience = $4,
                 updated_at = NOW()
             WHERE id = $5 AND society_id = $6
             RETURNING *`,
      [
        title ?? old.rows[0].title,
        content ?? old.rows[0].content,
        pinned ?? old.rows[0].pinned,
        audience ?? old.rows[0].audience,
        id,
        societyId,
      ]
    );

    await logActivity({
      userId: req.user.id,
      type: "notice_updated",
      entityType: "notice",
      entityId: id,
      title: "Notice updated",
      description: title || old.rows[0].title,
    });

    return res.json(updated.rows[0]);

  } catch (err) {
    console.error("updateNotice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteNotice = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete notices" });
  }

  try {
    // ✅ Society scoped + existence check via RETURNING
    const result = await pool.query(
      "DELETE FROM notices WHERE id = $1 AND society_id = $2 RETURNING id",
      [id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await logActivity({
      userId: req.user.id,
      type: "notice_deleted",
      entityType: "notice",
      entityId: id,
      title: "Notice deleted",
      description: `Notice ID ${id} was removed`,
    });

    return res.json({ message: "Notice deleted" });

  } catch (err) {
    console.error("deleteNotice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};