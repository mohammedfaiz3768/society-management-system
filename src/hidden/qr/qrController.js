const pool = require("../../config/db");
const { generateQrString } = require("../../utils/generateQrCode");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger"); // ➕ added

// RESIDENT: Generate / Regenerate QR code
exports.generateResidentQr = async (req, res) => {
  const userId = req.user.id;

  try {
    // get user flat
    const user = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flat = user.rows[0]?.flat_number;

    if (!flat)
      return res.status(400).json({ message: "User has no flat assigned" });

    const qr = generateQrString();

    // delete old QR if exists
    await pool.query(`DELETE FROM resident_qr WHERE user_id = $1`, [userId]);

    // insert new qr
    const result = await pool.query(
      `INSERT INTO resident_qr (user_id, flat_number, qr_code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, flat, qr]
    );

    const qrEntry = result.rows[0];

    // 🟦 Log Activity
    await logActivity({
      userId,
      type: "qr_generated",
      entityType: "qr",
      entityId: qrEntry.id,
      title: "Resident QR generated",
      description: `QR generated for flat ${flat}`
    });

    res.json(qrEntry);
  } catch (err) {
    console.error("generateResidentQr error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// RESIDENT: Get my QR code
exports.getMyQr = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM resident_qr WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("getMyQr error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// RESIDENT: Create visitor QR pre-approval
exports.createVisitorQr = async (req, res) => {
  const userId = req.user.id;
  const { visitor_name, valid_minutes } = req.body;

  if (!visitor_name)
    return res.status(400).json({ message: "visitor_name is required" });

  try {
    // get flat
    const user = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flat = user.rows[0]?.flat_number;

    const qr = generateQrString();
    const validUntil = new Date(Date.now() + (valid_minutes || 60) * 60000);

    const result = await pool.query(
      `INSERT INTO visitor_qr (resident_id, flat_number, visitor_name, qr_code, valid_until)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, flat, visitor_name, qr, validUntil]
    );

    const qrEntry = result.rows[0];

    // 🟧 Log Activity
    await logActivity({
      userId,
      type: "visitor_qr_created",
      entityType: "visitor_qr",
      entityId: qrEntry.id,
      title: "Visitor QR created",
      description: `Visitor: ${visitor_name}, Flat: ${flat}`
    });

    res.json(qrEntry);
  } catch (err) {
    console.error("createVisitorQr error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GUARD: Scan QR code
exports.scanQr = async (req, res) => {
  const guardId = req.user.id;
  const { qr_code } = req.body;

  try {
    // Check resident QR
    const residentQR = await pool.query(
      `SELECT user_id, flat_number FROM resident_qr WHERE qr_code = $1`,
      [qr_code]
    );

    if (residentQR.rows.length > 0) {
      const data = residentQR.rows[0];

      await pool.query(
        `INSERT INTO qr_scan_logs (qr_type, qr_code, scanned_by, result)
         VALUES ('resident', $1, $2, 'allowed')`,
        [qr_code, guardId]
      );

      // 🟩 Log Activity
      await logActivity({
        userId: guardId,
        type: "qr_scan_success",
        entityType: "qr_scan",
        entityId: null,
        title: "Resident QR scan success",
        description: `Flat ${data.flat_number}`
      });

      return res.json({
        type: "resident",
        allowed: true,
        flat_number: data.flat_number,
        message: "Resident entry allowed"
      });
    }

    // Check visitor QR
    const visitorQR = await pool.query(
      `SELECT * FROM visitor_qr WHERE qr_code = $1`,
      [qr_code]
    );

    if (visitorQR.rows.length > 0) {
      const v = visitorQR.rows[0];

      const now = new Date();
      const expired = now > v.valid_until;

      await pool.query(
        `INSERT INTO qr_scan_logs (qr_type, qr_code, scanned_by, result, reason)
         VALUES ('visitor', $1, $2, $3, $4)`,
        [
          qr_code,
          guardId,
          expired ? "denied" : "allowed",
          expired ? "QR Code Expired" : "Valid visitor QR"
        ]
      );

      // 🟦 Log Activity
      await logActivity({
        userId: guardId,
        type: expired ? "qr_scan_failed" : "qr_scan_success",
        entityType: "qr_scan",
        entityId: null,
        title: expired
          ? "Visitor QR expired"
          : "Visitor QR scan success",
        description: `Visitor: ${v.visitor_name}, Flat: ${v.flat_number}`
      });

      return res.json({
        type: "visitor",
        allowed: !expired,
        flat_number: v.flat_number,
        visitor_name: v.visitor_name,
        message: expired ? "QR expired - deny entry" : "Visitor entry allowed"
      });
    }

    // No match → invalid QR
    await pool.query(
      `INSERT INTO qr_scan_logs (qr_type, qr_code, scanned_by, result, reason)
       VALUES ('unknown', $1, $2, 'denied', 'Invalid QR')`,
      [qr_code, guardId]
    );

    // 🟥 Log Activity
    await logActivity({
      userId: guardId,
      type: "qr_scan_failed",
      entityType: "qr_scan",
      entityId: null,
      title: "Invalid QR scanned",
      description: `QR: ${qr_code}`
    });

    res.json({
      allowed: false,
      message: "Invalid QR Code"
    });
  } catch (err) {
    console.error("scanQr error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: View QR logs
exports.getQrLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, u.name AS guard_name
      FROM qr_scan_logs q
      LEFT JOIN users u ON q.scanned_by = u.id
      ORDER BY scan_time DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getQrLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
