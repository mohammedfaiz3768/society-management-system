const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.getAllUsers = async (req, res) => {
    const societyId = req.societyId;

    if (!["admin", "guard"].includes(req.user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const { role } = req.query;
    const VALID_ROLES = ["admin", "resident", "guard", "staff"];
    if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role filter" });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, phone, email, role, flat_number, block, created_at
             FROM users
             WHERE society_id = $1
               ${role ? "AND role = $4" : ""}
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            role ? [societyId, limit, offset, role] : [societyId, limit, offset]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error("getAllUsers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createUser = async (req, res) => {
    const { name, email, phone, role, flat_number, block } = req.body;
    const societyId = req.societyId;

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create users" });
    }

    if (!email && !phone) {
        return res.status(400).json({ message: "Email or phone is required" });
    }

    if (email && !emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (role === "admin") {
        return res.status(403).json({ message: "Cannot create admin accounts this way. Use the invitation system." });
    }

    const VALID_ROLES = ["resident", "guard", "staff"];
    if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    try {
        const existing = await pool.query(
            `SELECT id FROM users WHERE (email = $1 OR phone = $2) AND society_id = $3`,
            [email || null, phone || null, societyId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ message: "User with this email or phone already exists" });
        }

        const newUser = await pool.query(
            `INSERT INTO users (name, email, phone, role, flat_number, block, society_id)
             VALUES ($1, $2, $3, COALESCE($4, 'resident'), $5, $6, $7)
             RETURNING id, name, email, phone, role, flat_number, block, society_id, created_at`,
            [name || null, email || null, phone || null, role, flat_number || null, block || null, societyId]
        );

        await logActivity({
            userId: req.user.id,
            type: "user_created",
            entityType: "user",
            entityId: newUser.rows[0].id,
            title: "User Created",
            description: `User ${name || email || phone} created by admin`,
        });

        return res.status(201).json(newUser.rows[0]);

    } catch (err) {
        console.error("createUser error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const societyId = req.societyId;

    if (requesterRole !== "admin" && requesterId !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized access" });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, phone, email, role, flat_number, block, created_at
             FROM users WHERE id = $1 AND society_id = $2`,
            [id, societyId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(result.rows[0]);

    } catch (err) {
        console.error("getUserById error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const societyId = req.societyId;
    const { name, email, flat_number, block } = req.body;

    if (requesterRole !== "admin" && requesterId !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized profile update" });
    }

    if (email && !emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    try {
        let query, params;

        if (requesterRole === "admin") {
            query = `UPDATE users
                     SET name = COALESCE($1, name),
                         email = COALESCE($2, email),
                         flat_number = COALESCE($3, flat_number),
                         block = COALESCE($4, block),
                         updated_at = NOW()
                     WHERE id = $5 AND society_id = $6
                     RETURNING id, name, email, flat_number, block`;
            params = [name, email, flat_number, block, id, societyId];
        } else {
            query = `UPDATE users
                     SET name = COALESCE($1, name),
                         email = COALESCE($2, email),
                         updated_at = NOW()
                     WHERE id = $3 AND society_id = $4
                     RETURNING id, name, email, flat_number, block`;
            params = [name, email, id, societyId];
        }

        const result = await pool.query(query, params);

        if (!result.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        await logActivity({
            userId: requesterId,
            type: "user_updated",
            entityType: "user",
            entityId: id,
            title: "User Profile Updated",
            description: `User ${id} profile updated by ${requesterRole}`,
        });

        return res.json(result.rows[0]);

    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const societyId = req.societyId;

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can change user roles" });
    }

    const VALID_ROLES = ["admin", "resident", "guard", "staff"];
    if (!role || !VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    try {
        if (role !== "admin") {
            const targetUser = await pool.query(
                "SELECT role FROM users WHERE id=$1 AND society_id=$2",
                [id, societyId]
            );

            if (!targetUser.rows.length) {
                return res.status(404).json({ message: "User not found" });
            }

            if (targetUser.rows[0].role === "admin") {
                const adminCount = await pool.query(
                    "SELECT COUNT(*) FROM users WHERE role='admin' AND society_id=$1",
                    [societyId]
                );
                if (parseInt(adminCount.rows[0].count) <= 1) {
                    return res.status(400).json({
                        message: "Cannot demote the last admin of a society"
                    });
                }
            }
        }

        const result = await pool.query(
            `UPDATE users SET role=$1, updated_at=NOW()
             WHERE id=$2 AND society_id=$3
             RETURNING id, name, role`,
            [role, id, societyId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        await logActivity({
            userId: req.user.id,
            type: "role_updated",
            entityType: "user",
            entityId: id,
            title: "User Role Updated",
            description: `User ${result.rows[0].name || id} role changed to ${role}`,
        });

        return res.json(result.rows[0]);

    } catch (err) {
        console.error("updateUserRole error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
