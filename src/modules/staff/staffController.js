const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");

exports.addStaff = async (req, res) => {
  const { name, phone, role, shift_start, shift_end } = req.body;
  const societyId = req.societyId;

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

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("addStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllStaff = async (req, res) => {
  const societyId = req.societyId;

  try {
    const result = await pool.query(
      `SELECT * FROM staff WHERE society_id = $1 ORDER BY created_at DESC`,
      [societyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getAllStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM staff WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Staff not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getStaffById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, shift_start, shift_end, status } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE staff
       SET name = $1,
           phone = $2,
           role = $3,
           shift_start = $4,
           shift_end = $5,
           status = $6
       WHERE id = $7
       RETURNING *`,
      [name, phone, role, shift_start, shift_end, status, id]
    );

    if (updated.rows.length === 0)
      return res.status(404).json({ message: "Staff not found" });

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("updateStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteStaff = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM staff WHERE id = $1`, [id]);
    res.json({ message: "Staff deleted" });
  } catch (err) {
    console.error("deleteStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.staffCheckIn = async (req, res) => {
  const { staff_id } = req.body;

  if (!staff_id) {
    return res.status(400).json({ message: "staff_id is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO staff_attendance (staff_id, entry_date, entry_time)
       VALUES ($1, CURRENT_DATE, NOW())
       RETURNING *`,
      [staff_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("staffCheckIn error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.staffCheckOut = async (req, res) => {
  const { attendance_id } = req.body;

  if (!attendance_id) {
    return res.status(400).json({ message: "attendance_id is required" });
  }

  try {
    const updated = await pool.query(
      `UPDATE staff_attendance
       SET exit_time = NOW()
       WHERE id = $1
       RETURNING *`,
      [attendance_id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("staffCheckOut error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffAttendance = async (req, res) => {
  const { staff_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM staff_attendance
       WHERE staff_id = $1
       ORDER BY entry_date DESC, entry_time DESC`,
      [staff_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getStaffAttendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addStaffLog = async (req, res) => {
  const { staff_id, log } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO staff_logs (staff_id, log)
       VALUES ($1, $2)
       RETURNING *`,
      [staff_id, log]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("addStaffLog error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaffLogs = async (req, res) => {
  const { staff_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM staff_logs
       WHERE staff_id = $1
       ORDER BY created_at DESC`,
      [staff_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getStaffLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignStaffToResident = async (req, res) => {
  const { staff_id, resident_id, role_in_home, working_days, timings } = req.body;

  if (!staff_id || !resident_id)
    return res.status(400).json({ message: "staff_id and resident_id required" });

  try {
    const result = await pool.query(
      `INSERT INTO staff_assignments 
       (staff_id, resident_id, role, working_days, timings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [staff_id, resident_id, role_in_home || null, working_days || null, timings || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("assignStaffToResident error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getResidentStaff = async (req, res) => {
  const { resident_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT sa.*, s.name, s.phone, s.role
       FROM staff_assignments sa
       JOIN staff s ON sa.staff_id = s.id
       WHERE sa.resident_id = $1`,
      [resident_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getResidentStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.blockStaff = async (req, res) => {
  const { assignment_id } = req.params;
  const { reason } = req.body;

  try {
    const result = await pool.query(
      `UPDATE staff_assignments
       SET is_blocked = TRUE, blocked_reason = $2
       WHERE id = $1
       RETURNING *`,
      [assignment_id, reason || "No reason provided"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("blockStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unblockStaff = async (req, res) => {
  const { assignment_id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE staff_assignments
       SET is_blocked = FALSE, blocked_reason = NULL
       WHERE id = $1
       RETURNING *`,
      [assignment_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("unblockStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markStaffEntry = async (req, res) => {
  const { staff_id, resident_id, marked_by } = req.body;

  if (!staff_id || !resident_id || !marked_by) {
    return res
      .status(400)
      .json({ message: "staff_id, resident_id & marked_by required" });
  }

  try {
    const assignment = await pool.query(
      `SELECT * FROM staff_assignments 
       WHERE staff_id = $1 AND resident_id = $2`,
      [staff_id, resident_id]
    );

    if (assignment.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Staff not assigned to this resident" });
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

    await sendNotification(resident_id, {
      title: "Staff Entry",
      body: `Your staff has entered the society.`,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("markStaffEntry error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markStaffExit = async (req, res) => {
  const { attendance_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE staff_attendance
       SET exit_time = NOW()
       WHERE id = $1
       RETURNING *`,
      [attendance_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("markStaffExit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markStaffLeave = async (req, res) => {
  const { staff_id, resident_id, leave_date, reason, marked_by_type, marked_by } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO staff_leaves (staff_id, resident_id, leave_date, reason, marked_by_type, marked_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [staff_id, resident_id, leave_date, reason, marked_by_type, marked_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("markStaffLeave error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
