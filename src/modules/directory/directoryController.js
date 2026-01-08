const pool = require("../../config/db");

exports.getResidentDirectory = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT 
          u.id,
          u.name,
          u.phone,
          u.flat_number,
          u.block,
          u.floor,
          u.role,
          (SELECT COUNT(*) FROM flat_members fm WHERE fm.flat_number = u.flat_number AND fm.society_id = $1) AS members_count
       FROM users u
       WHERE u.role IN ('resident', 'admin') AND u.society_id = $1
       ORDER BY u.block ASC, u.floor ASC, u.flat_number ASC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getResidentDirectory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffDirectory = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT 
          s.*,
          s.name AS staff_name,
          s.role AS staff_role
       FROM staff s
       WHERE s.society_id = $1
       ORDER BY s.role ASC, s.name ASC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getStaffDirectory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchDirectory = async (req, res) => {
  const { q } = req.query;

  if (!q) return res.json([]);

  try {
    const result = await pool.query(
      `SELECT 
          u.id,
          u.name,
          u.phone,
          u.flat_number,
          u.block,
          u.floor,
          u.role
       FROM users u
       WHERE 
          (LOWER(u.name) LIKE LOWER($1)
           OR LOWER(u.flat_number) LIKE LOWER($1))
          AND u.role IN ('resident', 'admin')
       ORDER BY u.flat_number ASC`,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("searchDirectory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
