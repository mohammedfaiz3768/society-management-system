const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

exports.createEvent = async (req, res) => {
  const adminId = req.user.id;
  const { title, description, date, start_time, end_time, location, type } = req.body;

  if (!title || !date) {
    return res.status(400).json({ message: "Title and date are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events 
        (title, description, date, start_time, end_time, location, type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description,
        date,
        start_time || null,
        end_time || null,
        location || "",
        type || "event",
        adminId
      ]
    );

    const event = result.rows[0];

    const users = await pool.query(`SELECT id FROM users WHERE role = 'resident'`);
    for (let user of users.rows) {
      sendNotification(
        user.id,
        `New ${type === "meeting" ? "Meeting" : "Event"}: ${title}`,
        description || "",
        "event_new",
        req
      );
    }

    await logActivity({
      userId: adminId,
      type: "event_created",
      entityType: "event",
      entityId: event.id,
      title: `New ${type === "meeting" ? "Meeting" : "Event"} created`,
      description: title
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, date, start_time, end_time, location, type } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE events
       SET title = $1,
           description = $2,
           date = $3,
           start_time = $4,
           end_time = $5,
           location = $6,
           type = $7
       WHERE id = $8
       RETURNING *`,
      [title, description, date, start_time, end_time, location, type, id]
    );

    if (updated.rows.length === 0)
      return res.status(404).json({ message: "Event not found" });

    const event = updated.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "event_updated",
      entityType: "event",
      entityId: id,
      title: "Event updated",
      description: event.title
    });

    res.json(event);
  } catch (err) {
    console.error("updateEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM events WHERE id = $1`, [id]);

    await logActivity({
      userId: req.user.id,
      type: "event_deleted",
      entityType: "event",
      entityId: id,
      title: "Event deleted",
      description: `Event ID ${id} removed`
    });

    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM events 
       WHERE date >= CURRENT_DATE
       ORDER BY date ASC, start_time ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getUpcomingEvents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPastEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM events 
       WHERE date < CURRENT_DATE
       ORDER BY date DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getPastEvents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM events WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Event not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getEventById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
