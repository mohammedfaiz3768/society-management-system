const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { generatePassCode } = require("../../utils/generatePassCode");
const { logActivity } = require("../../utils/activityLogger");

exports.createDeliveryPass = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { company, description, valid_minutes } = req.body;

  // ✅ Validate valid_minutes — min 15, max 24 hours
  const mins = parseInt(valid_minutes) || 120;
  if (mins < 15 || mins > 1440) {
    return res.status(400).json({ message: "valid_minutes must be between 15 and 1440" });
  }

  try {
    const userResult = await pool.query(
      "SELECT flat_number FROM users WHERE id=$1",
      [userId]
    );

    const flat = userResult.rows[0]?.flat_number;

    // ✅ Reject if user has no flat assigned
    if (!flat) {
      return res.status(400).json({
        message: "You must be assigned to a flat to create a delivery pass"
      });
    }

    const pass_code = generatePassCode();
    const validUntil = new Date(Date.now() + mins * 60000);

    const result = await pool.query(
      `INSERT INTO delivery_pass
             (resident_id, flat_number, company, description, pass_code, valid_until, society_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
      [userId, flat, company || null, description || null, pass_code, validUntil, societyId]
    );

    const passEntry = result.rows[0];

    await logActivity({
      userId,
      type: "delivery_pass_created",
      entityType: "delivery_pass",
      entityId: passEntry.id,
      title: "Delivery pass created",
      description: `Company: ${company || "Unknown"}. Flat: ${flat}`,
    });

    return res.status(201).json(passEntry);

  } catch (err) {
    console.error("createDeliveryPass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addDelivery = async (req, res) => {
  const { flat_number, recipient_name, phone, item_description } = req.body;
  const societyId = req.societyId;

  if (!flat_number) {
    return res.status(400).json({ message: "flat_number is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO deliveries (flat_number, recipient_name, phone, item_description, society_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      [flat_number, recipient_name || "", phone || "", item_description || "", societyId]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("addDelivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deliveryEntry = async (req, res) => {
  const guardId = req.user.id;
  const societyId = req.societyId;
  const { delivery_person, company, purpose, flat_number, pass_code } = req.body;

  // ✅ Required field validation
  if (!delivery_person || !flat_number) {
    return res.status(400).json({ message: "delivery_person and flat_number are required" });
  }

  try {
    let preapproved = false;

    if (pass_code) {
      // ✅ Society scoped pass code check
      const pass = await pool.query(
        `SELECT * FROM delivery_pass
                 WHERE pass_code=$1 AND used=FALSE AND society_id=$2`,
        [pass_code, societyId]
      );

      if (pass.rows.length > 0) {
        const p = pass.rows[0];

        if (new Date() <= new Date(p.valid_until)) {
          preapproved = true;

          await pool.query(
            "UPDATE delivery_pass SET used=TRUE WHERE id=$1",
            [p.id]
          );

          // Notify resident — non-blocking
          sendNotification(
            p.resident_id,
            "Delivery Arrived",
            `${company || "Delivery"} reached your flat.`,
            "delivery_entry",
            req
          ).catch(console.error);
        }
      }
    }

    // ✅ society_id added to INSERT
    const result = await pool.query(
      `INSERT INTO delivery_logs
             (delivery_person, company, purpose, flat_number, guard_id, pass_code, preapproved, society_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
      [delivery_person, company || null, purpose || null, flat_number, guardId, pass_code || null, preapproved, societyId]
    );

    const entry = result.rows[0];

    await logActivity({
      userId: guardId,
      type: "delivery_entry",
      entityType: "delivery",
      entityId: entry.id,
      title: "Delivery entry logged",
      description: `${delivery_person} arrived for flat ${flat_number}`,
    });

    return res.status(201).json(entry);

  } catch (err) {
    console.error("deliveryEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deliveryExit = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    // ✅ Society scoped, only if not already exited, existence check
    const result = await pool.query(
      `UPDATE delivery_logs
             SET out_time=NOW()
             WHERE id=$1 AND society_id=$2 AND out_time IS NULL
             RETURNING *`,
      [id, societyId]
    );

    if (!result.rows.length) {
      const check = await pool.query(
        "SELECT id, out_time FROM delivery_logs WHERE id=$1 AND society_id=$2",
        [id, societyId]
      );
      if (!check.rows.length) {
        return res.status(404).json({ message: "Delivery log not found" });
      }
      return res.status(400).json({ message: "Delivery already marked as exited" });
    }

    await logActivity({
      userId: req.user.id,
      type: "delivery_exit",
      entityType: "delivery",
      entityId: id,
      title: "Delivery exit logged",
      description: `Delivery log ID ${id} marked exited`,
    });

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("deliveryExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyDeliveries = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const flatRes = await pool.query(
      "SELECT flat_number FROM users WHERE id=$1",
      [userId]
    );

    const flat = flatRes.rows[0]?.flat_number;

    if (!flat) {
      return res.json([]);
    }

    // ✅ Society scoped
    const logs = await pool.query(
      `SELECT * FROM delivery_logs
             WHERE flat_number=$1 AND society_id=$2
             ORDER BY in_time DESC
             LIMIT $3 OFFSET $4`,
      [flat, societyId, limit, offset]
    );

    return res.json(logs.rows);

  } catch (err) {
    console.error("getMyDeliveries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllDeliveries = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM deliveries WHERE society_id=$1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllDeliveries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};