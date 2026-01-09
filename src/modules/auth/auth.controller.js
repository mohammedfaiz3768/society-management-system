const pool = require("../../config/db");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { logActivity } = require("../../utils/activityLogger");
const { sendEmail } = require("../../utils/sendEmail");
const authConfig = require("../../config/authConfig");

dotenv.config();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

exports.requestOtp = async (req, res) => {
  const phone = (req.body.phone || "").trim();

  if (!phone) {
    return res.status(400).json({ message: "Phone is required" });
  }

  try {
    const now = Date.now();

    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const hourly = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE phone = $1 AND created_at > $2`,
      [phone, oneHourAgo]
    );

    if (Number(hourly.rows[0].count) >= 5) {
      return res.status(429).json({
        message: "Too many OTP requests. Try again after 1 hour.",
      });
    }

    const oneMinuteAgo = new Date(now - 60 * 1000);
    const minute = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE phone = $1 AND created_at > $2`,
      [phone, oneMinuteAgo]
    );

    if (Number(minute.rows[0].count) >= 3) {
      return res.status(429).json({
        message: "Too many OTP requests. Please wait a minute.",
      });
    }

    let userResult = await pool.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone]
    );

    if (userResult.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO users (phone, role)
         VALUES ($1, 'resident')
         RETURNING *`,
        [phone]
      );
      userResult = newUser;
    }

    const user = userResult.rows[0];
    const otp = generateOtp();

    await pool.query(
      `UPDATE otp_codes SET used = TRUE WHERE phone = $1`,
      [phone]
    );

    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at, used, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', FALSE, NOW())`,
      [phone, otp]
    );

    if (user.email) {
      await sendEmail(user.email, "Your Login OTP", otp);
    } else {
      console.log(`OTP generated for ${phone} (Email not configured)`);
      return res.json({
        message: "OTP generated but user has no email.",
        email_sent: false,
      });
    }

    await logActivity({
      userId: user.id,
      type: "otp_requested",
      entityType: "auth",
      title: "OTP Requested",
      description: `OTP sent to ${phone}`,
    });

    return res.json({
      message: "OTP sent successfully",
      delivered_via_email: !!user.email,
    });

  } catch (err) {
    console.error("requestOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  const phone = (req.body.phone || "").trim();
  const code = (req.body.code || "").trim();

  if (!phone || !code) {
    return res.status(400).json({ message: "Phone & OTP code required" });
  }

  try {
    const otpRow = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1
         AND otp = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [phone, code]
    );

    if (otpRow.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await pool.query(
      `UPDATE otp_codes SET used = TRUE WHERE id = $1`,
      [otpRow.rows[0].id]
    );

    let userResult = await pool.query(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );

    let user;

    if (userResult.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO users (phone, role)
         VALUES ($1, 'resident') RETURNING *`,
        [phone]
      );
      user = newUser.rows[0];

      await logActivity({
        userId: user.id,
        type: "user_registered",
        entityType: "user",
        title: "User Registered",
        description: `New user registered: ${phone}`,
      });

    } else {
      user = userResult.rows[0];
    }

    const token = createToken(user);

    await logActivity({
      userId: user.id,
      type: "user_login",
      entityType: "auth",
      title: "Login",
      description: `User logged in via OTP`,
    });

    return res.json({
      token,
      user,
    });

  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);

    res.json(user.rows[0]);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.saveFcmToken = async (req, res) => {
  const userId = req.user.id;
  const { fcm_token } = req.body;

  if (!fcm_token) {
    return res.status(400).json({ message: "fcm_token is required" });
  }

  try {
    await pool.query(
      `UPDATE users SET fcm_token = $1 WHERE id = $2`,
      [fcm_token, userId]
    );

    await logActivity({
      userId,
      type: "fcm_saved",
      entityType: "user",
      title: "FCM Token Saved",
      description: "Push notification token updated",
    });

    return res.json({ message: "FCM token saved successfully" });
  } catch (err) {
    console.error("saveFcmToken error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone is required" });
  }

  try {
    const recentOtp = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1
       ORDER BY id DESC
       LIMIT 1`,
      [phone]
    );

    const now = Date.now();

    if (recentOtp.rows.length > 0) {
      const lastOtp = recentOtp.rows[0];
      const lastSent = new Date(lastOtp.created_at).getTime();

      if (now - lastSent < 60 * 1000) {
        const wait = Math.ceil(
          (60 * 1000 - (now - lastSent)) / 1000
        );

        return res.status(429).json({
          message: `Please wait ${wait}s before requesting another OTP.`,
        });
      }
    }

    const otp = generateOtp();

    await pool.query(
      `UPDATE otp_codes SET used = TRUE WHERE phone = $1`,
      [phone]
    );

    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at, used, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', FALSE, NOW())`,
      [phone, otp]
    );

    const userResult = await pool.query(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.email) {
      await sendEmail(user.email, "Your Login OTP (Resent)", otp);
    } else {
      console.log(`OTP resent to ${phone} (Email not configured)`);
    }

    return res.json({
      message: "OTP resent successfully",
      email_sent: !!user.email,
    });

  } catch (err) {
    console.error("resendOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateEmail = async (req, res) => {
  const { email } = req.body;
  const userId = req.user.id;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await pool.query(
      `UPDATE users SET email = $1 WHERE id = $2`,
      [email, userId]
    );

    return res.json({ message: "Email updated successfully" });
  } catch (err) {
    console.error("updateEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Email OTP Authentication
exports.requestOtpByEmail = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const invitationCode = (req.body.invitationCode || "").trim();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // AUTH MODE 2: Domain Restriction Check
    if (authConfig.isDomainRestricted()) {
      if (!authConfig.isEmailDomainAllowed(email)) {
        return res.status(403).json({
          message: "Email domain not allowed. Please use an authorized email domain.",
        });
      }
    }

    const now = Date.now();

    // Rate limiting: 5 requests per hour
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const hourly = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE email = $1 AND created_at > $2`,
      [email, oneHourAgo]
    );

    if (Number(hourly.rows[0].count) >= 5) {
      return res.status(429).json({
        message: "Too many OTP requests. Try again after 1 hour.",
      });
    }

    // Rate limiting: 3 requests per minute
    const oneMinuteAgo = new Date(now - 60 * 1000);
    const minute = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE email = $1 AND created_at > $2`,
      [email, oneMinuteAgo]
    );

    if (Number(minute.rows[0].count) >= 3) {
      return res.status(429).json({
        message: "Too many OTP requests. Try again after 1 minute.",
      });
    }

    // Check if user exists
    let userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    // AUTH MODE 1: Admin-Only Registration
    if (authConfig.isAdminOnly()) {
      if (userResult.rows.length === 0) {
        return res.status(403).json({
          message: "User not found. Please contact your administrator to create an account.",
        });
      }
    }

    // AUTH MODE 3: Invitation-Only Registration
    if (authConfig.isInvitationOnly()) {
      if (userResult.rows.length === 0) {
        // New user - must have invitation code
        if (!invitationCode) {
          return res.status(403).json({
            message: "Invitation code required for new registrations.",
          });
        }

        // Validate invitation code
        const invitationResult = await pool.query(
          `SELECT * FROM invitations 
           WHERE code = $1 
           AND used = FALSE 
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (email IS NULL OR email = $2)`,
          [invitationCode, email]
        );

        if (invitationResult.rows.length === 0) {
          return res.status(403).json({
            message: "Invalid or expired invitation code.",
          });
        }

        // Store invitation for later use during verification
        req.validInvitation = invitationResult.rows[0];
      }
    }

    // Create user if doesn't exist (only in open mode or with valid invitation)
    if (userResult.rows.length === 0) {
      // Extract name from email (part before @) as default
      const defaultName = email.split('@')[0].replace(/[._-]/g, ' ');

      const newUser = await pool.query(
        `INSERT INTO users (email, role, name)
         VALUES ($1, 'resident', $2)
         RETURNING *`,
        [email, defaultName]
      );
      userResult = newUser;
    }

    const user = userResult.rows[0];
    const otp = generateOtp();

    // Delete old OTPs for this email
    await pool.query(
      `DELETE FROM otp_codes WHERE email = $1`,
      [email]
    );

    // Insert new OTP
    await pool.query(
      `INSERT INTO otp_codes (email, code, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW())`,
      [email, otp]
    );

    // DEMO: Log OTP to console since email might not be configured
    console.log(`[DEMO] OTP for ${email}: ${otp}`);
    console.log(`OTP sent to ${email} (Email delivery simulated)`);

    // Try to send OTP via email (optional - don't fail if email service is down)
    try {
      await sendEmail(email, "Your Login OTP", otp);
    } catch (emailError) {
      console.log('Email send failed (optional):', emailError.message);
    }

    // Log activity (optional - don't fail if this errors)
    try {
      await logActivity({
        userId: user.id,
        type: "otp_requested",
        entityType: "auth",
        title: "OTP Requested",
        description: `OTP sent to ${email}`,
      });
    } catch (activityError) {
      console.log('Activity logging failed (optional):', activityError.message);
    }

    return res.json({
      message: "OTP sent successfully to your email",
      delivered_via_email: true,
    });

  } catch (err) {
    console.error("requestOtpByEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtpByEmail = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const code = (req.body.code || "").trim();
  const invitationCode = (req.body.invitationCode || "").trim();

  if (!email || !code) {
    return res.status(400).json({ message: "Email & OTP code required" });
  }

  try {
    const otpRow = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email = $1
         AND code = $2
         AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [email, code]
    );

    if (otpRow.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Delete used OTP
    await pool.query(
      `DELETE FROM otp_codes WHERE id = $1`,
      [otpRow.rows[0].id]
    );

    // Get user
    let userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    let user;
    let isNewUser = userResult.rows.length === 0;

    if (isNewUser) {
      // For invitation-only mode, validate invitation code again
      if (authConfig.isInvitationOnly()) {
        if (!invitationCode) {
          return res.status(403).json({
            message: "Invitation code required for registration.",
          });
        }

        const invitationResult = await pool.query(
          `SELECT * FROM invitations 
           WHERE code = $1 
           AND used = FALSE 
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (email IS NULL OR email = $2)`,
          [invitationCode, email]
        );

        if (invitationResult.rows.length === 0) {
          return res.status(403).json({
            message: "Invalid or expired invitation code.",
          });
        }

        const invitation = invitationResult.rows[0];

        // Create user with role from invitation
        const newUser = await pool.query(
          `INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *`,
          [email, invitation.role || 'resident']
        );
        user = newUser.rows[0];

        // Mark invitation as used
        await pool.query(
          `UPDATE invitations SET used = TRUE, used_by = $1, used_at = NOW() WHERE id = $2`,
          [user.id, invitation.id]
        );

      } else {
        // Open mode or other modes - create user as resident
        const newUser = await pool.query(
          `INSERT INTO users (email, role) VALUES ($1, 'resident') RETURNING *`,
          [email]
        );
        user = newUser.rows[0];
      }

      await logActivity({
        userId: user.id,
        type: "user_registered",
        entityType: "user",
        title: "User Registered",
        description: `New user registered: ${email}`,
      });

    } else {
      user = userResult.rows[0];
    }

    const token = createToken(user);

    await logActivity({
      userId: user.id,
      type: "login",
      entityType: "auth",
      title: "User Logged In",
      description: `User logged in via email: ${email}`,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
        block: user.block,
        flat_number: user.flat_number,
      },
    });

  } catch (err) {
    console.error("verifyOtpByEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Check password if exists
    if (!user.password_hash) {
      return res.status(400).json({ message: "Please use OTP login for this account" });
    }

    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);

    await logActivity({
      userId: user.id,
      type: "user_login",
      entityType: "auth",
      title: "Login",
      description: `User logged in via password`,
    });

    res.json({ token, user });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Request OTP for password change
exports.requestPasswordChangeOtp = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ message: "Current password is required" });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(400).json({ message: "No password set. Please contact administrator." });
    }

    // Verify current password
    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await pool.query(
      `INSERT INTO otps (identifier, otp_code, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (identifier) DO UPDATE SET otp_code = $2, expires_at = $3`,
      [user.email, otp, expiresAt]
    );

    // Send OTP email
    const sendEmail = require("../../utils/sendEmail");
    await sendEmail(
      user.email,
      "Password Change OTP",
      `Your OTP to update password is: ${otp}. Valid for 10 minutes.`
    );

    await logActivity({
      userId: user.id,
      type: "password_change_otp_requested",
      entityType: "auth",
      title: "Password Change OTP",
      description: `Requested OTP for password change`,
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("requestPasswordChangeOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP and update password
exports.verifyOtpAndChangePassword = async (req, res) => {
  const userId = req.user.id;
  const { otp, newPassword } = req.body;

  if (!otp || !newPassword) {
    return res.status(400).json({ message: "OTP and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Verify OTP
    const otpResult = await pool.query(
      `SELECT * FROM otps WHERE identifier = $1 AND otp_code = $2 AND expires_at > NOW()`,
      [user.email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );

    // Delete used OTP
    await pool.query(`DELETE FROM otps WHERE identifier = $1`, [user.email]);

    await logActivity({
      userId: user.id,
      type: "password_changed",
      entityType: "auth",
      title: "Password Changed",
      description: `Password updated successfully`,
    });

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("verifyOtpAndChangePassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin OTP Login - Request OTP
 * Multi-tenant: Email-based OTP authentication for admins
 */
exports.adminRequestOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if user exists with admin role
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = $2",
      [email, "admin"]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Email not registered as admin" });
    }

    const user = userResult.rows[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await pool.query(
      `INSERT INTO otps (identifier, otp_code, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (identifier) DO UPDATE SET otp_code = $2, expires_at = $3`,
      [email, otp, expiresAt]
    );

    // Send OTP email
    const sendEmail = require("../../utils/sendEmail");
    await sendEmail(
      email,
      "Admin Login OTP",
      `Your OTP for admin login is: ${otp}. Valid for 10 minutes.`
    );

    await logActivity({
      userId: user.id,
      type: "admin_otp_requested",
      entityType: "auth",
      title: "Admin OTP Requested",
      description: `OTP requested for admin login`,
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("adminRequestOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin OTP Login - Verify OTP and login
 * Returns user info and is_first_login status
 */
exports.adminVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    // Verify OTP
    const otpResult = await pool.query(
      `SELECT * FROM otps WHERE identifier = $1 AND otp_code = $2 AND expires_at > NOW()`,
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Get user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = $2",
      [email, "admin"]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const user = userResult.rows[0];

    // Delete used OTP
    await pool.query(`DELETE FROM otps WHERE identifier = $1`, [email]);

    // Create JWT token
    const token = createToken(user);

    await logActivity({
      userId: user.id,
      type: "admin_login",
      entityType: "auth",
      title: "Admin Login",
      description: `Admin logged in via OTP`,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        society_id: user.society_id,
        is_first_login: user.is_first_login
      }
    });

  } catch (err) {
    console.error("adminVerifyOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
