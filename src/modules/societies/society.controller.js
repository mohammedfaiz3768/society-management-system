const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createSociety = async (req, res) => {
    const { name, address } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: "Society name is required" });
    }

    try {
        const userCheck = await pool.query(
            "SELECT * FROM users WHERE id = $1 AND role = $2",
            [userId, "admin"]
        );

        if (userCheck.rows.length === 0) {
            return res.status(403).json({ message: "Only admins can create societies" });
        }

        const user = userCheck.rows[0];

        if (user.society_id) {
            return res.status(400).json({ message: "Society already exists for this admin" });
        }

        const societyResult = await pool.query(
            `INSERT INTO societies (name, address) 
       VALUES ($1, $2) 
       RETURNING *`,
            [name, address || null]
        );

        const society = societyResult.rows[0];

        await pool.query(
            `UPDATE users 
       SET society_id = $1, is_first_login = FALSE 
       WHERE id = $2`,
            [society.id, userId]
        );

        await logActivity({
            userId,
            type: "society_created",
            entityType: "society",
            entityId: society.id,
            title: "Society Created",
            description: `Created society: ${name}`,
        });

        res.status(201).json({
            message: "Society created successfully",
            society,
        });

    } catch (err) {
        console.error("createSociety error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMySociety = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT s.* FROM societies s
       INNER JOIN users u ON u.society_id = s.id
       WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No society found for this user" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("getMySociety error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateSociety = async (req, res) => {
    const { name, address } = req.body;
    const userId = req.user.id;

    try {
        const userResult = await pool.query(
            "SELECT society_id, role FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can update society" });
        }

        if (!user.society_id) {
            return res.status(400).json({ message: "No society found for this user" });
        }

        const result = await pool.query(
            `UPDATE societies 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [name, address, user.society_id]
        );

        await logActivity({
            userId,
            type: "society_updated",
            entityType: "society",
            entityId: user.society_id,
            title: "Society Updated",
            description: `Updated society details`,
        });

        res.json({
            message: "Society updated successfully",
            society: result.rows[0],
        });

    } catch (err) {
        console.error("updateSociety error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
