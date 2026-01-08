const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createFlat = async (req, res) => {
  const { flat_number, block, floor, owner_id } = req.body;
  const societyId = req.societyId;

  if (!flat_number) {
    return res.status(400).json({ message: "flat_number is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO flats (flat_number, block, floor, owner_id, society_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [flat_number, block || "", floor || null, owner_id || null, societyId]
    );

    const flat = result.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "flat_created",
      entityType: "flat",
      entityId: flat.id,
      title: "New flat created",
      description: `Flat ${flat_number} (${block || "Block N/A"})`
    });

    res.status(201).json(flat);
  } catch (err) {
    console.error("createFlat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignResident = async (req, res) => {
  const { flat_id, user_id } = req.body;

  if (!flat_id || !user_id) {
    return res.status(400).json({ message: "flat_id and user_id are required" });
  }

  try {
    const updated = await pool.query(
      `UPDATE flats SET owner_id = $1 WHERE id = $2 RETURNING *`,
      [user_id, flat_id]
    );

    await pool.query(
      `UPDATE users SET flat_number = (
        SELECT flat_number FROM flats WHERE id = $1
       ) WHERE id = $2`,
      [flat_id, user_id]
    );

    const flat = updated.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "resident_assigned",
      entityType: "flat",
      entityId: flat_id,
      title: "Resident assigned to flat",
      description: `User ID ${user_id} assigned to flat ${flat.flat_number}`
    });

    res.json(flat);
  } catch (err) {
    console.error("assignResident error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllFlats = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT f.*, u.name AS owner_name 
       FROM flats f
       LEFT JOIN users u ON f.owner_id = u.id
       WHERE f.society_id = $1
       ORDER BY f.block ASC, f.flat_number ASC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllFlats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyFlat = async (req, res) => {
  const userId = req.user.id;

  try {
    const flatNum = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    if (flatNum.rows.length === 0) {
      return res.status(404).json({ message: "You are not assigned to any flat" });
    }

    const result = await pool.query(
      `SELECT * FROM flats WHERE flat_number = $1`,
      [flatNum.rows[0].flat_number]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getMyFlat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addFlatMember = async (req, res) => {
  const addedBy = req.user.id;
  const { flat_id, name, phone, relation } = req.body;

  if (!flat_id || !name) {
    return res.status(400).json({ message: "flat_id and name are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO flat_members (flat_id, name, phone, relation, added_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [flat_id, name, phone || "", relation || "", addedBy]
    );

    const member = result.rows[0];

    await logActivity({
      userId: addedBy,
      type: "flat_member_added",
      entityType: "flat_member",
      entityId: member.id,
      title: "Flat member added",
      description: `${name} added to flat ID ${flat_id}`
    });

    res.status(201).json(member);
  } catch (err) {
    console.error("addFlatMember error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyMembers = async (req, res) => {
  const userId = req.user.id;

  try {
    const flatQuery = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    if (flatQuery.rows.length === 0) {
      return res.status(404).json({ message: "You are not assigned to a flat" });
    }

    const flatNumber = flatQuery.rows[0].flat_number;

    const flatIdQuery = await pool.query(
      `SELECT id FROM flats WHERE flat_number = $1`,
      [flatNumber]
    );

    const flatId = flatIdQuery.rows[0].id;

    const members = await pool.query(
      `SELECT * FROM flat_members WHERE flat_id = $1`,
      [flatId]
    );

    res.json(members.rows);
  } catch (err) {
    console.error("getMyMembers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
