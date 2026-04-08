const pool = require("../../config/db");
const crypto = require("crypto");
const { logActivity } = require("../../utils/activityLogger");
const { sendEmail } = require("../../utils/sendEmail");

const VALID_ROLES = ["resident", "guard", "staff"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateInvitationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(8);
    return Array.from(bytes).map(b => chars[b % chars.length]).join('');
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

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
            message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`
        });
    }

    try {
        const existing = await pool.query(
            `SELECT id FROM invitations
             WHERE email=$1 AND society_id=$2 AND used=FALSE
               AND (expires_at IS NULL OR expires_at > NOW())`,
            [email, societyId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: "An active invitation already exists for this email"
            });
        }

        const code = generateInvitationCode();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const result = await pool.query(
            `INSERT INTO invitations (email, role, code, created_by, expires_at, society_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [email.toLowerCase(), role, code, invitedBy, expiresAt, societyId]
        );

        await logActivity({
            userId: req.user.id,
            type: "invitation_created",
            entityType: "invitation",
            entityId: result.rows[0].id,
            title: "Invitation Created",
            description: `Invitation sent to ${email} with role: ${role}`,
        });

        const invitation = result.rows[0];

        sendEmail(
            email,
            "You're invited to join Society App",
            `You have been invited to join as a ${role}.\n\nYour invitation code is: ${code}\n\nOpen the Society App and enter this code when signing up.\n\nThis invitation expires in 7 days.`
        ).catch(err => console.error("Invitation email failed:", err.message));

        return res.json({
            message: "Invitation created successfully",
            invitation,
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

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    try {
        const result = await pool.query(
            `SELECT
                i.*,
                u1.name AS created_by_name,
                u2.name AS used_by_name
             FROM invitations i
             LEFT JOIN users u1 ON i.created_by = u1.id
             LEFT JOIN users u2 ON i.used_by = u2.id
             WHERE i.society_id=$1
             ORDER BY i.created_at DESC
             LIMIT $2 OFFSET $3`,
            [societyId, limit, offset]
        );

        return res.json({ invitations: result.rows });

    } catch (err) {
        console.error("getInvitations error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.revokeInvitation = async (req, res) => {
    const { id } = req.params;
    const societyId = req.societyId;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can revoke invitations" });
    }

    try {
        const result = await pool.query(
            `UPDATE invitations
             SET used=TRUE, used_at=NOW(), revoked_by=$3
             WHERE id=$1 AND used=FALSE AND society_id=$2
             RETURNING *`,
            [id, societyId, req.user.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "Invitation not found or already used" });
        }

        await logActivity({
            userId: req.user.id,
            type: "invitation_revoked",
            entityType: "invitation",
            entityId: id,
            title: "Invitation Revoked",
            description: `Revoked invitation for: ${result.rows[0].email}`,
        });

        return res.json({ message: "Invitation revoked successfully" });

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
             WHERE code=$1
               AND used=FALSE
               AND (expires_at IS NULL OR expires_at > NOW())
               AND (email IS NULL OR email=$2)`,
            [code, email?.toLowerCase() || null]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                valid: false,
                message: "Invalid or expired invitation code",
            });
        }

        return res.json({
            valid: true,
            message: "Invitation code is valid",
            role: result.rows[0].role,
            society_id: result.rows[0].society_id,
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
