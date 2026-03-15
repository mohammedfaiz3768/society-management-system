const pool = require("../config/db");
const { sendNotification } = require("../utils/sendNotification");
const { logActivity } = require("../utils/activityLogger");

exports.createRequest = async (req, res) => {
  const userId = req.user.id;
  const { category, priority, description } = req.body;

  if (!category) {
    return res.status(400).json({ message: "category is required" });
  }

  try {
    const user = await pool.query(
      `SELECT flat_number FROM users WHERE id = $1`,
      [userId]
    );

    const flat_number = user.rows[0]?.flat_number || null;

    const result = await pool.query(
      `INSERT INTO service_requests (user_id, flat_number, category, priority, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, flat_number, category, priority || "medium", description]
    );

    const request = result.rows[0];

    const admins = await pool.query(
      `SELECT id FROM users WHERE role = 'admin'`
    );

    for (let adm of admins.rows) {
      sendNotification(
        adm.id,
        "New Service Request",
        `A new ${category} request was created.`,
        "service_request_new",
        req
      );
    }

    await logActivity({
      userId,
      type: "service_request_created",
      entityType: "service_request",
      entityId: request.id,
      title: "New service request created",
      description: `${category} request created`
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("createRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, u.name AS user_name, u.phone AS user_phone, s.name AS staff_name
       FROM service_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       LEFT JOIN staff s ON sr.assigned_to = s.id
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignStaff = async (req, res) => {
  const { request_id, staff_id } = req.body;

  if (!request_id || !staff_id) {
    return res.status(400).json({ message: "request_id and staff_id required" });
  }

  try {
    const updated = await pool.query(
      `UPDATE service_requests
       SET assigned_to = $1, status = 'in_progress', updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [staff_id, request_id]
    );

    const ticket = updated.rows[0];

    sendNotification(
      ticket.user_id,
      "Service Request Update",
      "Your request is assigned to a staff member.",
      "service_request_update",
      req
    );

    await logActivity({
      userId: req.user.id,
      type: "service_assigned",
      entityType: "service_request",
      entityId: request_id,
      title: "Service request assigned",
      description: `Assigned staff ID: ${staff_id}`
    });

    res.json(ticket);
  } catch (err) {
    console.error("assignStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: "status is required" });

  try {
    let completed_at = null;
    if (status === "completed") completed_at = new Date();

    const updated = await pool.query(
      `UPDATE service_requests
       SET status = $1,
           updated_at = NOW(),
           completed_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, completed_at, id]
    );

    const ticket = updated.rows[0];

    sendNotification(
      ticket.user_id,
      "Service Request Update",
      `Your request is now ${status.toUpperCase()}.`,
      "service_request_update",
      req
    );

    await logActivity({
      userId: req.user.id,
      type: "service_status_update",
      entityType: "service_request",
      entityId: id,
      title: "Service request updated",
      description: `Status changed to ${status}`
    });

    res.json(ticket);
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
