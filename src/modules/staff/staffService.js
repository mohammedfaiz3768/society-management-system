const pool = require("../../config/db");
const { sendNotification } = require("../../utils/sendNotification");

const staffService = {

    async addStaff({ name, phone, role, shift_start, shift_end }) {
        const query = `
      INSERT INTO staff (name, phone, role, shift_start, shift_end)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;

        const values = [name, phone || "", role, shift_start || null, shift_end || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getAllStaff() {
        const result = await pool.query(`SELECT * FROM staff ORDER BY created_at DESC`);
        return result.rows;
    },

    async getStaffById(id) {
        const result = await pool.query(`SELECT * FROM staff WHERE id = $1`, [id]);
        return result.rows[0] || null;
    },

    async updateStaff(id, { name, phone, role, shift_start, shift_end, status }) {
        const query = `
      UPDATE staff
      SET name = $1,
          phone = $2,
          role = $3,
          shift_start = $4,
          shift_end = $5,
          status = $6
      WHERE id = $7
      RETURNING *`;

        const values = [name, phone, role, shift_start, shift_end, status, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async deleteStaff(id) {
        await pool.query(`DELETE FROM staff WHERE id = $1`, [id]);
        return true;
    },

    async staffCheckIn(staff_id) {
        const result = await pool.query(
            `INSERT INTO staff_attendance (staff_id, entry_date, entry_time)
       VALUES ($1, CURRENT_DATE, NOW())
       RETURNING *`,
            [staff_id]
        );

        return result.rows[0];
    },

    async staffCheckOut(attendance_id) {
        const result = await pool.query(
            `UPDATE staff_attendance
       SET exit_time = NOW()
       WHERE id = $1
       RETURNING *`,
            [attendance_id]
        );

        return result.rows[0];
    },

    async getStaffAttendance(staff_id) {
        const result = await pool.query(
            `SELECT * FROM staff_attendance
       WHERE staff_id = $1
       ORDER BY entry_date DESC, entry_time DESC`,
            [staff_id]
        );

        return result.rows;
    },

    async addStaffLog({ staff_id, log }) {
        const result = await pool.query(
            `INSERT INTO staff_logs (staff_id, log)
       VALUES ($1, $2)
       RETURNING *`,
            [staff_id, log]
        );

        return result.rows[0];
    },

    async getStaffLogs(staff_id) {
        const result = await pool.query(
            `SELECT * FROM staff_logs
       WHERE staff_id = $1
       ORDER BY created_at DESC`,
            [staff_id]
        );

        return result.rows;
    },

    async assignStaffToResident({ staff_id, resident_id, role_in_home, working_days, timings }) {
        const result = await pool.query(
            `INSERT INTO staff_assignments 
        (staff_id, resident_id, role, working_days, timings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [staff_id, resident_id, role_in_home || null, working_days || null, timings || null]
        );

        return result.rows[0];
    },

    async getResidentStaff(resident_id) {
        const result = await pool.query(
            `SELECT sa.*, s.name AS staff_name, s.phone AS staff_phone, s.role AS staff_role
       FROM staff_assignments sa
       JOIN staff s ON sa.staff_id = s.id
       WHERE sa.resident_id = $1`,
            [resident_id]
        );

        return result.rows;
    },

    async blockStaff(assignment_id, reason) {
        const result = await pool.query(
            `UPDATE staff_assignments
       SET is_blocked = TRUE, blocked_reason = $2
       WHERE id = $1
       RETURNING *`,
            [assignment_id, reason || "Blocked"]
        );

        return result.rows[0];
    },

    async unblockStaff(assignment_id) {
        const result = await pool.query(
            `UPDATE staff_assignments
       SET is_blocked = FALSE, blocked_reason = NULL
       WHERE id = $1
       RETURNING *`,
            [assignment_id]
        );

        return result.rows[0];
    },

    async markStaffEntry({ staff_id, resident_id, marked_by }) {
        // Validate assignment
        const assignment = await pool.query(
            `SELECT * FROM staff_assignments
       WHERE staff_id = $1 AND resident_id = $2`,
            [staff_id, resident_id]
        );

        if (assignment.rows.length === 0) {
            return { error: "NOT_ASSIGNED" };
        }

        if (assignment.rows[0].is_blocked) {
            return {
                error: "BLOCKED",
                reason: assignment.rows[0].blocked_reason,
            };
        }

        // Insert attendance
        const result = await pool.query(
            `INSERT INTO staff_attendance (staff_id, resident_id, entry_date, entry_time, marked_by)
       VALUES ($1, $2, CURRENT_DATE, NOW(), $3)
       RETURNING *`,
            [staff_id, resident_id, marked_by]
        );

        // Send notification
        await sendNotification(resident_id, {
            title: "Staff Entry",
            body: `Your staff has entered the society.`,
        });

        return result.rows[0];
    },

    async markStaffExit(attendance_id) {
        const result = await pool.query(
            `UPDATE staff_attendance
       SET exit_time = NOW()
       WHERE id = $1
       RETURNING *`,
            [attendance_id]
        );

        return result.rows[0];
    },

    async markStaffLeave({ staff_id, resident_id, leave_date, reason, marked_by_type, marked_by }) {
        const result = await pool.query(
            `INSERT INTO staff_leaves (staff_id, resident_id, leave_date, reason, marked_by_type, marked_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [staff_id, resident_id, leave_date, reason, marked_by_type, marked_by]
        );

        return result.rows[0];
    }
};

module.exports = staffService;
