const pool = require("../../config/db");

exports.getResidentDirectory = async (req, res) => {
  const societyId = req.societyId;
  const role = req.user.role;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT
                u.id,
                u.name,
                -- ✅ Only admins see phone numbers — residents get NULL
                CASE WHEN $2 = 'admin' THEN u.phone ELSE NULL END AS phone,
                u.flat_number,
                u.block,
                u.floor,
                u.role,
                -- ✅ Fixed subquery to match flat_members schema
                (SELECT COUNT(*) FROM flat_members fm
                 JOIN flats f ON fm.flat_id = f.id
                 WHERE f.flat_number = u.flat_number
                   AND f.society_id = $1) AS members_count
             FROM users u
             WHERE u.role IN ('resident', 'admin')
               AND u.society_id = $1
             ORDER BY u.block ASC, u.floor ASC, u.flat_number ASC
             LIMIT $3 OFFSET $4`,
      [societyId, role, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getResidentDirectory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffDirectory = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.role, s.phone, s.shift_start, s.shift_end, s.status
             FROM staff s
             WHERE s.society_id = $1
             ORDER BY s.role ASC, s.name ASC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getStaffDirectory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchDirectory = async (req, res) => {
  const { q } = req.query;
  const societyId = req.societyId;
  const role = req.user.role;

  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const result = await pool.query(
      `SELECT
                u.id,
                u.name,
                -- ✅ Only admins see phone numbers
                CASE WHEN $3 = 'admin' THEN u.phone ELSE NULL END AS phone,
                u.flat_number,
                u.block,
                u.floor,
                u.role
             FROM users u
             WHERE (LOWER(u.name) LIKE LOWER($1) OR LOWER(u.flat_number) LIKE LOWER($1))
               AND u.role IN ('resident', 'admin')
               AND u.society_id = $2  -- ✅ Society scoped
             ORDER BY u.flat_number ASC
             LIMIT 50`,
      [`%${q.trim()}%`, societyId, role]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("searchDirectory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
