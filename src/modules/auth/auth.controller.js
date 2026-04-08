const pool = require("../../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dotenv = require("dotenv");
const { logActivity } = require("../../utils/activityLogger");
const { sendEmail } = require("../../utils/sendEmail");
const authConfig = require("../../config/authConfig");

dotenv.config();


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      phone: user.phone,
      society_id: user.society_id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    society_id: user.society_id,
    block: user.block,
    flat_number: user.flat_number,
    is_first_login: user.is_first_login,
  };
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
      return res.status(429).json({ message: "Too many OTP requests. Try again after 1 hour." });
    }

    const oneMinuteAgo = new Date(now - 60 * 1000);
    const minute = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE phone = $1 AND created_at > $2`,
      [phone, oneMinuteAgo]
    );
    if (Number(minute.rows[0].count) >= 3) {
      return res.status(429).json({ message: "Too many OTP requests. Please wait a minute." });
    }

    let userResult = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        `INSERT INTO users (phone, role) VALUES ($1, 'resident') RETURNING *`,
        [phone]
      );
    }

    const user = userResult.rows[0];

    if (!user.email) {
      return res.status(400).json({
        message: "No email linked to this account. Please contact your administrator.",
        email_sent: false,
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await pool.query(`UPDATE otp_codes SET used = TRUE WHERE phone = $1`, [phone]);

    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at, used, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', FALSE, NOW())`,
      [phone, otpHash]
    );

    await sendEmail(user.email, "Your Login OTP", otp);

    await logActivity({
      userId: user.id,
      type: "otp_requested",
      entityType: "auth",
      title: "OTP Requested",
      description: `OTP sent to ${phone}`,
    });

    return res.json({ message: "OTP sent successfully", delivered_via_email: true });

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
    const codeHash = hashOtp(code);

    const otpRow = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1
         AND otp = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [phone, codeHash]
    );

    if (otpRow.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await pool.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [otpRow.rows[0].id]);

    let userResult = await pool.query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    let user;

    if (userResult.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO users (phone, role) VALUES ($1, 'resident') RETURNING *`,
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

    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, society_id, block, flat_number, is_first_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
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
    await pool.query(`UPDATE users SET fcm_token = $1 WHERE id = $2`, [fcm_token, userId]);

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
  const { phone, email } = req.body;

  // Email-based resend (used by mobile app)
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const recentOtp = await pool.query(
        `SELECT * FROM otp_codes WHERE email = $1 ORDER BY id DESC LIMIT 1`,
        [normalizedEmail]
      );

      if (recentOtp.rows.length > 0) {
        const lastSent = new Date(recentOtp.rows[0].created_at).getTime();
        const diff = Date.now() - lastSent;
        if (diff < 60 * 1000) {
          const wait = Math.ceil((60 * 1000 - diff) / 1000);
          return res.status(429).json({ message: `Please wait ${wait}s before requesting another OTP.` });
        }
      }

      const otp = generateOtp();
      const otpHash = hashOtp(otp);

      await pool.query(`DELETE FROM otp_codes WHERE email = $1`, [normalizedEmail]);
      await pool.query(
        `INSERT INTO otp_codes (email, code, expires_at, created_at)
         VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW())`,
        [normalizedEmail, otpHash]
      );

      if (process.env.NODE_ENV !== "never") {
        console.log(`[DEV] RESEND EMAIL OTP for ${normalizedEmail}: ${otp}`);
      }

      sendEmail(normalizedEmail, "Your Login OTP (Resent)", otp).catch((err) =>
        console.error("Email resend failed:", err.message)
      );

      return res.json({ message: "OTP resent successfully" });
    } catch (err) {
      console.error("resendOtp (email) error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // Phone-based resend
  if (!phone) {
    return res.status(400).json({ message: "Phone or email is required" });
  }

  try {
    const userResult = await pool.query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const recentOtp = await pool.query(
      `SELECT * FROM otp_codes WHERE phone = $1 ORDER BY id DESC LIMIT 1`,
      [phone]
    );

    if (recentOtp.rows.length > 0) {
      const lastSent = new Date(recentOtp.rows[0].created_at).getTime();
      const diff = Date.now() - lastSent;
      if (diff < 60 * 1000) {
        const wait = Math.ceil((60 * 1000 - diff) / 1000);
        return res.status(429).json({ message: `Please wait ${wait}s before requesting another OTP.` });
      }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await pool.query(`UPDATE otp_codes SET used = TRUE WHERE phone = $1`, [phone]);
    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at, used, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', FALSE, NOW())`,
      [phone, otpHash]
    );

    if (user.email) {
      await sendEmail(user.email, "Your Login OTP (Resent)", otp);
    }

    return res.json({ message: "OTP resent successfully", email_sent: !!user.email });

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email.toLowerCase(), userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already in use by another account" });
    }

    await pool.query(
      `UPDATE users SET email = $1 WHERE id = $2`,
      [email.toLowerCase(), userId]
    );

    return res.json({ message: "Email updated successfully" });
  } catch (err) {
    console.error("updateEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.requestOtpByEmail = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const invitationCode = (req.body.invitationCode || "").trim();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    if (authConfig.isDomainRestricted() && !authConfig.isEmailDomainAllowed(email)) {
      return res.status(403).json({ message: "Email domain not allowed." });
    }

    const now = Date.now();

    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const hourly = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE email = $1 AND created_at > $2`,
      [email, oneHourAgo]
    );
    if (Number(hourly.rows[0].count) >= 5) {
      return res.status(429).json({ message: "Too many OTP requests. Try again after 1 hour." });
    }

    const oneMinuteAgo = new Date(now - 60 * 1000);
    const minute = await pool.query(
      `SELECT COUNT(*) FROM otp_codes WHERE email = $1 AND created_at > $2`,
      [email, oneMinuteAgo]
    );
    if (Number(minute.rows[0].count) >= 3) {
      return res.status(429).json({ message: "Too many OTP requests. Try again after 1 minute." });
    }

    let userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (authConfig.isAdminOnly() && userResult.rows.length === 0) {
      return res.status(403).json({ message: "Please contact your administrator to create an account." });
    }

    if (authConfig.isInvitationOnly() && userResult.rows.length === 0) {
      if (!invitationCode) {
        return res.status(403).json({ message: "Invitation code required for new registrations." });
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
        return res.status(403).json({ message: "Invalid or expired invitation code." });
      }

      req.validInvitation = invitationResult.rows[0];
    }

    if (userResult.rows.length === 0) {
      const defaultName = email.split("@")[0].replace(/[._-]/g, " ");
      userResult = await pool.query(
        `INSERT INTO users (email, role, name) VALUES ($1, 'resident', $2) RETURNING *`,
        [email, defaultName]
      );
    }

    const user = userResult.rows[0];
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await pool.query(`DELETE FROM otp_codes WHERE email = $1`, [email]);
    await pool.query(
      `INSERT INTO otp_codes (email, code, expires_at, created_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW())`,
      [email, otpHash]
    );

    if (process.env.NODE_ENV !== "never") {
      console.log(`[DEV] EMAIL OTP for ${email}: ${otp}`);
    }

    sendEmail(email, "Your Login OTP", otp).catch((err) =>
      console.error("Email send failed:", err.message)
    );

    try {
      await logActivity({
        userId: user.id,
        type: "otp_requested",
        entityType: "auth",
        title: "OTP Requested",
        description: `OTP sent to ${email}`,
      });
    } catch (activityError) {
      console.error("Activity logging failed:", activityError.message);
    }

    return res.json({ message: "OTP sent successfully to your email", delivered_via_email: true });

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
    const codeHash = hashOtp(code);

    const otpRow = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email = $1
         AND code = $2
         AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [email, codeHash]
    );

    if (otpRow.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await pool.query(`DELETE FROM otp_codes WHERE id = $1`, [otpRow.rows[0].id]);

    let userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    let user;
    const isNewUser = userResult.rows.length === 0;

    if (isNewUser) {
      if (authConfig.isInvitationOnly()) {
        if (!invitationCode) {
          return res.status(403).json({ message: "Invitation code required for registration." });
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
          return res.status(403).json({ message: "Invalid or expired invitation code." });
        }

        const invitation = invitationResult.rows[0];
        const newUser = await pool.query(
          `INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *`,
          [email, invitation.role || "resident"]
        );
        user = newUser.rows[0];

        await pool.query(
          `UPDATE invitations SET used = TRUE, used_by = $1, used_at = NOW() WHERE id = $2`,
          [user.id, invitation.id]
        );
      } else {
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

    return res.json({ message: "Login successful", token, user: safeUser(user) });

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

    if (!user.password_hash) {
      return res.status(400).json({ message: "Please use OTP login for this account" });
    }

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

    return res.json({ token, user: safeUser(user) });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


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

    if (!user.password_hash) {
      return res.status(400).json({ message: "No password set. Please contact administrator." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otps (identifier, otp_code, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (identifier) DO UPDATE SET otp_code = $2, expires_at = $3`,
      [user.email, hashOtp(otp), expiresAt]
    );

    if (process.env.NODE_ENV !== "never") {
      console.log(`[DEV] PASSWORD CHANGE OTP for ${user.email}: ${otp}`);
    }

    await sendEmail(user.email, "Your Password Change OTP", otp);

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

    const otpResult = await pool.query(
      `SELECT * FROM otps WHERE identifier = $1 AND otp_code = $2 AND expires_at > NOW()`,
      [user.email, hashOtp(otp)]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );

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


