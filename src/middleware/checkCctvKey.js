const db = require("../config/db");

module.exports = async function(req, res, next) {
  const { key } = req.query;
  const cameraId = req.params.cameraId;

  if (!key) return res.status(401).json({ error: "Access key required" });

  const { rows } = await db.query(
    `SELECT * FROM cctv_temp_keys
     WHERE access_key=$1 AND camera_id=$2 AND expires_at > NOW()`,
    [key, cameraId]
  );

  if (!rows.length)
    return res.status(403).json({ error: "Invalid or expired key" });

  req.tempAccess = rows[0];
  next();
};
