const db = require("../../config/db");
const crypto = require("crypto");
const { sendEmail } = require("../../utils/emailService");

// Society registration (public - no auth)
exports.registerSociety = async (req, res) => {
    try {
        const {
            society_name,
            address,
            city,
            state,
            pincode,
            total_units,
            admin_name,
            admin_email,
            admin_phone,
        } = req.body;

        // Validate required fields
        if (!society_name || !admin_email || !admin_name) {
            return res.status(400).json({
                error: "Society name, admin name, and email are required",
            });
        }

        // Check if society name already exists
        const existingCheck = await db.query(
            `SELECT id FROM societies WHERE LOWER(name) = LOWER($1)`,
            [society_name]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({
                error: "A society with this name already exists. Please choose a different name.",
            });
        }

        // Check if admin email already exists
        const emailCheck = await db.query(
            `SELECT id FROM users WHERE email = $1`,
            [admin_email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({
                error: "This email is already registered. Please use a different email.",
            });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Create society (pending status initially)
        const societyResult = await db.query(
            `INSERT INTO societies 
       (name, address, city, state, pincode, total_units, admin_email, admin_phone, 
        registration_token, status, subscription_plan, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'free_trial', $10)
       RETURNING *`,
            [
                society_name,
                address,
                city,
                state,
                pincode,
                total_units || 0,
                admin_email,
                admin_phone,
                verificationToken,
                admin_name,
            ]
        );

        const society = societyResult.rows[0];

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        await sendEmail({
            to: admin_email,
            subject: "Verify Your Society Registration",
            html: `
        <h2>Welcome to Society Management Platform!</h2>
        <p>Hello ${admin_name},</p>
        <p>Thank you for registering <strong>${society_name}</strong>.</p>
        <p>Click the link below to verify your email and activate your 30-day free trial:</p>
        <p><a href="${verificationLink}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email & Activate</a></p>
        <p>This link expires in 24 hours.</p>
        <p>After verification, you'll be able to:</p>
        <ul>
          <li>Set up your society details</li>
          <li>Add residents and staff</li>
          <li>Manage all society operations</li>
        </ul>
        <p>Questions? Reply to this email!</p>
        <p>Best regards,<br>Society Management Team</p>
      `,
        });

        res.status(201).json({
            success: true,
            message: "Registration successful! Please check your email to verify and activate your account.",
            society_id: society.id,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
};

// Verify email and activate society
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find society by token
        const societyResult = await db.query(
            `SELECT * FROM societies WHERE registration_token = $1 AND status = 'pending'`,
            [token]
        );

        if (societyResult.rows.length === 0) {
            return res.status(400).json({
                error: "Invalid or expired verification link",
            });
        }

        const society = societyResult.rows[0];

        // Check if token is older than 24 hours
        const createdAt = new Date(society.created_at);
        const now = new Date();
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            return res.status(400).json({
                error: "Verification link has expired. Please register again.",
            });
        }

        // Calculate trial end date (30 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);

        // Activate society
        await db.query(
            `UPDATE societies 
       SET status = 'active', 
           trial_ends_at = $1,
           approved_at = NOW(),
           registration_token = NULL
       WHERE id = $2`,
            [trialEndsAt, society.id]
        );

        // Create admin user
        const userResult = await db.query(
            `INSERT INTO users 
       (name, email, phone, role, society_id, is_first_login)
       VALUES ($1, $2, $3, 'admin', $4, TRUE)
       RETURNING *`,
            [society.created_by, society.admin_email, society.admin_phone, society.id]
        );

        // Send welcome email
        await sendEmail({
            to: society.admin_email,
            subject: "Welcome! Your Society is Now Active 🎉",
            html: `
        <h2>Your Society is Activated!</h2>
        <p>Hello ${society.created_by},</p>
        <p><strong>${society.name}</strong> is now active!</p>
        <p>Your 30-day free trial has started and will end on <strong>${trialEndsAt.toLocaleDateString()}</strong>.</p>
        <p><a href="${process.env.FRONTEND_URL}/login" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Login Now</a></p>
        <p>First login steps:</p>
        <ol>
          <li>Click "Login" and enter your email: ${society.admin_email}</li>
          <li>Request OTP code</li>
          <li>Enter the OTP sent to your email</li>
          <li>Complete society setup wizard</li>
        </ol>
        <p>Need help? We're here for you!</p>
        <p>Best regards,<br>Society Management Team</p>
      `,
        });

        res.json({
            success: true,
            message: "Email verified successfully! Your society is now active.",
            redirect_url: "/login",
        });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
};

// Check society name availability (public)
exports.checkAvailability = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const result = await db.query(
            `SELECT id FROM societies WHERE LOWER(name) = LOWER($1)`,
            [name]
        );

        res.json({
            available: result.rows.length === 0
        });
    } catch (error) {
        console.error("Check availability error:", error);
        res.status(500).json({ error: "Failed to check availability" });
    }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await db.query(
            `SELECT * FROM societies WHERE admin_email = $1 AND status = 'pending'`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "No pending registration found for this email",
            });
        }

        const society = result.rows[0];

        // Generate new token
        const newToken = crypto.randomBytes(32).toString("hex");
        await db.query(
            `UPDATE societies SET registration_token = $1 WHERE id = $2`,
            [newToken, society.id]
        );

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${newToken}`;

        await sendEmail({
            to: email,
            subject: "New Verification Link for Society Registration",
            html: `
        <h2>New Verification Link</h2>
        <p>Hello ${society.created_by},</p>
        <p>Here's your new verification link for ${society.name}:</p>
        <p><a href="${verificationLink}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
        });

        res.json({
            success: true,
            message: "Verification email sent!",
        });
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
