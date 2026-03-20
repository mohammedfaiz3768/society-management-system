const pool = require("../../config/db");

exports.getGlobalTimeline = async (req, res) => {
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT af.*, u.name AS user_name, u.role AS user_role
             FROM activity_feed af
             LEFT JOIN users u ON af.user_id = u.id
             WHERE af.society_id = $1
             ORDER BY af.created_at DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getGlobalTimeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyTimeline = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT af.*, u.name AS user_name, u.role AS user_role
             FROM activity_feed af
             LEFT JOIN users u ON af.user_id = u.id
             WHERE af.user_id = $1
               AND af.society_id = $2
               OR (
                 af.entity_type = 'flat'
                 AND af.society_id = $2
                 AND af.entity_id = (
                     SELECT id FROM flats
                     WHERE flat_number = (
                         SELECT flat_number FROM users WHERE id=$1
                     )
                     -- ✅ Society scoped subquery — no cross-society flat collision
                     AND society_id = $2
                 )
               )
             ORDER BY af.created_at DESC
             LIMIT $3 OFFSET $4`,
      [userId, societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getMyTimeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFilteredTimeline = async (req, res) => {
  const societyId = req.societyId;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { type, entity_type } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  const where = [`af.society_id = $1`];
  const params = [societyId];
  let idx = 2;

  if (type) {
    where.push(`af.action = $${idx++}`);
    params.push(type);
  }

  if (entity_type) {
    where.push(`af.entity_type = $${idx++}`);
    params.push(entity_type);
  }

  try {
    const result = await pool.query(
      `SELECT af.*, u.name AS user_name, u.role AS user_role
             FROM activity_feed af
             LEFT JOIN users u ON af.user_id = u.id
             WHERE ${where.join(" AND ")}
             ORDER BY af.created_at DESC
             LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getFilteredTimeline error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
