const pool = require("../../config/db");

exports.getAdminStats = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const [
      totalResidentsRes,
      totalGuardsRes,
      totalAdminsRes,
      totalFlatsRes,
      totalStaffRes,
      openComplaintsRes,
      openServicesRes,
      openEmergenciesRes,
      upcomingEventsRes,
      todayVisitorsRes,
      todayVisitorVehiclesRes,
      activePollsRes,
      documentsRes,
      announcementsRes,
    ] = await Promise.all([
      // ✅ All queries scoped to societyId — no platform-wide leaks
      pool.query("SELECT COUNT(*) FROM users WHERE role='resident' AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM users WHERE role='guard' AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM users WHERE role='admin' AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM flats WHERE society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM staff WHERE society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM complaints WHERE status != 'resolved' AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM service_requests WHERE status != 'completed' AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM emergency_alerts WHERE status != 'resolved' AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM visitors WHERE DATE(in_time) = CURRENT_DATE AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM visitor_parking WHERE DATE(in_time) = CURRENT_DATE AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM polls WHERE (end_date IS NULL OR end_date >= NOW()) AND society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM documents WHERE society_id=$1", [societyId]),
      pool.query("SELECT COUNT(*) FROM announcements WHERE society_id=$1", [societyId]),
    ]);

    return res.json({
      users: {
        residents: parseInt(totalResidentsRes.rows[0].count, 10),
        guards: parseInt(totalGuardsRes.rows[0].count, 10),
        admins: parseInt(totalAdminsRes.rows[0].count, 10),
      },
      flats: parseInt(totalFlatsRes.rows[0].count, 10),
      staff: parseInt(totalStaffRes.rows[0].count, 10),
      complaints_open: parseInt(openComplaintsRes.rows[0].count, 10),
      services_open: parseInt(openServicesRes.rows[0].count, 10),
      emergencies_open: parseInt(openEmergenciesRes.rows[0].count, 10),
      upcoming_events: parseInt(upcomingEventsRes.rows[0].count, 10),
      today_visitors: parseInt(todayVisitorsRes.rows[0].count, 10),
      today_visitor_vehicles: parseInt(todayVisitorVehiclesRes.rows[0].count, 10),
      active_polls: parseInt(activePollsRes.rows[0].count, 10),
      documents_total: parseInt(documentsRes.rows[0].count, 10),
      announcements_total: parseInt(announcementsRes.rows[0].count, 10),
    });

  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getResidentStats = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId; // ✅ was missing entirely

  try {
    const [
      myFlatRes,
      myComplaintsOpenRes,
      myServicesOpenRes,
      myVisitorsTodayRes,
      myNotificationsUnreadRes,
      upcomingEventsRes,
      latestAnnouncementsRes,
    ] = await Promise.all([
      pool.query(
        // ✅ Society-scoped JOIN — prevents wrong flat from same number in other society
        `SELECT f.* FROM flats f
                 JOIN users u ON f.flat_number = u.flat_number
                              AND f.society_id = u.society_id
                 WHERE u.id = $1`,
        [userId]
      ),
      pool.query(
        // ✅ Society scoped
        `SELECT COUNT(*) FROM complaints
                 WHERE user_id=$1 AND society_id=$2 AND status != 'resolved'`,
        [userId, societyId]
      ),
      pool.query(
        // ✅ Society scoped
        `SELECT COUNT(*) FROM service_requests
                 WHERE user_id=$1 AND society_id=$2 AND status != 'completed'`,
        [userId, societyId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM visitors
                 WHERE resident_id=$1 AND DATE(in_time) = CURRENT_DATE`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM notifications
                 WHERE user_id=$1 AND is_read = FALSE`,
        [userId]
      ),
      pool.query(
        // ✅ Society scoped
        `SELECT * FROM events
                 WHERE date >= CURRENT_DATE AND society_id=$1
                 ORDER BY date ASC, start_time ASC
                 LIMIT 5`,
        [societyId]
      ),
      pool.query(
        // ✅ Society scoped
        `SELECT * FROM notices
                 WHERE society_id=$1
                 ORDER BY created_at DESC
                 LIMIT 5`,
        [societyId]
      ),
    ]);

    return res.json({
      flat: myFlatRes.rows[0] || null,
      complaints_open: parseInt(myComplaintsOpenRes.rows[0].count, 10),
      services_open: parseInt(myServicesOpenRes.rows[0].count, 10),
      today_visitors: parseInt(myVisitorsTodayRes.rows[0].count, 10),
      notifications_unread: parseInt(myNotificationsUnreadRes.rows[0].count, 10),
      upcoming_events: upcomingEventsRes.rows,
      latest_announcements: latestAnnouncementsRes.rows,
    });

  } catch (err) {
    console.error("getResidentStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGuardStats = async (req, res) => {
  const guardId = req.user.id;
  const societyId = req.societyId;

  // ✅ Guard/admin only
  if (!["guard", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Guard access required" });
  }

  try {
    const [
      myVisitorsTodayRes,
      myVisitorVehiclesTodayRes,
      openEmergenciesRes,
      latestAnnouncementsRes,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM visitors
                 WHERE guard_id=$1 AND DATE(in_time) = CURRENT_DATE`,
        [guardId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM visitor_parking
                 WHERE guard_id=$1 AND DATE(in_time) = CURRENT_DATE`,
        [guardId]
      ),
      pool.query(
        // ✅ Society scoped
        `SELECT COUNT(*) FROM emergency_alerts
                 WHERE status != 'resolved' AND society_id=$1`,
        [societyId]
      ),
      pool.query(
        // ✅ Society scoped
        `SELECT * FROM announcements
                 WHERE society_id=$1
                 ORDER BY created_at DESC
                 LIMIT 5`,
        [societyId]
      ),
    ]);

    return res.json({
      today_visitors: parseInt(myVisitorsTodayRes.rows[0].count, 10),
      today_visitor_vehicles: parseInt(myVisitorVehiclesTodayRes.rows[0].count, 10),
      emergencies_open: parseInt(openEmergenciesRes.rows[0].count, 10),
      latest_announcements: latestAnnouncementsRes.rows,
    });

  } catch (err) {
    console.error("getGuardStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};