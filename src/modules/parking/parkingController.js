const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");

exports.createSlot = async (req, res) => {
  const { slot_number, type, flat_number } = req.body;
  const societyId = req.societyId;

  if (!slot_number)
    return res.status(400).json({ message: "slot_number is required" });

  try {
    const result = await pool.query(
      `INSERT INTO parking_slots (slot_number, type, flat_number, society_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [slot_number, type || "resident", flat_number || null, societyId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createSlot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignSlot = async (req, res) => {
  const { slot_id, user_id } = req.body;

  if (!slot_id || !user_id)
    return res.status(400).json({ message: "slot_id and user_id required" });

  try {
    const flatRes = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [user_id]
    );

    const flat_number = flatRes.rows[0]?.flat_number || null;

    const updated = await pool.query(
      `UPDATE parking_slots
       SET assigned_to = $1, flat_number = $2, status = 'available'
       WHERE id = $3
       RETURNING *`,
      [user_id, flat_number, slot_id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("assignSlot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllSlots = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT ps.*, u.name AS owner_name, u.phone AS owner_phone
       FROM parking_slots ps
       LEFT JOIN users u ON ps.assigned_to = u.id
       WHERE ps.society_id = $1
       ORDER BY slot_number ASC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllSlots error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMySlot = async (req, res) => {
  const userId = req.user.id;

  try {
    const slot = await pool.query(
      `SELECT * FROM parking_slots WHERE assigned_to = $1`,
      [userId]
    );

    res.json(slot.rows[0] || {});
  } catch (err) {
    console.error("getMySlot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addVehicle = async (req, res) => {
  const userId = req.user.id;
  const { vehicle_number, vehicle_type, model, color } = req.body;

  if (!vehicle_number)
    return res.status(400).json({ message: "vehicle_number is required" });

  try {
    const user = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flat_number = user.rows[0]?.flat_number || null;

    const result = await pool.query(
      `INSERT INTO vehicles (user_id, flat_number, vehicle_number, vehicle_type, model, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, flat_number, vehicle_number, vehicle_type, model, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("addVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyVehicles = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyVehicles error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addVisitorVehicle = async (req, res) => {
  const guardId = req.user.id;
  const { visitor_name, vehicle_number, purpose, flat_number, slot_number } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO visitor_parking 
       (visitor_name, vehicle_number, purpose, flat_number, slot_number, guard_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        visitor_name,
        vehicle_number,
        purpose,
        flat_number,
        slot_number || null,
        guardId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("addVisitorVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.exitVisitorVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE visitor_parking
       SET out_time = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("exitVisitorVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getVisitorLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vp.*, u.name AS guard_name
       FROM visitor_parking vp
       LEFT JOIN users u ON vp.guard_id = u.id
       ORDER BY in_time DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getVisitorLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
