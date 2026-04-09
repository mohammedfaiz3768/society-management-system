const db = require("../../config/db");
const crypto = require("crypto");
const { sendEmail: sendEmailRaw } = require("../../utils/sendEmail");

// Adapter: registrationController uses { to, subject, html } format
const sendEmail = ({ to, subject, html }) => sendEmailRaw(to, subject, html, html);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

const sanitise = (str) => str?.replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
}[c])) || '';

exports.registerSociety = async (req, res) => {
    try {
        const {
            society_name, address, city, state, pincode,
            total_units, admin_name, admin_email, admin_phone,
        } = req.body;

        if (!society_name || !admin_email || !admin_name) {
            return res.status(400).json({
                error: "Society name, admin name, and email are required",
            });
        }

        if (society_name.length > 100) {
            return res.status(400).json({ error: "Society name must be under 100 characters" });
        }
        if (admin_name.length > 100) {
            return res.status(400).json({ error: "Admin name must be under 100 characters" });
        }

        if (!emailRegex.test(admin_email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        if (admin_phone && !phoneRegex.test(admin_phone)) {
            return res.status(400).json({ error: "Phone must be 10 digits" });
        }

        if (pincode && !/^[0-9]{6}$/.test(pincode)) {
            return res.status(400).json({ error: "Invalid pincode — must be 6 digits" });
        }

        if (total_units && (total_units < 1 || total_units > 10000)) {
            return res.status(400).json({ error: "Total units must be between 1 and 10000" });
        }

        const existingCheck = await db.query(
            "SELECT id FROM societies WHERE LOWER(name) = LOWER($1)",
            [society_name]
        );
        if (existingCheck.rows.length > 0) {
            return res.status(409).json({
                error: "A society with this name already exists. Please choose a different name.",
            });
        }

        const emailCheck = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [admin_email.toLowerCase()]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({
                error: "This email is already registered. Please use a different email.",
            });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const societyResult = await db.query(
            `INSERT INTO societies
             (name, address, city, state, pincode, total_units, admin_email, admin_phone,
              registration_token, status, subscription_plan, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'free_trial', $10)
             RETURNING *`,
            [
                society_name, address || null, city || null, state || null,
                pincode || null, total_units || 0,
                admin_email.toLowerCase(), admin_phone || null,
                verificationToken, admin_name,
            ]
        );

        const society = societyResult.rows[0];
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        await sendEmail({
            to: admin_email,
            subject: "Verify Your Society Registration",
            html: `
                <h2>Welcome to UNIFY!</h2>
                <p>Hello ${sanitise(admin_name)},</p>
                <p>Thank you for registering <strong>${sanitise(society_name)}</strong>.</p>
                <p>Click below to verify your email and activate your 30-day free trial:</p>
                <p><a href="${verificationLink}" style="background:#1A56DB;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email & Activate</a></p>
                <p>This link expires in 24 hours.</p>
                <p>Best regards,<br>UNIFY Team</p>
            `,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful! Please check your email to verify and activate your account.",
            society_id: society.id,
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "A society with this name already exists." });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
};

exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    const societyResult = await db.query(
        "SELECT * FROM societies WHERE registration_token=$1 AND status='pending'",
        [token]
    );

    if (!societyResult.rows.length) {
        return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    const society = societyResult.rows[0];

    const tokenGeneratedAt = new Date(society.updated_at || society.created_at);
    const hoursDiff = (Date.now() - tokenGeneratedAt) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
        return res.status(400).json({
            error: "Verification link has expired. Please request a new one.",
        });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE societies
             SET status='active', trial_ends_at=$1, approved_at=NOW(), registration_token=NULL
             WHERE id=$2`,
            [trialEndsAt, society.id]
        );

        const existingAdmin = await client.query(
            "SELECT id FROM users WHERE email=$1",
            [society.admin_email]
        );

        if (!existingAdmin.rows.length) {
            await client.query(
                `INSERT INTO users (name, email, phone, role, society_id, is_first_login)
                 VALUES ($1, $2, $3, 'admin', $4, TRUE)`,
                [society.created_by, society.admin_email, society.admin_phone, society.id]
            );
        }

        await client.query("COMMIT");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Verification transaction error:", err);
        return res.status(500).json({ error: "Verification failed. Please try again." });
    } finally {
        client.release();
    }

    await sendEmail({
        to: society.admin_email,
        subject: "Welcome! Your Society is Now Active 🎉",
        html: `
            <h2>Your Society is Activated!</h2>
            <p>Hello ${sanitise(society.created_by)},</p>
            <p><strong>${sanitise(society.name)}</strong> is now active!</p>
            <p>Your 30-day free trial ends on <strong>${trialEndsAt.toLocaleDateString()}</strong>.</p>
            <p><a href="${process.env.FRONTEND_URL}/login" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Login Now</a></p>
            <p>Login with your email: ${sanitise(society.admin_email)}, then request an OTP.</p>
            <p>Best regards,<br>UNIFY Team</p>
        `,
    });

    return res.json({
        success: true,
        message: "Email verified! Your society is now active.",
        redirect_url: "/login",
    });
};

exports.checkAvailability = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        if (name.length < 3) {
            return res.status(400).json({ error: "Name must be at least 3 characters" });
        }

        const result = await db.query(
            "SELECT id FROM societies WHERE LOWER(name) = LOWER($1)",
            [name]
        );

        return res.json({ available: result.rows.length === 0 });

    } catch (error) {
        console.error("Check availability error:", error);
        res.status(500).json({ error: "Failed to check availability" });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await db.query(
            `SELECT * FROM societies
             WHERE admin_email=$1 AND status='pending'
               AND created_at > NOW() - INTERVAL '7 days'`,
            [email.toLowerCase()]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                error: "No pending registration found for this email",
            });
        }

        const society = result.rows[0];

        const lastUpdated = new Date(society.updated_at || society.created_at);
        const minutesSince = (Date.now() - lastUpdated) / (1000 * 60);
        if (minutesSince < 2) {
            const wait = Math.ceil(2 - minutesSince);
            return res.status(429).json({
                error: `Please wait ${wait} minute(s) before requesting another verification email`,
            });
        }

        const newToken = crypto.randomBytes(32).toString("hex");

        await db.query(
            "UPDATE societies SET registration_token=$1, updated_at=NOW() WHERE id=$2",
            [newToken, society.id]
        );

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${newToken}`;

        await sendEmail({
            to: email,
            subject: "New Verification Link — UNIFY",
            html: `
                <h2>New Verification Link</h2>
                <p>Hello ${sanitise(society.created_by)},</p>
                <p>Here's your new verification link for <strong>${sanitise(society.name)}</strong>:</p>
                <p><a href="${verificationLink}" style="background:#1A56DB;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email</a></p>
                <p>This link expires in 24 hours.</p>
                <p>Best regards,<br>UNIFY Team</p>
            `,
        });

        return res.json({ success: true, message: "Verification email sent!" });

    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ error: "Failed to resend verification" });
    }
};

module.exports = {
    registerSociety: exports.registerSociety,
    verifyEmail: exports.verifyEmail,
    checkAvailability: exports.checkAvailability,
    resendVerification: exports.resendVerification,
};
