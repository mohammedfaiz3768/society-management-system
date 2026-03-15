const pool = require("../../config/db");
const { logActivity } = require("../utils/activityLogger"); 

exports.createCheckpoint = async (req, res) => {
  const { name, location_description, sequence_order } = req.body;

  if (!name)
    return res.status(400).json({ message: "Checkpoint name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO patrol_checkpoints (name, location_description, sequence_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, location_description, sequence_order || null]
    );

    const checkpoint = result.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "checkpoint_created",
      entityType: "checkpoint",
      entityId: checkpoint.id,
      title: "Patrol checkpoint created",
      description: `${name}`
    });

    res.status(201).json(checkpoint);
  } catch (err) {
    console.error("createCheckpoint", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllCheckpoints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM patrol_checkpoints ORDER BY sequence_order ASC NULLS LAST`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllCheckpoints", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignGuard = async (req, res) => {
  const { guard_id, scheduled_date } = req.body;

  if (!guard_id || !scheduled_date)
    return res.status(400).json({ message: "guard_id and scheduled_date required" });

  try {
    const result = await pool.query(
      `INSERT INTO patrol_schedule (guard_id, scheduled_date)
       VALUES ($1, $2)
       RETURNING *`,
      [guard_id, scheduled_date]
    );

    const assignment = result.rows[0];

    await logActivity({
      userId: req.user.id,
      type: "patrol_assigned",
      entityType: "patrol_schedule",
      entityId: assignment.id,
      title: "Guard assigned for patrol",
      description: `Guard ID ${guard_id} assigned for ${scheduled_date}`
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error("assignGuard", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.checkIn = async (req, res) => {
  const guardId = req.user.id;
  const { checkpoint_id, notes } = req.body;

  if (!checkpoint_id)
    return res.status(400).json({ message: "checkpoint_id required" });

  try {
    const result = await pool.query(
      `INSERT INTO patrol_logs (checkpoint_id, guard_id, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [checkpoint_id, guardId, notes]
    );

    const logEntry = result.rows[0];

    await logActivity({
      userId: guardId,
      type: "patrol_checkin",
      entityType: "patrol_log",
      entityId: logEntry.id,
      title: "Guard checkpoint check-in",
      description: `Checkpoint ID ${checkpoint_id}`
    });

    res.status(201).json(logEntry);
  } catch (err) {
    console.error("checkIn", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPatrolLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, pc.name AS checkpoint_name, u.name AS guard_name
       FROM patrol_logs pl
       LEFT JOIN patrol_checkpoints pc ON pl.checkpoint_id = pc.id
       LEFT JOIN users u ON pl.guard_id = u.id
       ORDER BY pl.checkin_time DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getPatrolLogs", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDailySummary = async (req, res) => {
  const { date } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
          ps.guard_id,
          u.name AS guard_name,
          pc.name AS checkpoint_name,
          pl.checkin_time,
          pl.status
       FROM patrol_schedule ps
       LEFT JOIN users u ON ps.guard_id = u.id
       CROSS JOIN patrol_checkpoints pc
       LEFT JOIN patrol_logs pl 
         ON pl.guard_id = ps.guard_id
        AND pl.checkin_time::date = ps.scheduled_date
        AND pl.checkpoint_id = pc.id
       WHERE ps.scheduled_date = $1
       ORDER BY ps.guard_id, pc.sequence_order`,
      [date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getDailySummary", err);
    res.status(500).json({ message: "Server error" });
  }
};
