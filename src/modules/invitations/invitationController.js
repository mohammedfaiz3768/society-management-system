const pool = require("../../config/db");
const { logActivity } = require("../../utils/activityLogger");

function generateInvitationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

exports.createInvitation = async (req, res) => {
    const { email, role } = req.body;
    const invitedBy = req.user.id;
    const societyId = req.societyId;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create invitations" });
    }

    if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
    }

    try {
        const code = generateInvitationCode(); 
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

        const result = await pool.query(
            `INSERT INTO invitations (email, role, code, created_by, expires_at, society_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [email, role, code, invitedBy, expiresAt, societyId]
        );

        await logActivity({
            userId: req.user.id,
            type: "invitation_created",
            entityType: "invitation",
            entityId: result.rows[0].id,
            title: "Invitation Created",
            description: `Created invitation code: ${code}`,
        });

        return res.json({
            message: "Invitation created successfully",
            invitation: result.rows[0],
        });

    } catch (err) {
        console.error("createInvitation error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getInvitations = async (req, res) => {
    const societyId = req.societyId;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view invitations" });
    }

    try {
        const result = await pool.query(
            `SELECT 
        i.*,
        u1.name as created_by_name,
        u2.name as used_by_name
       FROM invitations i
       LEFT JOIN users u1 ON i.created_by = u1.id
       LEFT JOIN users u2 ON i.used_by = u2.id
       WHERE i.society_id = $1
       ORDER BY i.created_at DESC`,
            [societyId]
        );

        return res.json({
            invitations: result.rows,
        });

    } catch (err) {
        console.error("getInvitations error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.revokeInvitation = async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can revoke invitations" });
    }

    try {
        const result = await pool.query(
            `UPDATE invitations 
       SET used = TRUE, used_at = NOW()
       WHERE id = $1 AND used = FALSE
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Invitation not found or already used" });
        }

        await logActivity({
            userId: req.user.id,
            type: "invitation_revoked",
            entityType: "invitation",
            title: "Invitation Revoked",
            description: `Revoked invitation code: ${result.rows[0].code}`,
        });

        return res.json({
            message: "Invitation revoked successfully",
        });

    } catch (err) {
        console.error("revokeInvitation error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.validateInvitation = async (req, res) => {
    const { code, email } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Invitation code is required" });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM invitations 
       WHERE code = $1 
       AND used = FALSE 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (email IS NULL OR email = $2)`,
            [code, email || null]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                valid: false,
                message: "Invalid or expired invitation code"
            });
        }

        return res.json({
            valid: true,
            message: "Invitation code is valid",
            role: result.rows[0].role,
        });

    } catch (err) {
        console.error("validateInvitation error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createInvitation: exports.createInvitation,
    getInvitations: exports.getInvitations,
    revokeInvitation: exports.revokeInvitation,
    validateInvitation: exports.validateInvitation,
};
