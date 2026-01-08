const db = require("../../config/db");

// ========================================================
// 📊 1. Summary Stats for Dashboard (Top Cards)
// ========================================================
exports.getSummaryStats = async (req, res) => {
  try {
    const totalEvents = await db.query(
      `SELECT COUNT(*) FROM ai_events`
    );

    const todayEvents = await db.query(
      `SELECT COUNT(*) FROM ai_events 
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    const criticalEvents = await db.query(
      `SELECT COUNT(*) FROM ai_events 
       WHERE event_type IN ('fire','weapon','flood','violence')`
    );

    const uniqueCameras = await db.query(
      `SELECT COUNT(DISTINCT camera_id) FROM ai_events`
    );

    res.json({
      total_events: Number(totalEvents.rows[0].count),
      today_events: Number(todayEvents.rows[0].count),
      critical_events: Number(criticalEvents.rows[0].count),
      active_cameras: Number(uniqueCameras.rows[0].count)
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ========================================================
// 📈 2. AI Event Trend (Last 30 Days)
// ========================================================
exports.getEventTrend = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        DATE(created_at) AS day,
        COUNT(*) AS events
      FROM ai_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Event trend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ========================================================
// 🎥 3. Events by Camera
// ========================================================
exports.getCameraStats = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        camera_id,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE event_type = 'person') AS person_count,
        COUNT(*) FILTER (WHERE event_type = 'vehicle') AS vehicle_count,
        COUNT(*) FILTER (WHERE event_type IN ('fire','flood','weapon','violence')) AS critical_count
      FROM ai_events
      GROUP BY camera_id
      ORDER BY total_events DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Camera stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ========================================================
// 🔥 4. Critical Alerts (Last 20)
// ========================================================
exports.getCriticalAlerts = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM ai_events
      WHERE event_type IN ('fire','weapon','flood','violence')
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json(rows);
  } catch (err) {
    console.error("Critical Alerts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ========================================================
// 📰 5. Recent Events Feed (Latest 50)
// ========================================================
exports.getRecentEvents = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM ai_events
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json(rows);
  } catch (err) {
    console.error("Recent events error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
