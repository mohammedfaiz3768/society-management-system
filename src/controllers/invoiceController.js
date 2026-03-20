const db = require("../config/db");

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
