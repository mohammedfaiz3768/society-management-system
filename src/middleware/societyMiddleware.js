const pool = require("../config/db");

const societyMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userResult = await pool.query(
            "SELECT society_id FROM users WHERE id = $1",
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        req.societyId = user.society_id;

        if (!req.societyId) {
            if (req.path === '/societies' && req.method === 'POST') {
                return next();
            }
        }

        next();
    } catch (err) {
        console.error("Society middleware error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = societyMiddleware;