exports.adminRequestOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = $2",
      [email, "admin"]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Email not registered as admin" });
    }

    const user = userResult.rows[0];
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otps (identifier, otp_code, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (identifier) DO UPDATE SET otp_code = $2, expires_at = $3`,
      [email, hashOtp(otp), expiresAt]
    );

    if (process.env.NODE_ENV !== "never") {
      console.log(`[DEV] ADMIN OTP for ${email}: ${otp}`);
    }

    sendEmail(email, "Your Admin Login OTP", otp).catch(err =>
      console.error("Admin OTP email failed:", err.message)
    );

    try {
      await logActivity({
        userId: user.id,
        type: "admin_otp_requested",
        entityType: "auth",
        title: "Admin OTP Requested",
        description: `OTP requested for admin login`,
      });
    } catch (_) {}

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("adminRequestOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.adminVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const otpResult = await pool.query(
      `SELECT * FROM otps WHERE identifier = $1 AND otp_code = $2 AND expires_at > NOW()`,
      [email, hashOtp(otp)]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = $2",
      [email, "admin"]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const user = userResult.rows[0];

    await pool.query(`DELETE FROM otps WHERE identifier = $1`, [email]);

    const token = createToken(user);

    await logActivity({
      userId: user.id,
      type: "admin_login",
      entityType: "auth",
      title: "Admin Login",
      description: `Admin logged in via OTP`,
    });

    return res.json({ token, user: safeUser(user) });

  } catch (err) {
    console.error("adminVerifyOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
