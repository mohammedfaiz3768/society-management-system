const pool = require("../../config/db");

exports.getGlobalTimeline = async (req, res) => {
  const limit = parseInt(req.query.limit || "50", 10);
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT af.*, u.name AS user_name, u.role AS user_role
       FROM activity_feed af
       LEFT JOIN users u ON af.user_id = u.id
       WHERE af.society_id = $1
       ORDER BY af.created_at DESC
       LIMIT $2`,
      [societyId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getGlobalTimeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyTimeline = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit || "50", 10);

  try {
    const result = await pool.query(
      `SELECT af.*, u.name AS user_name, u.role AS user_role
       FROM activity_feed af
       LEFT JOIN users u ON af.user_id = u.id
       WHERE af.user_id = $1
          OR (af.entity_type = 'flat' AND af.entity_id = (
                SELECT id FROM flats WHERE flat_number = (
                  SELECT flat_number FROM users WHERE id = $1
                )
             ))
       ORDER BY af.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyTimeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFilteredTimeline = async (req, res) => {
  const { type, entity_type } = req.query;
  const limit = parseInt(req.query.limit || "50", 10);

  let where = [];
  let params = [];
  let idx = 1;

  if (type) {
    where.push(`af.type = $${idx++}`);
    params.push(type);
  }

  if (entity_type) {
    where.push(`af.entity_type = $${idx++}`);
    params.push(entity_type);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT af.*, u.name AS user_name, u.role AS user_role
       FROM activity_feed af
       LEFT JOIN users u ON af.user_id = u.id
       ${whereClause}
       ORDER BY af.created_at DESC
       LIMIT $${idx}`,
      [...params, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getFilteredTimeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
