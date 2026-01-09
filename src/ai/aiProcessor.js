const ffmpeg = require("fluent-ffmpeg");
const db = require("../config/db");
const { admin, isInitialized } = require("../config/firebase");

// AI Placeholder: returns fake AI output
async function runAiOnFrame(imagePath) {
  return {
    person_count: Math.floor(Math.random() * 3),  // 0–2 people
    motion_level: Math.random(),
    vehicles: [],
    faces: []
  };
}

// Save AI event in DB
async function saveEvent(cameraId, snapshotPath, aiData) {
  await db.query(
    `INSERT INTO cctv_events (camera_id, event_type, snapshot_url, ai_data)
     VALUES ($1, $2, $3, $4)`,
    [cameraId, "AI_EVENT", snapshotPath, aiData]
  );
}

// Send alert to admin if needed
async function sendAlert(cameraId, aiData) {
  if (!isInitialized || !admin) {
    console.warn("Firebase not initialized - skipping AI alert");
    return;
  }

  if (aiData.person_count > 0 || aiData.motion_level > 0.6) {
    const tokens = await db.query(`
      SELECT fcm_token FROM fcm_tokens 
      WHERE user_id IN (SELECT id FROM users WHERE role IN ('ADMIN','SECURITY'))
    `);

    const fcmList = tokens.rows.map(t => t.fcm_token);

    if (fcmList.length) {
      await admin.messaging().sendEachForMulticast({
        notification: {
          title: "CCTV AI Alert",
          body: `Camera ${cameraId}: Suspicious activity detected`
        },
        data: {
          camera_id: cameraId.toString(),
          type: "AI_ALERT"
        },
        tokens: fcmList
      });
    }
  }
}

// AI Engine: capture frame → run AI → store result
async function analyzeCamera(camera) {
  const snapshot = `snapshots/ai_cam_${camera.id}_${Date.now()}.jpg`;

  return new Promise((resolve, reject) => {
    ffmpeg(camera.rtsp_url)
      .frames(1)
      .save(snapshot)
      .on("end", async () => {
        const aiData = await runAiOnFrame(snapshot);
        await saveEvent(camera.id, snapshot, aiData);
        await sendAlert(camera.id, aiData);
        resolve();
      })
      .on("error", err => reject(err));
  });
}

// Main loop every 10 seconds
async function startAiLoop() {
  console.log("AI Processor started...");

  setInterval(async () => {
    const camList = await db.query(`SELECT * FROM cctv_cameras WHERE is_active = TRUE`);

    for (let cam of camList.rows) {
      try {
        analyzeCamera(cam);
      } catch (err) {
        console.error("AI camera error:", err);
      }
    }
  }, 10000);
}

module.exports = { startAiLoop };
