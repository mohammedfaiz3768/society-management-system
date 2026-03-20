const pool = require("../config/db");
const { sendNotification } = require("../utils/sendNotification");
const { logActivity } = require("../utils/activityLogger");

const VALID_STATUSES = ["pending", "in_progress", "completed", "cancelled"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

exports.createRequest = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;
  const { category, priority, description } = req.body;

  if (!category) {
    return res.status(400).json({ message: "category is required" });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({ message: "Description must be under 1000 characters" });
  }

  try {
    const user = await pool.query(
      "SELECT flat_number FROM users WHERE id=$1",
      [userId]
    );
    const flat_number = user.rows[0]?.flat_number || null;

    const result = await pool.query(
      `INSERT INTO service_requests (user_id, flat_number, category, priority, description, society_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      [userId, flat_number, category, priority || "medium", description || null, societyId]
    );

    const request = result.rows[0];

    const admins = await pool.query(
      "SELECT id FROM users WHERE role='admin' AND society_id=$1",
      [societyId]
    );

    const notifyPromises = admins.rows.map(adm =>
      sendNotification(
        adm.id,
        "New Service Request",
        `A new ${category} request was submitted.`,
        "service_request_new",
        req
      )
    );
    Promise.allSettled(notifyPromises).catch(console.error);

    await logActivity({
      userId,
      type: "service_request_created",
      entityType: "service_request",
      entityId: request.id,
      title: "New service request created",
      description: `${category} request created`,
    });

    return res.status(201).json(request);

  } catch (err) {
    console.error("createRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyRequests = async (req, res) => {
  const userId = req.user.id;
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM service_requests
             WHERE user_id=$1 AND society_id=$2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
      [userId, societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getMyRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllRequests = async (req, res) => {
  const societyId = req.societyId;

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { status } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status filter` });
  }

  try {
    const result = await pool.query(
      `SELECT sr.*, u.name AS user_name, u.phone AS user_phone, s.name AS staff_name
             FROM service_requests sr
             LEFT JOIN users u ON sr.user_id = u.id
             LEFT JOIN staff s ON sr.assigned_to = s.id
             WHERE sr.society_id=$1
               ${status ? "AND sr.status=$4" : ""}
             ORDER BY sr.created_at DESC
             LIMIT $2 OFFSET $3`,
      status ? [societyId, limit, offset, status] : [societyId, limit, offset]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("getAllRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignStaff = async (req, res) => {
  const { request_id, staff_id } = req.body;
  const societyId = req.societyId;

  if (!request_id || !staff_id) {
    return res.status(400).json({ message: "request_id and staff_id required" });
  }

  try {
    const staffCheck = await pool.query(
      "SELECT id FROM staff WHERE id=$1 AND society_id=$2",
      [staff_id, societyId]
    );
    if (!staffCheck.rows.length) {
      return res.status(404).json({ message: "Staff not found in this society" });
    }

    const updated = await pool.query(
      `UPDATE service_requests
             SET assigned_to=$1, status='in_progress', updated_at=NOW()
             WHERE id=$2 AND society_id=$3
             RETURNING *`,
      [staff_id, request_id, societyId]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const ticket = updated.rows[0];

    sendNotification(
      ticket.user_id,
      "Service Request Update",
      "Your request has been assigned to a staff member.",
      "service_request_update",
      req
    ).catch(console.error);

    await logActivity({
      userId: req.user.id,
      type: "service_assigned",
      entityType: "service_request",
      entityId: request_id,
      title: "Service request assigned",
      description: `Assigned staff ID: ${staff_id}`,
    });

    return res.json(ticket);

  } catch (err) {
    console.error("assignStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const societyId = req.societyId;

  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const completed_at = status === "completed" ? new Date() : null;

    const updated = await pool.query(
      `UPDATE service_requests
             SET status=$1, updated_at=NOW(), completed_at=$2
             WHERE id=$3 AND society_id=$4
             RETURNING *`,
      [status, completed_at, id, societyId]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const ticket = updated.rows[0];

    sendNotification(
      ticket.user_id,
      "Service Request Update",
      `Your request is now ${status.toUpperCase()}.`,
      "service_request_update",
      req
    ).catch(console.error);

    await logActivity({
      userId: req.user.id,
      type: "service_status_update",
      entityType: "service_request",
      entityId: id,
      title: "Service request updated",
      description: `Status changed to ${status}`,
    });

    return res.json(ticket);

  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
