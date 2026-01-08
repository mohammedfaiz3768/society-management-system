const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { generatePassCode } = require("../../utils/generatePassCode");
const { logActivity } = require("../../utils/activityLogger");

exports.createDeliveryPass = async (req, res) => {
  const userId = req.user.id;
  const { company, description, valid_minutes } = req.body;

  try {
    const user = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flat = user.rows[0]?.flat_number;
    const pass_code = generatePassCode();
    const validUntil = new Date(Date.now() + (valid_minutes || 120) * 60000);

    const result = await pool.query(
      `INSERT INTO delivery_pass (resident_id, flat_number, company, description, pass_code, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, flat, company, description, pass_code, validUntil]
    );

    const passEntry = result.rows[0];

    await logActivity({
      userId,
      type: "delivery_pass_created",
      entityType: "delivery_pass",
      entityId: passEntry.id,
      title: "Delivery pass created",
      description: `Company: ${company || "Unknown"}. Flat: ${flat}`
    });

    res.status(201).json(passEntry);
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

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("addDelivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deliveryEntry = async (req, res) => {
  const guardId = req.user.id;
  const { delivery_person, company, purpose, flat_number, pass_code } = req.body;

  try {
    let preapproved = false;

    if (pass_code) {
      const pass = await pool.query(
        `SELECT * FROM delivery_pass 
         WHERE pass_code = $1 AND used = FALSE`,
        [pass_code]
      );

      if (pass.rows.length > 0) {
        const p = pass.rows[0];
        const expired = new Date() > p.valid_until;

        if (!expired) {
          preapproved = true;

          await pool.query(
            `UPDATE delivery_pass SET used = TRUE WHERE id = $1`,
            [p.id]
          );

          sendNotification(
            p.resident_id,
            "Delivery Arrived",
            `${company || "Delivery"} reached your flat.`,
            "delivery_entry",
            req
          );
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO delivery_logs 
       (delivery_person, company, purpose, flat_number, guard_id, pass_code, preapproved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        delivery_person,
        company,
        purpose,
        flat_number,
        guardId,
        pass_code || null,
        preapproved
      ]
    );

    const entry = result.rows[0];

    await logActivity({
      userId: guardId,
      type: "delivery_entry",
      entityType: "delivery",
      entityId: entry.id,
      title: "Delivery entry logged",
      description: `${delivery_person} arrived for flat ${flat_number}`
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("deliveryEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deliveryExit = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE delivery_logs
       SET out_time = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    const exitEntry = result.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "delivery_exit",
      entityType: "delivery",
      entityId: id,
      title: "Delivery exit logged",
      description: `Delivery log ID ${id} marked exited`
    });

    res.json(exitEntry);
  } catch (err) {
    console.error("deliveryExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyDeliveries = async (req, res) => {
  const userId = req.user.id;

  try {
    const flatRes = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flat = flatRes.rows[0]?.flat_number;

    const logs = await pool.query(
      `SELECT * FROM delivery_logs WHERE flat_number = $1 ORDER BY in_time DESC`,
      [flat]
    );

    res.json(logs.rows);
  } catch (err) {
    console.error("getMyDeliveries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllDeliveries = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT * FROM deliveries WHERE society_id = $1 ORDER BY created_at DESC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllDeliveries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
