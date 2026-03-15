const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

exports.getAllUsers = async (req, res) => {
    const societyId = req.societyId; 

    try {
        const result = await pool.query(
            `SELECT id, name, phone, email, role, flat_number, block, created_at 
       FROM users 
       WHERE society_id = $1
       ORDER BY created_at DESC`,
            [societyId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("getAllUsers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createUser = async (req, res) => {
    const { name, email, phone, role, flat_number, block } = req.body;
    const societyId = req.societyId; 

    if (!email && !phone) {
        return res.status(400).json({ message: "Email or Phone is required" });
    }

    try {
        const existing = await pool.query(
            `SELECT * FROM users WHERE (email = $1 OR phone = $2) AND society_id = $3`,
            [email, phone, societyId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "User with this email or phone already exists" });
        }

        const newUser = await pool.query(
            `INSERT INTO users (name, email, phone, role, flat_number, block, society_id)
             VALUES ($1, $2, $3, COALESCE($4, 'resident'), $5, $6, $7)
             RETURNING *`,
            [name, email, phone, role, flat_number, block, societyId]
        );

        await logActivity({
            userId: req.user.id,
            type: "user_created",
            entityType: "user",
            entityId: newUser.rows[0].id,
            title: "User Created",
            description: `User ${name || email} created by admin`
        });

        res.status(201).json(newUser.rows[0]);
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

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("getUserById error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const { name, email, flat_number, block } = req.body;

    if (requesterRole !== "admin" && requesterId !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized profile update" });
    }

    try {
        const result = await pool.query(
            `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           flat_number = COALESCE($3, flat_number),
           block = COALESCE($4, block),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, flat_number, block`,
            [name, email, flat_number, block, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = result.rows[0];

        await logActivity({
            userId: requesterId,
            type: "user_updated",
            entityType: "user",
            entityId: id,
            title: "User Profile Updated",
            description: `User ${id} profile updated by ${requesterRole}`
        });

        res.json(updatedUser);
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "resident", "guard", "staff"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    try {
        const result = await pool.query(
            `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, role`,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = result.rows[0];

        await logActivity({
            userId: req.user.id,
            type: "role_updated",
            entityType: "user",
            entityId: id,
            title: "User Role Updated",
            description: `User ${user.name || id} role changed to ${role}`
        });

        res.json(user);
    } catch (err) {
        console.error("updateUserRole error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
