const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createFlat = async (req, res) => {
  const { flat_number, block, floor, owner_id } = req.body;
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create flats" });
  }

  if (!flat_number) {
    return res.status(400).json({ message: "flat_number is required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM flats WHERE flat_number=$1 AND society_id=$2",
      [flat_number, societyId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Flat number already exists in this society" });
    }

    if (owner_id) {
      const ownerCheck = await pool.query(
        "SELECT id FROM users WHERE id=$1 AND society_id=$2",
        [owner_id, societyId]
      );
      if (!ownerCheck.rows.length) {
        return res.status(404).json({ message: "Owner not found in this society" });
      }
    }

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
      description: `Flat ${flat_number} (${block || "Block N/A"})`,
    });

    return res.status(201).json(flat);

  } catch (err) {
    console.error("createFlat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignResident = async (req, res) => {
  const { flat_id, user_id } = req.body;
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can assign residents to flats" });
  }

  if (!flat_id || !user_id) {
    return res.status(400).json({ message: "flat_id and user_id are required" });
  }

  const client = await pool.connect();
  try {
    const userCheck = await client.query(
      "SELECT id FROM users WHERE id=$1 AND society_id=$2",
      [user_id, societyId]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ message: "User not found in this society" });
    }

    await client.query("BEGIN");

    const updated = await client.query(
      `UPDATE flats SET owner_id=$1
             WHERE id=$2 AND society_id=$3
             RETURNING *`,
      [user_id, flat_id, societyId]
    );

    if (!updated.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Flat not found" });
    }

    const flat = updated.rows[0];

    await client.query(
      "UPDATE users SET flat_number=$1 WHERE id=$2",
      [flat.flat_number, user_id]
    );

    await client.query("COMMIT");

    await logActivity({
      userId: req.user.id,
      type: "resident_assigned",
      entityType: "flat",
      entityId: flat_id,
      title: "Resident assigned to flat",
      description: `User ID ${user_id} assigned to flat ${flat.flat_number}`,
    });

    return res.json(flat);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("assignResident error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

exports.getAllFlats = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT f.*, u.name AS owner_name
             FROM flats f
             LEFT JOIN users u ON f.owner_id = u.id
             WHERE f.society_id=$1
             ORDER BY f.block ASC, f.flat_number ASC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllFlats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyFlat = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const flatNum = await pool.query(
      "SELECT flat_number FROM users WHERE id=$1",
      [userId]
    );

    if (!flatNum.rows.length || !flatNum.rows[0].flat_number) {
      return res.status(404).json({ message: "You are not assigned to any flat" });
    }

    const result = await pool.query(
      "SELECT * FROM flats WHERE flat_number=$1 AND society_id=$2",
      [flatNum.rows[0].flat_number, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Flat not found" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("getMyFlat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addFlatMember = async (req, res) => {
  const addedBy = req.user.id;
  const societyId = req.societyId;
  const { flat_id, name, phone, relation } = req.body;

  if (!flat_id || !name) {
    return res.status(400).json({ message: "flat_id and name are required" });
  }

  try {
    const flatCheck = await pool.query(
      `SELECT id FROM flats
             WHERE id=$1 AND society_id=$2
               AND ($3='admin' OR owner_id=$4)`,
      [flat_id, societyId, req.user.role, addedBy]
    );

    if (!flatCheck.rows.length) {
      return res.status(403).json({ message: "Flat not found or not authorized" });
    }

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
      description: `${name} added to flat ID ${flat_id}`,
    });

    return res.status(201).json(member);

  } catch (err) {
    console.error("addFlatMember error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyMembers = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const members = await pool.query(
      `SELECT fm.* FROM flat_members fm
             JOIN flats f ON fm.flat_id = f.id
             JOIN users u ON u.flat_number = f.flat_number
                          AND u.society_id = f.society_id
             WHERE u.id=$1 AND f.society_id=$2`,
      [userId, societyId]
    );

    return res.json(members.rows);

  } catch (err) {
    console.error("getMyMembers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
