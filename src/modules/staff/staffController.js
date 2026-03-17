const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");
const { logActivity } = require("../../utils/activityLogger");

// ─── Staff CRUD ──────────────────────────────────────────────────────────────

exports.addStaff = async (req, res) => {
  const { name, phone, role, shift_start, shift_end } = req.body;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can add staff" });
  }

  if (!name || !role) {
    return res.status(400).json({ message: "name and role are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO staff (name, phone, role, shift_start, shift_end, society_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      [name, phone || "", role, shift_start || null, shift_end || null, societyId]
    );

    await logActivity({
      userId: req.user.id,
      type: "staff_added",
      entityType: "staff",
      entityId: result.rows[0].id,
      title: "Staff added",
      description: `${name} added as ${role}`,
    });

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("addStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllStaff = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM staff WHERE society_id=$1
             ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [societyId, limit, offset]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("getAllStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffById = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  try {
    // ✅ Society scoped
    const result = await pool.query(
      "SELECT * FROM staff WHERE id=$1 AND society_id=$2",
      [id, societyId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Staff not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("getStaffById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, shift_start, shift_end, status } = req.body;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update staff" });
  }

  try {
    // ✅ Society scoped, fetch old record for partial update
    const old = await pool.query(
      "SELECT * FROM staff WHERE id=$1 AND society_id=$2",
      [id, societyId]
    );

    if (!old.rows.length) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const prev = old.rows[0];

    // ✅ Merge — undefined fields keep existing values, not become NULL
    const updated = await pool.query(
      `UPDATE staff
             SET name=$1, phone=$2, role=$3, shift_start=$4, shift_end=$5, status=$6
             WHERE id=$7 AND society_id=$8
             RETURNING *`,
      [
        name ?? prev.name,
        phone ?? prev.phone,
        role ?? prev.role,
        shift_start ?? prev.shift_start,
        shift_end ?? prev.shift_end,
        status ?? prev.status,
        id,
        societyId,
      ]
    );

    return res.json(updated.rows[0]);

  } catch (err) {
    console.error("updateStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteStaff = async (req, res) => {
  const { id } = req.params;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete staff" });
  }

  try {
    // ✅ Society scoped + existence check
    const result = await pool.query(
      "DELETE FROM staff WHERE id=$1 AND society_id=$2 RETURNING id, name",
      [id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Staff not found" });
    }

    return res.json({ message: "Staff deleted" });

  } catch (err) {
    console.error("deleteStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Check In / Out ──────────────────────────────────────────────────────────

exports.staffCheckIn = async (req, res) => {
  const { staff_id } = req.body;
  const societyId = req.societyId;

  if (!staff_id) {
    return res.status(400).json({ message: "staff_id is required" });
  }

  try {
    // ✅ Verify staff belongs to this society
    const staffCheck = await pool.query(
      "SELECT id FROM staff WHERE id=$1 AND society_id=$2",
      [staff_id, societyId]
    );
    if (!staffCheck.rows.length) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const result = await pool.query(
      `INSERT INTO staff_attendance (staff_id, entry_date, entry_time)
             VALUES ($1, CURRENT_DATE, NOW())
             RETURNING *`,
      [staff_id]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("staffCheckIn error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.staffCheckOut = async (req, res) => {
  const { attendance_id } = req.body;
  const societyId = req.societyId;

  if (!attendance_id) {
    return res.status(400).json({ message: "attendance_id is required" });
  }

  try {
    // ✅ Verify attendance record belongs to this society via JOIN
    const updated = await pool.query(
      `UPDATE staff_attendance sa
             SET exit_time = NOW()
             FROM staff s
             WHERE sa.id=$1 AND sa.staff_id=s.id AND s.society_id=$2
             RETURNING sa.*`,
      [attendance_id, societyId]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    return res.json(updated.rows[0]);

  } catch (err) {
    console.error("staffCheckOut error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffAttendance = async (req, res) => {
  const { staff_id } = req.params;
  const societyId = req.societyId;

  // ✅ Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const offset = (page - 1) * limit;

  try {
    // ✅ Society scoped via JOIN
    const result = await pool.query(
      `SELECT sa.* FROM staff_attendance sa
             JOIN staff s ON sa.staff_id = s.id
             WHERE sa.staff_id=$1 AND s.society_id=$2
             ORDER BY sa.entry_date DESC, sa.entry_time DESC
             LIMIT $3 OFFSET $4`,
      [staff_id, societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getStaffAttendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Staff Logs ──────────────────────────────────────────────────────────────

exports.addStaffLog = async (req, res) => {
  const { staff_id, log } = req.body;
  const societyId = req.societyId;

  // ✅ Admin only
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can add staff logs" });
  }

  if (!staff_id || !log) {
    return res.status(400).json({ message: "staff_id and log are required" });
  }

  try {
    // ✅ Verify staff belongs to this society
    const staffCheck = await pool.query(
      "SELECT id FROM staff WHERE id=$1 AND society_id=$2",
      [staff_id, societyId]
    );
    if (!staffCheck.rows.length) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const result = await pool.query(
      "INSERT INTO staff_logs (staff_id, log) VALUES ($1, $2) RETURNING *",
      [staff_id, log]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("addStaffLog error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffLogs = async (req, res) => {
  const { staff_id } = req.params;
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const offset = (page - 1) * limit;

  try {
    // ✅ Society scoped via JOIN
    const result = await pool.query(
      `SELECT sl.* FROM staff_logs sl
             JOIN staff s ON sl.staff_id = s.id
             WHERE sl.staff_id=$1 AND s.society_id=$2
             ORDER BY sl.created_at DESC
             LIMIT $3 OFFSET $4`,
      [staff_id, societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getStaffLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Assignments ─────────────────────────────────────────────────────────────

exports.assignStaffToResident = async (req, res) => {
  const { staff_id, resident_id, role_in_home, working_days, timings } = req.body;
  const societyId = req.societyId;

  if (!staff_id || !resident_id) {
    return res.status(400).json({ message: "staff_id and resident_id required" });
  }

  try {
    // ✅ Verify both staff and resident belong to this society
    const [staffCheck, residentCheck] = await Promise.all([
      pool.query("SELECT id FROM staff WHERE id=$1 AND society_id=$2", [staff_id, societyId]),
      pool.query("SELECT id FROM users WHERE id=$1 AND society_id=$2 AND role='resident'", [resident_id, societyId]),
    ]);

    if (!staffCheck.rows.length) {
      return res.status(404).json({ message: "Staff not found in this society" });
    }
    if (!residentCheck.rows.length) {
      return res.status(404).json({ message: "Resident not found in this society" });
    }

    const result = await pool.query(
      `INSERT INTO staff_assignments (staff_id, resident_id, role, working_days, timings)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      [staff_id, resident_id, role_in_home || null, working_days || null, timings || null]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("assignStaffToResident error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getResidentStaff = async (req, res) => {
  const societyId = req.societyId;

  // ✅ Residents see only their own staff — admins can query by param
  const targetId = req.user.role === "admin"
    ? req.params.resident_id
    : req.user.id;

  try {
    const result = await pool.query(
      `SELECT sa.*, s.name, s.phone, s.role
             FROM staff_assignments sa
             JOIN staff s ON sa.staff_id = s.id
             WHERE sa.resident_id=$1 AND s.society_id=$2`,
      [targetId, societyId]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getResidentStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.blockStaff = async (req, res) => {
  const { assignment_id } = req.params;
  const { reason } = req.body;
  const societyId = req.societyId;
  const residentId = req.user.id;

  try {
    // ✅ Verify assignment belongs to this resident and society
    const check = await pool.query(
      `SELECT sa.id FROM staff_assignments sa
             JOIN staff s ON sa.staff_id = s.id
             WHERE sa.id=$1 AND s.society_id=$2
               AND (sa.resident_id=$3 OR $4='admin')`,
      [assignment_id, societyId, residentId, req.user.role]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const result = await pool.query(
      `UPDATE staff_assignments
             SET is_blocked=TRUE, blocked_reason=$2
             WHERE id=$1 RETURNING *`,
      [assignment_id, reason || "No reason provided"]
    );

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("blockStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unblockStaff = async (req, res) => {
  const { assignment_id } = req.params;
  const societyId = req.societyId;
  const residentId = req.user.id;

  try {
    // ✅ Same ownership check as blockStaff
    const check = await pool.query(
      `SELECT sa.id FROM staff_assignments sa
             JOIN staff s ON sa.staff_id = s.id
             WHERE sa.id=$1 AND s.society_id=$2
               AND (sa.resident_id=$3 OR $4='admin')`,
      [assignment_id, societyId, residentId, req.user.role]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const result = await pool.query(
      `UPDATE staff_assignments
             SET is_blocked=FALSE, blocked_reason=NULL
             WHERE id=$1 RETURNING *`,
      [assignment_id]
    );

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("unblockStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Staff Entry / Exit / Leave ──────────────────────────────────────────────

exports.markStaffEntry = async (req, res) => {
  const { staff_id, resident_id } = req.body;
  const marked_by = req.user.id; // ✅ from JWT — never trust client
  const societyId = req.societyId;

  if (!staff_id || !resident_id) {
    return res.status(400).json({ message: "staff_id and resident_id required" });
  }

  try {
    // ✅ Society scoped assignment check
    const assignment = await pool.query(
      `SELECT sa.* FROM staff_assignments sa
             JOIN staff s ON sa.staff_id = s.id
             WHERE sa.staff_id=$1 AND sa.resident_id=$2 AND s.society_id=$3`,
      [staff_id, resident_id, societyId]
    );

    if (!assignment.rows.length) {
      return res.status(403).json({ message: "Staff not assigned to this resident" });
    }

    if (assignment.rows[0].is_blocked) {
      return res.status(403).json({
        message: "Staff is blocked",
        blocked_reason: assignment.rows[0].blocked_reason,
      });
    }

    const result = await pool.query(
      `INSERT INTO staff_attendance (staff_id, resident_id, entry_date, entry_time, marked_by)
             VALUES ($1, $2, CURRENT_DATE, NOW(), $3)
             RETURNING *`,
      [staff_id, resident_id, marked_by]
    );

    // ✅ Correct sendNotification signature
    await sendNotification(
      resident_id,
      "Staff Entry",
      "Your staff has entered the society.",
      "staff_entry",
      req
    );

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("markStaffEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markStaffExit = async (req, res) => {
  const { attendance_id } = req.body;
  const societyId = req.societyId;

  if (!attendance_id) {
    return res.status(400).json({ message: "attendance_id is required" });
  }

  try {
    // ✅ Society scoped via JOIN, existence check
    const result = await pool.query(
      `UPDATE staff_attendance sa
             SET exit_time = NOW()
             FROM staff s
             WHERE sa.id=$1 AND sa.staff_id=s.id AND s.society_id=$2
             RETURNING sa.*`,
      [attendance_id, societyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("markStaffExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markStaffLeave = async (req, res) => {
  const { staff_id, resident_id, leave_date, reason } = req.body;
  const marked_by = req.user.id; // ✅ from JWT
  const marked_by_type = req.user.role;
  const societyId = req.societyId;

  // ✅ Required field validation
  if (!staff_id || !resident_id || !leave_date) {
    return res.status(400).json({ message: "staff_id, resident_id and leave_date are required" });
  }

  try {
    // ✅ Verify staff belongs to this society
    const staffCheck = await pool.query(
      "SELECT id FROM staff WHERE id=$1 AND society_id=$2",
      [staff_id, societyId]
    );
    if (!staffCheck.rows.length) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const result = await pool.query(
      `INSERT INTO staff_leaves (staff_id, resident_id, leave_date, reason, marked_by_type, marked_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      [staff_id, resident_id, leave_date, reason || null, marked_by_type, marked_by]
    );

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("markStaffLeave error:", err);
    res.status(500).json({ message: "Server error" });
  }
};