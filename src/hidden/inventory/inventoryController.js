const pool = require("../../config/db");
const { logActivity } = require("../utils/activityLogger"); // ➕ added

// ADMIN: Add new asset
exports.addAsset = async (req, res) => {
  const {
    name,
    category,
    location,
    purchase_date,
    warranty_expiry,
    amc_expiry,
    assigned_staff,
    description
  } = req.body;

  if (!name)
    return res.status(400).json({ message: "Asset name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO assets 
       (name, category, location, purchase_date, warranty_expiry, amc_expiry, assigned_staff, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        name,
        category,
        location,
        purchase_date,
        warranty_expiry,
        amc_expiry,
        assigned_staff || null,
        description
      ]
    );

    const asset = result.rows[0];

    // 🟦 Log Activity
    await logActivity({
      userId: req.user.id,
      type: "asset_added",
      entityType: "asset",
      entityId: asset.id,
      title: "Asset added",
      description: `${name} (${category})`
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error("addAsset error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Update asset
exports.updateAsset = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    location,
    purchase_date,
    warranty_expiry,
    amc_expiry,
    assigned_staff,
    status,
    description
  } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE assets SET
        name = $1,
        category = $2,
        location = $3,
        purchase_date = $4,
        warranty_expiry = $5,
        amc_expiry = $6,
        assigned_staff = $7,
        status = $8,
        description = $9,
        updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        name,
        category,
        location,
        purchase_date,
        warranty_expiry,
        amc_expiry,
        assigned_staff,
        status,
        description,
        id
      ]
    );

    if (updated.rows.length === 0)
      return res.status(404).json({ message: "Asset not found" });

    const asset = updated.rows[0];

    // 🟧 Log Activity
    await logActivity({
      userId: req.user.id,
      type: "asset_updated",
      entityType: "asset",
      entityId: id,
      title: "Asset updated",
      description: `${name} (${category}) updated`
    });

    res.json(asset);
  } catch (err) {
    console.error("updateAsset error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Delete asset
exports.deleteAsset = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM assets WHERE id = $1`, [id]);

    // 🟥 Log Activity
    await logActivity({
      userId: req.user.id,
      type: "asset_deleted",
      entityType: "asset",
      entityId: id,
      title: "Asset deleted",
      description: `Asset ID ${id} removed`
    });

    res.json({ message: "Asset deleted" });
  } catch (err) {
    console.error("deleteAsset error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// USERS (staff + admin): Get all assets
exports.getAllAssets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.name AS staff_name
       FROM assets a
       LEFT JOIN staff s ON a.assigned_staff = s.id
       ORDER BY a.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getAllAssets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// STAFF: Get only assigned assets
exports.getMyAssignedAssets = async (req, res) => {
  const staffId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM assets
       WHERE assigned_staff = $1`,
      [staffId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMyAssignedAssets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// STAFF + ADMIN: Log maintenance action
exports.addMaintenanceLog = async (req, res) => {
  const staffId = req.user.id;
  const { asset_id, action, notes } = req.body;

  if (!asset_id || !action)
    return res.status(400).json({ message: "asset_id and action required" });

  try {
    const result = await pool.query(
      `INSERT INTO asset_maintenance_logs (asset_id, staff_id, action, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [asset_id, staffId, action, notes]
    );

    const logEntry = result.rows[0];

    // Auto-set asset to working if repaired
    if (action.toLowerCase().includes("repair")) {
      await pool.query(
        `UPDATE assets SET status = 'working', updated_at = NOW() WHERE id = $1`,
        [asset_id]
      );
    }

    // 🟦 Log Activity
    await logActivity({
      userId: staffId,
      type: "asset_maintenance",
      entityType: "asset",
      entityId: asset_id,
      title: "Maintenance logged",
      description: `${action} on asset ID ${asset_id}`
    });

    res.status(201).json(logEntry);
  } catch (err) {
    console.error("addMaintenanceLog error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: View logs of an asset
exports.getMaintenanceLogs = async (req, res) => {
  const { asset_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT l.*, s.name AS staff_name
       FROM asset_maintenance_logs l
       LEFT JOIN staff s ON l.staff_id = s.id
       WHERE l.asset_id = $1
       ORDER BY l.created_at DESC`,
      [asset_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getMaintenanceLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
