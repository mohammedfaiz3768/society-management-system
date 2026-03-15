const db = require("../../config/db");

exports.addCamera = async (req, res) => {
  try {
    const { name, location, rtsp_url } = req.body;

    const result = await db.query(
      `INSERT INTO cctv_cameras (name, location, rtsp_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, location, rtsp_url]
    );

    res.json({ success: true, camera: result.rows[0] });
  } catch (err) {
    console.error("Add camera error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.listCameras = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM cctv_cameras ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.assignCamera = async (req, res) => {
  try {
    const { user_id, camera_id } = req.body;
    await db.query(
      `INSERT INTO cctv_access (user_id, camera_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user_id, camera_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("assign camera error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMyCameras = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT c.*
       FROM cctv_cameras c
       JOIN cctv_access a ON a.camera_id = c.id
       WHERE a.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("get my cameras error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


const ffmpeg = require("fluent-ffmpeg");
exports.getSnapshot = async (req, res) => {
  const { id } = req.params;

  const cam = await db.query(`SELECT * FROM cctv_cameras WHERE id=$1`, [id]);
  if (!cam.rows.length) return res.status(404).json({ error: "Camera not found" });

  const rtsp = cam.rows[0].rtsp_url;

  const filePath = `snapshots/cam_${id}_${Date.now()}.jpg`;

  ffmpeg(rtsp)
    .frames(1)
    .save(filePath)
    .on("end", () => {
      res.json({ snapshot: filePath });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Snapshot error" });
    });
};
