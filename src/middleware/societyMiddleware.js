/**
 * Society Middleware
 * Adds society context to authenticated requests
 * Ensures users can only access data from their own society
 */
const pool = require("../config/db");

const societyMiddleware = async (req, res, next) => {
    try {
        // This middleware should run after authMiddleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Get user's society_id
        const userResult = await pool.query(
            "SELECT society_id FROM users WHERE id = $1",
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // Add society_id to request object
        req.societyId = user.society_id;

        // If user doesn't have a society yet (first-time admin), allow access
        // They'll be redirected to society setup on frontend
        if (!req.societyId) {
            // For create society endpoint, allow null society_id
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
