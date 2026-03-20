const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.createSociety = async (req, res) => {
    const { name, address } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: "Society name is required" });
    }

    if (name.length > 100) {
        return res.status(400).json({ message: "Society name must be under 100 characters" });
    }
    if (address && address.length > 300) {
        return res.status(400).json({ message: "Address must be under 300 characters" });
    }

    const client = await pool.connect();
    try {
        const userCheck = await client.query(
            "SELECT id, role, society_id FROM users WHERE id=$1 AND role='admin'",
            [userId]
        );

        if (!userCheck.rows.length) {
            return res.status(403).json({ message: "Only admins can create societies" });
        }

        if (userCheck.rows[0].society_id) {
            return res.status(400).json({ message: "Society already exists for this admin" });
        }

        const nameCheck = await client.query(
            "SELECT id FROM societies WHERE LOWER(name) = LOWER($1)",
            [name]
        );
        if (nameCheck.rows.length > 0) {
            return res.status(409).json({ message: "A society with this name already exists" });
        }

        await client.query("BEGIN");

        const societyResult = await client.query(
            `INSERT INTO societies (name, address)
             VALUES ($1, $2)
             RETURNING id, name, address, created_at`,
            [name, address || null]
        );

        const society = societyResult.rows[0];

        await client.query(
            "UPDATE users SET society_id=$1, is_first_login=FALSE WHERE id=$2",
            [society.id, userId]
        );

        await client.query("COMMIT");

        try {
            await logActivity({
                userId,
                type: "society_created",
                entityType: "society",
                entityId: society.id,
                title: "Society Created",
                description: `Created society: ${name}`,
            });
        } catch (logErr) {
            console.error("Activity log failed (non-critical):", logErr.message);
        }

        return res.status(201).json({
            message: "Society created successfully",
            society,
        });

    } catch (err) {
        await client.query("ROLLBACK");
        if (err.code === "23505") {
            return res.status(409).json({ message: "A society with this name already exists" });
        }
        console.error("createSociety error:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
};

exports.getMySociety = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT s.id, s.name, s.address, s.city, s.state, s.pincode,
                    s.total_units, s.subscription_plan, s.status,
                    s.trial_ends_at, s.created_at
             FROM societies s
             INNER JOIN users u ON u.society_id = s.id
             WHERE u.id = $1`,
            [userId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "No society found for this user" });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        console.error("getMySociety error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateSociety = async (req, res) => {
    const { name, address } = req.body;
    const userId = req.user.id;
    const societyId = req.societyId;

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update society" });
    }

    if (!societyId) {
        return res.status(400).json({ message: "No society found for this user" });
    }

    if (name && name.length > 100) {
        return res.status(400).json({ message: "Society name must be under 100 characters" });
    }
    if (address && address.length > 300) {
        return res.status(400).json({ message: "Address must be under 300 characters" });
    }

    try {
        const result = await pool.query(
            `UPDATE societies
             SET name       = COALESCE($1, name),
                 address    = COALESCE($2, address),
                 updated_at = NOW()
             WHERE id = $3
             RETURNING id, name, address, updated_at`,
            [name || null, address || null, societyId]
        );

        try {
            await logActivity({
                userId,
                type: "society_updated",
                entityType: "society",
                entityId: societyId,
                title: "Society Updated",
                description: "Updated society details",
            });
        } catch (logErr) {
            console.error("Activity log failed (non-critical):", logErr.message);
        }

        return res.json({
            message: "Society updated successfully",
            society: result.rows[0],
        });

    } catch (err) {
        console.error("updateSociety error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
