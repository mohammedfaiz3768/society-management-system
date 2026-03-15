const db = require("../../config/db");
const crypto = require("crypto");

function generateAccessToken() {
  return "KEY-" + crypto.randomBytes(16).toString("hex").toUpperCase();
}

exports.requestAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { camera_id } = req.body;

    const user = await db.query(
      "SELECT subscription_tier FROM users WHERE id = $1",
      [userId]
    );

    if (!user.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.rows[0].subscription_tier === "FREE") {
      return res.status(403).json({
        error: "Upgrade to BASIC plan to request CCTV access",
      });
    }

    const request = await db.query(
      `INSERT INTO cctv_access_requests (user_id, camera_id)
       VALUES ($1, $2) RETURNING *`,
      [userId, camera_id]
    );

    res.json({
      success: true,
      message: "CCTV access request submitted to admin",
      request: request.rows[0],
    });
  } catch (error) {
    console.error("requestAccess error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { request_id } = req.body;

    const update = await db.query(
      `UPDATE cctv_access_requests
       SET status='APPROVED', admin_id=$1, approved_at=NOW(),
           expires_at = NOW() + INTERVAL '15 minutes'
       WHERE id=$2 RETURNING *`,
      [adminId, request_id]
    );

    if (!update.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }

    const reqData = update.rows[0];

    const token = generateAccessToken();

    await db.query(
      `INSERT INTO cctv_access_tokens 
       (request_id, user_id, camera_id, access_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        reqData.id,
        reqData.user_id,
        reqData.camera_id,
        token,
        reqData.expires_at,
      ]
    );

    res.json({
      success: true,
      message: "Request approved. Token generated.",
      token,
      expires_at: reqData.expires_at,
    });
  } catch (error) {
    console.error("approveRequest error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { request_id } = req.body;

    const reject = await db.query(
      `UPDATE cctv_access_requests
       SET status='REJECTED', admin_id=$1
       WHERE id=$2 RETURNING *`,
      [adminId, request_id]
    );

    if (!reject.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ success: true, message: "Request rejected." });
  } catch (error) {
    console.error("rejectRequest error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.validateToken = async (req, res) => {
  try {
    const { token, camera_id } = req.query;

    const now = new Date();

    const result = await db.query(
      `SELECT * FROM cctv_access_tokens
       WHERE access_token=$1 AND camera_id=$2 AND expires_at > $3`,
      [token, camera_id, now]
    );

    if (!result.rows.length) {
      return res.status(403).json({ error: "Access denied or token expired" });
    }

    res.json({ success: true, message: "Token valid" });
  } catch (error) {
    console.error("validateToken error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
