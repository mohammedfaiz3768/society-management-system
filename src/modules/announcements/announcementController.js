const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

const VALID_TYPES = ["general", "urgent", "maintenance", "event"];

exports.createAnnouncement = async (req, res) => {
  const adminId = req.user.id;
  const societyId = req.societyId;
  const { title, message, type } = req.body;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create announcements" });
  }

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  // ✅ Length validation
  if (title.length > 150) {
    return res.status(400).json({ message: "Title must be under 150 characters" });
  }
  if (message.length > 2000) {
    return res.status(400).json({ message: "Message must be under 2000 characters" });
  }

  // ✅ Type validation
  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({
      message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, message, type, created_by, society_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      [title, message, type || "general", adminId, societyId]
    );

    const announcement = result.rows[0];

    // Fetch resident IDs for notification
    const users = await pool.query(
      `SELECT id FROM users WHERE role = 'resident' AND society_id = $1`,
      [societyId]
    );

    // ✅ Parallel notifications, non-blocking, errors don't crash the response
    const notifyPromises = users.rows.map(u =>
      sendNotification(
        u.id,
        `New Announcement: ${title}`, // ✅ no trailing space
        message,
        "announcement_new",
        req
      )
    );
    Promise.allSettled(notifyPromises).catch(console.error);

    await logActivity({
      userId: adminId,
      type: "announcement_created",
      entityType: "announcement",
      entityId: announcement.id,
      title: "New announcement posted",
      description: title,
    });

    return res.status(201).json(announcement);

  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete announcements" });
  }

  try {
    // ✅ Check existence via RETURNING
    const result = await pool.query(
      `DELETE FROM announcements WHERE id = $1 AND society_id = $2 RETURNING id`,
      [id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await logActivity({
      userId: req.user.id,
      type: "announcement_deleted",
      entityType: "announcement",
      entityId: id,
      title: "Announcement deleted",
      description: `Announcement ID ${id} removed`,
    });

    return res.json({ message: "Announcement deleted" });

  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAnnouncements = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS admin_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             WHERE a.society_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAnnouncements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAnnouncementById = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS admin_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             WHERE a.id = $1 AND a.society_id = $2`,
      [id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("getAnnouncementById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};