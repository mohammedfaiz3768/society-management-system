const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");

// AUTO STATUS HANDLER (helper)
async function autoUpdateStatus() {
  await pool.query(`
    UPDATE outages 
    SET status = 'active'
    WHERE status = 'scheduled'
      AND start_time <= NOW()
      AND end_time > NOW()
  `);

  await pool.query(`
    UPDATE outages 
    SET status = 'completed'
    WHERE end_time <= NOW()
      AND status != 'completed'
      AND status != 'cancelled'
  `);
}

// ADMIN: create outage
exports.createOutage = async (req, res) => {
  const adminId = req.user.id;
  const { type, title, description, start_time, end_time } = req.body;

  if (!type || !title || !start_time || !end_time) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO outages 
      (type, title, description, start_time, end_time, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [type, title, description, start_time, end_time, adminId]
    );

    const outage = result.rows[0];

    // Notify all residents
    const residents = await pool.query(
      `SELECT id FROM users WHERE role='resident'`
    );

    for (let r of residents.rows) {
      sendNotification(
        r.id,
        `${type.toUpperCase()} Outage Scheduled`,
        title,
        "outage_new",
        req
      );
    }

    res.status(201).json(outage);
  } catch (err) {
    console.error("createOutage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: update outage
exports.updateOutage = async (req, res) => {
  const { id } = req.params;
  const { type, title, description, start_time, end_time, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE outages SET
        type=$1, title=$2, description=$3, start_time=$4, end_time=$5, status=$6
       WHERE id=$7
       RETURNING *`,
      [type, title, description, start_time, end_time, status, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Outage not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateOutage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: cancel outage
exports.cancelOutage = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE outages SET status='cancelled' WHERE id=$1`,
      [id]
    );

    res.json({ message: "Outage cancelled" });
  } catch (err) {
    console.error("cancelOutage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// RESIDENT + ADMIN: Get all outages
exports.getAllOutages = async (req, res) => {
  try {
    await autoUpdateStatus();

    const result = await pool.query(
      `SELECT o.*, u.name AS admin_name
       FROM outages o
       LEFT JOIN users u ON o.created_by = u.id
       ORDER BY start_time DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllOutages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// RESIDENT + ADMIN: Get upcoming outages
exports.getUpcomingOutages = async (req, res) => {
  try {
    await autoUpdateStatus();

    const result = await pool.query(
      `SELECT * FROM outages
       WHERE start_time > NOW()
       ORDER BY start_time ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getUpcomingOutages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// RESIDENT + ADMIN: Get active outages
exports.getActiveOutages = async (req, res) => {
  try {
    await autoUpdateStatus();

    const result = await pool.query(
      `SELECT * FROM outages
       WHERE status = 'active'
       ORDER BY start_time ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getActiveOutages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

