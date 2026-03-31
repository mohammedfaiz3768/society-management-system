const db = require("../config/db");

exports.getAllInvoices = async (req, res) => {
    const societyId = req.societyId;

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    try {
        const { rows } = await db.query(
            `SELECT i.*, u.name AS user_name, u.flat_number AS resident_flat
             FROM invoices i
             LEFT JOIN users u ON i.user_id = u.id
             WHERE i.society_id = $1
             ORDER BY i.created_at DESC
             LIMIT $2 OFFSET $3`,
            [societyId, limit, offset]
        );

        return res.json(rows);

    } catch (err) {
        console.error("getAllInvoices error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getMyInvoices = async (req, res) => {
    const userId = req.user.id;
    const societyId = req.societyId;

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 60);
    const offset = (page - 1) * limit;

    try {
        const { rows } = await db.query(
            `SELECT id, amount, month_year, status, due_date, paid_at, created_at
             FROM invoices
             WHERE user_id=$1 AND society_id=$2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, societyId, limit, offset]
        );

        return res.json(rows);

    } catch (err) {
        console.error("getMyInvoices error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
