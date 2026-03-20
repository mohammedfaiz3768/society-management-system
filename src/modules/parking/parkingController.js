const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");

exports.createSlot = async (req, res) => {
  const { slot_number, type, flat_number } = req.body;
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create parking slots" });
  }

  if (!slot_number) {
    return res.status(400).json({ message: "slot_number is required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM parking_slots WHERE slot_number=$1 AND society_id=$2",
      [slot_number, societyId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Slot number already exists" });
    }

    const result = await pool.query(
      `INSERT INTO parking_slots (slot_number, type, flat_number, society_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
      [slot_number, type || "resident", flat_number || null, societyId]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("createSlot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignSlot = async (req, res) => {
  const { slot_id, user_id } = req.body;
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can assign parking slots" });
  }

  if (!slot_id || !user_id) {
    return res.status(400).json({ message: "slot_id and user_id required" });
  }

  try {
    const userCheck = await pool.query(
      "SELECT flat_number FROM users WHERE id=$1 AND society_id=$2",
      [user_id, societyId]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ message: "User not found in this society" });
    }

    const flat_number = userCheck.rows[0].flat_number || null;

    const updated = await pool.query(
      `UPDATE parking_slots
             SET assigned_to=$1, flat_number=$2, status='occupied'
             WHERE id=$3 AND society_id=$4
             RETURNING *`,
      [user_id, flat_number, slot_id, societyId]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: "Slot not found" });
    }

    return res.json(updated.rows[0]);

  } catch (err) {
    console.error("assignSlot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllSlots = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT ps.*, u.name AS owner_name, u.phone AS owner_phone
             FROM parking_slots ps
             LEFT JOIN users u ON ps.assigned_to = u.id
             WHERE ps.society_id=$1
             ORDER BY slot_number ASC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllSlots error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMySlot = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const slot = await pool.query(
      "SELECT * FROM parking_slots WHERE assigned_to=$1 AND society_id=$2",
      [userId, societyId]
    );

    return res.json(slot.rows[0] || null);

  } catch (err) {
    console.error("getMySlot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addVehicle = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { vehicle_number, vehicle_type, model, color } = req.body;

  if (!vehicle_number) {
    return res.status(400).json({ message: "vehicle_number is required" });
  }

  const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  if (!vehicleRegex.test(vehicle_number.toUpperCase())) {
    return res.status(400).json({ message: "Invalid vehicle number format (e.g. MH12AB1234)" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM vehicles WHERE vehicle_number=$1 AND society_id=$2",
      [vehicle_number.toUpperCase(), societyId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Vehicle already registered in this society" });
    }

    const userResult = await pool.query(
      "SELECT flat_number FROM users WHERE id=$1",
      [userId]
    );
    const flat_number = userResult.rows[0]?.flat_number || null;

    const result = await pool.query(
      `INSERT INTO vehicles (user_id, flat_number, vehicle_number, vehicle_type, model, color, society_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
      [userId, flat_number, vehicle_number.toUpperCase(), vehicle_type || null, model || null, color || null, societyId]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("addVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyVehicles = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM vehicles WHERE user_id=$1",
      [userId]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getMyVehicles error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addVisitorVehicle = async (req, res) => {
  const guardId = req.user.id;
  const societyId = req.societyId;
  const { visitor_name, vehicle_number, purpose, flat_number, slot_number } = req.body;

  if (!visitor_name || !vehicle_number) {
    return res.status(400).json({ message: "visitor_name and vehicle_number are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO visitor_parking
             (visitor_name, vehicle_number, purpose, flat_number, slot_number, guard_id, society_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
      [visitor_name, vehicle_number, purpose || null, flat_number || null, slot_number || null, guardId, societyId]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("addVisitorVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.exitVisitorVehicle = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `UPDATE visitor_parking
             SET out_time=NOW()
             WHERE id=$1 AND society_id=$2 AND out_time IS NULL
             RETURNING *`,
      [id, societyId]
    );

    if (!result.rows.length) {
      const check = await pool.query(
        "SELECT id, out_time FROM visitor_parking WHERE id=$1 AND society_id=$2",
        [id, societyId]
      );
      if (!check.rows.length) {
        return res.status(404).json({ message: "Visitor vehicle log not found" });
      }
      return res.status(400).json({ message: "Vehicle already marked as exited" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("exitVisitorVehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getVisitorLogs = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT vp.*, u.name AS guard_name
             FROM visitor_parking vp
             LEFT JOIN users u ON vp.guard_id = u.id
             WHERE vp.society_id=$1
             ORDER BY vp.in_time DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getVisitorLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
