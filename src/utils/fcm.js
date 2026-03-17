const { admin, isInitialized } = require("../config/firebase");
const pool = require("../config/db");

const BATCH_SIZE = 500; // Firebase multicast limit per call

async function sendToUser(userId, title, body, data = {}) {
  if (!isInitialized || !admin) {
    console.warn("[FCM] Firebase not initialized — skipping notification");
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL`,
      [userId]
    );

    if (result.rows.length === 0) return;

    const token = result.rows[0].fcm_token;

    // ✅ Stringify all data values — FCM requires strings
    const stringifiedData = Object.fromEntries(
      Object.entries({ click_action: "FLUTTER_NOTIFICATION_CLICK", ...data })
        .map(([k, v]) => [k, String(v)])
    );

    const message = {
      notification: { title, body },
      token,
      data: stringifiedData,
    };

    await admin.messaging().send(message);
    console.log(`[FCM] Sent to user ${userId}`);

  } catch (err) {
    // ✅ Clean up invalid/expired tokens automatically
    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      await pool.query(
        `UPDATE users SET fcm_token = NULL WHERE id = $1`,
        [userId]
      );
      console.warn(`[FCM] Cleared invalid token for user ${userId}`);
    } else {
      console.error("[FCM] sendToUser error:", err);
    }
  }
}

// ✅ societyId is now required — never broadcast across societies
async function sendToAllResidents(societyId, title, body, data = {}) {
  if (!isInitialized || !admin) {
    console.warn("[FCM] Firebase not initialized — skipping notification");
    return;
  }

  if (!societyId) {
    console.error("[FCM] sendToAllResidents called without societyId — aborted");
    return;
  }

  try {
    // ✅ Scoped to one society only
    const result = await pool.query(
      `SELECT fcm_token FROM users 
             WHERE role = 'resident'
               AND society_id = $1
               AND fcm_token IS NOT NULL`,
      [societyId]
    );

    const tokens = result.rows.map((r) => r.fcm_token);
    if (tokens.length === 0) return;

    // ✅ Stringify all data values
    const stringifiedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    let totalSent = 0;
    let totalFailed = 0;
    const failedTokens = [];

    // ✅ Batch in groups of 500 — Firebase multicast limit
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);

      // ✅ sendEachForMulticast — sendMulticast is deprecated
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        tokens: batch,
        data: stringifiedData,
      });

      totalSent += response.successCount;
      totalFailed += response.failureCount;

      // ✅ Collect failed tokens for cleanup
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(batch[idx]);
        }
      });
    }

    // ✅ Remove invalid/expired tokens from DB
    if (failedTokens.length > 0) {
      await pool.query(
        `UPDATE users SET fcm_token = NULL WHERE fcm_token = ANY($1)`,
        [failedTokens]
      );
      console.warn(`[FCM] Cleaned up ${failedTokens.length} invalid tokens`);
    }

    console.log(`[FCM] Broadcast to society ${societyId}: ${totalSent} sent, ${totalFailed} failed`);

  } catch (err) {
    console.error("[FCM] sendToAllResidents error:", err);
  }
}

module.exports = { sendToUser, sendToAllResidents };