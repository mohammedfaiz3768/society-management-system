const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

const VALID_STATUSES = ["PENDING", "PAID", "OVERDUE", "CANCELLED"];

exports.createBill = async (req, res) => {
  const { flat_number, user_id, month, year, amount, due_date, notes } = req.body;
  const societyId = req.societyId;

  if (!flat_number || !month || !year || !amount) {
    return res.status(400).json({ message: "flat_number, month, year, amount are required" });
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number" });
  }

  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: "Month must be between 1 and 12" });
  }
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return res.status(400).json({ message: "Invalid year" });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM maintenance_bills
             WHERE flat_number = $1 AND month = $2 AND year = $3 AND society_id = $4`,
      [flat_number, monthNum, yearNum, societyId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Bill already exists for this flat and month"
      });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_bills
             (flat_number, user_id, month, year, amount, due_date, notes, society_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
      [flat_number, user_id || null, monthNum, yearNum, amount, due_date || null, notes || "", societyId]
    );

    const bill = result.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "bill_created",
      entityType: "maintenance_bill",
      entityId: bill.id,
      title: "Maintenance bill created",
      description: `Flat ${flat_number} - ${monthNum}/${yearNum}, Amount: ${amount}`,
    });

    return res.status(201).json(bill);

  } catch (err) {
    console.error("createBill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllBills = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM maintenance_bills
             WHERE society_id = $1
             ORDER BY year DESC, month DESC, flat_number ASC
             LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllBills error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBill = async (req, res) => {
  const { id } = req.params;
  const { amount, status, due_date, paid_date, notes } = req.body;
  const societyId = req.societyId;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
    });
  }

  try {
    const old = await pool.query(
      `SELECT * FROM maintenance_bills WHERE id = $1 AND society_id = $2`,
      [id, societyId]
    );

    if (old.rows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const prev = old.rows[0];

    if (prev.status === "PAID") {
      return res.status(400).json({
        message: "Cannot edit a bill that has already been paid"
      });
    }

    if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0)) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const updated = await pool.query(
      `UPDATE maintenance_bills
             SET amount     = $1,
                 status     = $2,
                 due_date   = $3,
                 paid_date  = $4,
                 notes      = $5,
                 updated_at = NOW()
             WHERE id = $6 AND society_id = $7
             RETURNING *`,
      [
        amount !== undefined ? amount : prev.amount,
        status || prev.status,
        due_date || prev.due_date,
        paid_date || prev.paid_date,
        notes !== undefined ? notes : prev.notes,
        id,
        societyId,
      ]
    );

    await logActivity({
      userId: req.user.id,
      type: "bill_updated",
      entityType: "maintenance_bill",
      entityId: id,
      title: "Maintenance bill updated",
      description: `Updated bill ID ${id} (Flat ${prev.flat_number})`,
    });

    return res.json(updated.rows[0]);

  } catch (err) {
    console.error("updateBill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteBill = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `DELETE FROM maintenance_bills
             WHERE id = $1 AND society_id = $2
             RETURNING id, flat_number, status`,
      [id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (result.rows[0].status === "PAID") {
      return res.status(400).json({
        message: "Cannot delete a paid bill"
      });
    }

    await logActivity({
      userId: req.user.id,
      type: "bill_deleted",
      entityType: "maintenance_bill",
      entityId: id,
      title: "Maintenance bill deleted",
      description: `Bill ID ${id} (Flat ${result.rows[0].flat_number}) removed`,
    });

    return res.json({ message: "Bill deleted" });

  } catch (err) {
    console.error("deleteBill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyBills = asy
