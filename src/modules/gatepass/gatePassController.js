const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");
const crypto = require("crypto");

exports.createGatePass = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { visitor_name, visitor_phone, vehicle_number, purpose, valid_to, number_of_people } = req.body;

  if (!visitor_name) {
    return res.status(400).json({ message: "visitor_name is required" });
  }

  if (!valid_to) {
    return res.status(400).json({ message: "valid_to is required" });
  }
  const validToDate = new Date(valid_to);
  if (isNaN(validToDate.getTime()) || validToDate <= new Date()) {
    return res.status(400).json({ message: "valid_to must be a future date" });
  }
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (validToDate > maxDate) {
    return res.status(400).json({ message: "Gate pass cannot be valid for more than 30 days" });
  }

  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const queryConditions = ["user_id = $1", "society_id = $2", "created_at > $3", "visitor_name = $4"];
    const queryParams = [userId, societyId, twoMinutesAgo, visitor_name];

    if (visitor_phone) {
      queryConditions.push(`visitor_phone = $${queryParams.length + 1}`);
      queryParams.push(visitor_phone);
    }

    const recentPassCheck = await pool.query(
      `SELECT id, created_at FROM gate_passes
             WHERE ${queryConditions.join(" AND ")}
             ORDER BY created_at DESC LIMIT 1`,
      queryParams
    );

    if (recentPassCheck.rows.length > 0) {
      const waitUntil = new Date(new Date(recentPassCheck.rows[0].created_at).getTime() + 2 * 60 * 1000);
      const remainingSeconds = Math.ceil((waitUntil - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before creating another pass.`,
        remainingSeconds,
        waitUntil: waitUntil.toISOString(),
      });
    }

    const qr_code = crypto.randomBytes(32).toString("hex");
    const numPeople = number_of_people && number_of_people > 0 ? number_of_people : 1;

    const result = await pool.query(
      `INSERT INTO gate_passes
             (user_id, visitor_name, visitor_phone, vehicle_number, purpose, qr_code, valid_until, society_id, number_of_people)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
      [userId, visitor_name, visitor_phone || "", vehicle_number || "", purpose || "", qr_code, validToDate, societyId, numPeople]
    );

    const gatePass = result.rows[0];

    await logActivity({
      userId,
      type: "gatepass_created",
      entityType: "gatepass",
      entityId: gatePass.id,
      title: "Gate Pass Created",
      description: `Pass for ${visitor_name}${numPeople > 1 ? ` (${numPeople} people)` : ""}`,
    });

    return res.status(201).json(gatePass);

  } catch (err) {
    console.error("createGatePass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGatePasses = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    let result;
    if (role === 'guard') {
      result = await pool.query(
        `SELECT * FROM gate_passes
               WHERE society_id = $1
               ORDER BY created_at DESC
               LIMIT $2 OFFSET $3`,
        [societyId, limit, offset]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM gate_passes
               WHERE user_id = $1 AND society_id = $2
               ORDER BY created_at DESC
               LIMIT $3 OFFSET $4`,
        [userId, societyId, limit, offset]
      );
    }
    return res.json(result.rows);
  } catch (err) {
    console.error("getGatePasses error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGatePassById = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const result = await pool.query(
      `SELECT * FROM gate_passes
             WHERE id = $1 AND society_id = $2
               AND ($3 = 'admin' OR $3 = 'guard' OR user_id = $4)`,
      [id, societyId, role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("getGatePassById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyGatePass = async (req, res) => {
  const { qrData } = req.body;
  const societyId = req.societyId;

  if (!qrData) return res.status(400).json({ message: "QR Data required" });

  try {
    const result = await pool.query(
      `SELECT * FROM gate_passes WHERE qr_code = $1 AND society_id = $2`,
      [qrData, societyId]
    );

    if (result.rows.length === 0) {
      return res.json({ isValid: false, reason: "Invalid QR Code" });
    }

    const pass = result.rows[0];
    const now = new Date();

    if (pass.valid_from && now < new Date(pass.valid_from)) {
      return res.json({ isValid: false, reason: "Not yet valid" });
    }
    if (now > new Date(pass.valid_until)) {
      return res.json({ isValid: false, reason: "Expired" });
    }
    if (pass.status === "EXPIRED") {
      return res.json({ isValid: false, reason: "Marked as expired" });
    }

    return res.json({ isValid: true, gatePass: pass });

  } catch (err) {
    console.error("verifyGatePass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markEntry = async (req, res) => {
  const { id } = req.params;
  const guardId = req.user.id;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `UPDATE gate_passes
             SET status = 'ENTERED', entry_time = NOW(), guard_id = $1, updated_at = NOW()
             WHERE id = $2
               AND society_id = $3
               AND status = 'PENDING'
               AND (valid_until IS NULL OR valid_until > NOW())
             RETURNING *`,
      [guardId, id, societyId]
    );

    if (result.rows.length === 0) {
      const check = await pool.query(
        `SELECT status, valid_until FROM gate_passes WHERE id = $1 AND society_id = $2`,
        [id, societyId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Gate pass not found" });
      }
      if (check.rows[0].status !== "PENDING") {
        return res.status(400).json({ message: `Cannot mark entry — pass status is ${check.rows[0].status}` });
      }
      return res.status(400).json({ message: "Gate pass has expired" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("markEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markExit = async (req, res) => {
  const { id } = req.params;
  const guardId = req.user.id;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `UPDATE gate_passes
             SET status = 'EXITED', exit_time = NOW(), guard_id = $1, updated_at = NOW()
             WHERE id = $2
               AND society_id = $3
               AND status = 'ENTERED'
             RETURNING *`,
      [guardId, id, societyId]
    );

    if (result.rows.length === 0) {
      const check = await pool.query(
        `SELECT status FROM gate_passes WHERE id = $1 AND society_id = $2`,
        [id, societyId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Gate pass not found" });
      }
      return res.status(400).json({ message: `Cannot mark exit — pass status is ${check.rows[0].status}` });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("markExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteGatePass = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `DELETE FROM gate_passes
             WHERE id = $1 AND user_id = $2 AND society_id = $3
             RETURNING *`,
      [id, userId, societyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found or unauthorized" });
    }

    return res.json({ message: "Deleted" });

  } catch (err) {
    console.error("deleteGatePass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
