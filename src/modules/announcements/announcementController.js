const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

exports.createAnnouncement = async (req, res) => {
  const adminId = req.user.id;
  const societyId = req.societyId; 
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO announcements(title, message, type, created_by, society_id)
VALUES($1, $2, $3, $4, $5)
RETURNING * `,
      [title, message, type || "general", adminId, societyId]
    );

    const announcement = result.rows[0];

    const users = await pool.query(
      `SELECT id FROM users WHERE role = 'resident' AND society_id = $1`,
      [societyId]
    );

    for (let u of users.rows) {
      sendNotification(
        u.id,
        `New Announcement: ${title} `,
        message,
        "announcement_new",
        req
      );
    }

    await logActivity({
      userId: adminId,
      type: "announcement_created",
      entityType: "announcement",
      entityId: announcement.id,
      title: "New announcement posted",
      description: title
    });

    res.status(201).json(announcement);
  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId; 

  try {
    await pool.query(`DELETE FROM announcements WHERE id = $1 AND society_id = $2`, [id, societyId]);

    await logActivity({
      userId: req.user.id,
      type: "announcement_deleted",
      entityType: "announcement",
      entityId: id,
      title: "Announcement deleted",
      description: `Announcement ID ${id} removed`
    });

    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAnnouncements = async (req, res) => {
  const societyId = req.societyId; 

  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS admin_name 
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.society_id = $1
       ORDER BY created_at DESC`,
      [societyId]
    );

    res.json(result.rows);
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

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getAnnouncementById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
