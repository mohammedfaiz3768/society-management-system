const db = require("../../config/db");
const { sendSosPush } = require("../../hidden/notifications/notificationService");
const { sendPushNotification } = require("../../utils/pushNotifications"); // ✅ moved to top
const { sendPushToUser } = require("../../utils/fcm");                     // ✅ moved to top
const { EMERGENCY_SERVICES, getServiceForType } = require("../../config/emergencyServices");

exports.createSOS = async (req, res) => {
  try {
    const user = req.user;
    const societyId = req.societyId;
    const { lat, lng, message, type, trigger_buzzer, auto_call } = req.body;

    // ✅ Always fetch fresh user data — JWT may have stale flat/block info
    const userResult = await db.query(
      `SELECT name, block, flat_number FROM users WHERE id=$1`,
      [user.id]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const freshUser = userResult.rows[0];

    // ✅ Warn if no GPS — still save the SOS
    if (!lat || !lng) {
      console.warn(`SOS created without GPS coordinates for user ${user.id}`);
    }

    const emergencyType = type || "general";
    const emergencyService = emergencyType !== "general"
      ? getServiceForType(emergencyType)?.name
      : null;

    const insert = await db.query(
      `INSERT INTO sos_alerts
             (user_id, user_name, block, flat, location_lat, location_lng, message,
              emergency_type, emergency_service, trigger_buzzer, auto_called, society_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
      [
        user.id,
        freshUser.name,           // ✅ fresh from DB
        freshUser.block,          // ✅ fresh from DB
        freshUser.flat_number,    // ✅ fresh from DB
        lat || null,
        lng || null,
        message || "SOS Emergency",
        emergencyType,
        emergencyService,
        trigger_buzzer || false,
        auto_call || false,
        societyId,
      ]
    );

    const sos = insert.rows[0];

    // ✅ Emit via Socket.IO for users currently online in the app
    const io = req.app.get("socketio");
    if (io) {
      io.to(`society_${societyId}`).emit("sos-alert", {
        sosId: sos.id,
        userName: sos.user_name,
        flat: sos.flat,
        emergencyType: sos.emergency_type,
        location: { lat: sos.location_lat, lng: sos.location_lng },
      });
    }

    // Push notifications in background — don't block response
    if (trigger_buzzer) {
      sendBuzzerAlert(sos, societyId).catch(console.error);
    } else {
      sendSosPush(sos).catch(console.error);
    }

    return res.json({ success: true, sos });

  } catch (err) {
    console.error("SOS Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.respondSOS = async (req, res) => {
  try {
    const responder = req.user;
    const societyId = req.societyId;
    const { sos_id } = req.body;

    if (!sos_id) {
      return res.status(400).json({ error: "sos_id is required" });
    }

    // ✅ Verify SOS belongs to this society — prevent cross-society access
    const sosCheck = await db.query(
      `SELECT id FROM sos_alerts WHERE id=$1 AND society_id=$2`,
      [sos_id, societyId]
    );

    if (!sosCheck.rows.length) {
      return res.status(404).json({ error: "SOS not found" });
    }

    await db.query(
      `INSERT INTO sos_responses (sos_id, responder_id, responder_name)
             VALUES ($1,$2,$3)`,
      [sos_id, responder.id, responder.name]
    );

    await db.query(
      `UPDATE sos_alerts SET status='RESPONDING'
             WHERE id=$1 AND status='ACTIVE' AND society_id=$2`,
      [sos_id, societyId]
    );

    return res.json({ success: true, message: `${responder.name} is responding` });

  } catch (err) {
    console.error("Respond SOS error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.resolveSOS = async (req, res) => {
  try {
    const sosId = req.params.id;
    const resolver = req.user;
    const societyId = req.societyId;

    // ✅ Only admins or guards can resolve SOS alerts
    if (!["admin", "guard"].includes(resolver.role)) {
      return res.status(403).json({ error: "Only admins or guards can resolve SOS alerts" });
    }

    // ✅ Scoped to society — prevent cross-society resolution
    const result = await db.query(
      `UPDATE sos_alerts
             SET status='RESOLVED', resolved_at=NOW()
             WHERE id=$1 AND society_id=$2
             RETURNING id`,
      [sosId, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "SOS not found" });
    }

    await db.query(
      `INSERT INTO sos_responses (sos_id, responder_id, responder_name)
             VALUES ($1,$2,$3)`,
      [sosId, resolver.id, resolver.name]
    );

    return res.json({ success: true });

  } catch (err) {
    console.error("Resolve SOS error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.listSOS = async (req, res) => {
  try {
    const societyId = req.societyId;

    const { rows } = await db.query(
      `SELECT * FROM sos_alerts WHERE society_id=$1 ORDER BY created_at DESC`,
      [societyId]
    );

    return res.json(rows);

  } catch (err) {
    console.error("List SOS error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getEmergencyContacts = async (req, res) => {
  try {
    return res.json({ success: true, contacts: EMERGENCY_SERVICES });
  } catch (err) {
    console.error("Emergency contacts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Internal helper ──────────────────────────────────────────────────────────

async function sendBuzzerAlert(sos, societyId) {
  try {
    const residents = await db.query(
      `SELECT id, fcm_token, expo_push_token FROM users
             WHERE society_id=$1 AND role='resident'
             AND (fcm_token IS NOT NULL OR expo_push_token IS NOT NULL)`,
      [societyId]
    );

    const pushPromises = residents.rows.map(async (resident) => {
      const notification = {
        sound: "default",
        priority: "high",
        title: "🚨 EMERGENCY ALERT",
        body: `SOS from ${sos.user_name} - Flat ${sos.flat}`,
        data: {
          type: "SOS_BUZZER",
          sosId: sos.id,
          emergencyType: sos.emergency_type,
          location: { lat: sos.location_lat, lng: sos.location_lng },
          triggerBuzzer: true,
        },
        android: { priority: "max", sound: "alarm" },
        ios: { sound: "alarm.wav", interruptionLevel: "critical" },
      };

      // ✅ FCM branch is now filled in — was empty before
      if (resident.fcm_token) {
        await sendPushToUser(resident.fcm_token, {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
      } else if (resident.expo_push_token) {
        await sendPushNotification({
          ...notification,
          to: resident.expo_push_token,
        });
      }
    });

    // ✅ allSettled — one failed token doesn't cancel the whole broadcast
    await Promise.allSettled(pushPromises);

  } catch (error) {
    console.error("Buzzer alert error:", error);
  }
}