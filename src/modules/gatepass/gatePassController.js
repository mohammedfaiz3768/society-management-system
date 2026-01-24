const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");
const crypto = require("crypto");

exports.createGatePass = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { visitor_name, visitor_phone, vehicle_number, purpose, valid_to } = req.body;

  if (!visitor_name) {
    return res.status(400).json({ message: "visitor_name is required" });
  }

  try {
    const qr_code = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await pool.query(
      `INSERT INTO gate_passes (user_id, visitor_name, visitor_phone, vehicle_number, purpose, qr_code, valid_until, society_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, visitor_name, visitor_phone || "", vehicle_number || "", purpose || "", qr_code, valid_to, societyId]
    );

    const gatePass = result.rows[0];

    await logActivity({
      userId,
      type: "gatepass_created",
      entityType: "gatepass",
      entityId: gatePass.id,
      title: "Gate Pass Created",
      description: `Pass for ${guestName} (${type})`
    });

    res.status(201).json(gatePass);
  } catch (err) {
    console.error("createGatePass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGatePasses = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT * FROM gate_passes WHERE user_id = $1 AND society_id = $2 ORDER BY created_at DESC`,
      [userId, societyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getGatePasses error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGatePassById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM gate_passes WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("getGatePassById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyGatePass = async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.status(400).json({ message: "QR Data required" });

  try {
    const result = await pool.query(`SELECT * FROM gate_passes WHERE qr_code = $1`, [qrData]);

    if (result.rows.length === 0) {
      return res.json({ isValid: false, reason: "Invalid QR Code" });
    }

    const pass = result.rows[0];
    const now = new Date();

    if (now < new Date(pass.valid_from)) return res.json({ isValid: false, gatePass: pass, reason: "Not yet valid" });
    if (now > new Date(pass.valid_to)) return res.json({ isValid: false, gatePass: pass, reason: "Expired" });
    if (pass.status === 'EXPIRED') return res.json({ isValid: false, gatePass: pass, reason: "Marked as Expired" });

    // Valid
    res.json({ isValid: true, gatePass: pass });
  } catch (err) {
    console.error("verifyGatePass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markEntry = async (req, res) => {
  const { id } = req.params;
  const guardId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE gate_passes 
       SET status = 'ENTERED', entry_time = NOW(), guard_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [guardId, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });

    // Notify resident

    res.json(result.rows[0]);
  } catch (err) {
    console.error("markEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markExit = async (req, res) => {
  const { id } = req.params;
  const guardId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE gate_passes 
         SET status = 'EXITED', exit_time = NOW(), guard_id = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
      [guardId, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("markExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteGatePass = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query("DELETE FROM gate_passes WHERE id = $1 AND user_id = $2 RETURNING *", [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteGatePass error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
