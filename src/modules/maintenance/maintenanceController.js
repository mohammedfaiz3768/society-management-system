const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createBill = async (req, res) => {
  const { flat_number, user_id, month, year, amount, due_date, notes } = req.body;
  const societyId = req.societyId;

  if (!flat_number || !month || !year || !amount) {
    return res.status(400).json({ message: "flat_number, month, year, amount are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO maintenance_bills
        (flat_number, user_id, month, year, amount, due_date, notes, society_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [flat_number, user_id || null, month, year, amount, due_date || null, notes || "", societyId]
    );

    const bill = result.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "bill_created",
      entityType: "maintenance_bill",
      entityId: bill.id,
      title: "Maintenance bill created",
      description: `Flat ${flat_number} - ${month}/${year}, Amount: ${amount}`
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error("createBill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllBills = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT * FROM maintenance_bills
       WHERE society_id = $1
       ORDER BY year DESC, month DESC, flat_number ASC`,
      [societyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllBills error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBill = async (req, res) => {
  const { id } = req.params;
  const { amount, status, due_date, paid_date, notes } = req.body;

  try {
    const old = await pool.query(
      `SELECT * FROM maintenance_bills WHERE id = $1`,
      [id]
    );

    if (old.rows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const prev = old.rows[0];

    const updated = await pool.query(
      `UPDATE maintenance_bills
       SET amount = $1,
           status = $2,
           due_date = $3,
           paid_date = $4,
           notes = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        amount !== undefined ? amount : prev.amount,
        status || prev.status,
        due_date || prev.due_date,
        paid_date || prev.paid_date,
        notes !== undefined ? notes : prev.notes,
        id
      ]
    );

    const newBill = updated.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "bill_updated",
      entityType: "maintenance_bill",
      entityId: id,
      title: "Maintenance bill updated",
      description: `Updated bill ID ${id} (Flat ${prev.flat_number})`
    });

    res.json(newBill);
  } catch (err) {
    console.error("updateBill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteBill = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM maintenance_bills WHERE id = $1`, [id]);

    await logActivity({
      userId: req.user.id,
      type: "bill_deleted",
      entityType: "maintenance_bill",
      entityId: id,
      title: "Maintenance bill deleted",
      description: `Bill ID ${id} removed`
    });

    res.json({ message: "Bill deleted" });
  } catch (err) {
    console.error("deleteBill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyBills = async (req, res) => {
  const userId = req.user.id;

  try {
    const userResult = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const flatNumber = userResult.rows[0].flat_number;

    if (!flatNumber) {
      return res.status(400).json({ message: "Your flat_number is not set" });
    }

    const bills = await pool.query(
      `SELECT * FROM maintenance_bills
       WHERE flat_number = $1
       ORDER BY year DESC, month DESC`,
      [flatNumber]
    );

    res.json(bills.rows);
  } catch (err) {
    console.error("getMyBills error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
