// Admin endpoint to get all gate passes with pagination and filters
exports.getAllGatePassesAdmin = async (req, res) => {
    const societyId = req.societyId;
    const { page = 1, limit = 50, search = '', used = null, startDate = null, endDate = null } = req.query;

    // Only admins should access this
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const offset = (page - 1) * limit;
        let queryConditions = ['gp.society_id = $1'];
        let queryParams = [societyId];
        let paramCounter = 2;

        // Search by visitor name or phone
        if (search) {
            queryConditions.push(`(gp.visitor_name ILIKE $${paramCounter} OR gp.visitor_phone ILIKE $${paramCounter})`);
            queryParams.push(`%${search}%`);
            paramCounter++;
        }

        // Filter by used status
        if (used !== null && used !== '') {
            queryConditions.push(`gp.used = $${paramCounter}`);
            queryParams.push(used === 'true');
            paramCounter++;
        }

        // Filter by date range
        if (startDate) {
            queryConditions.push(`gp.created_at >= $${paramCounter}`);
            queryParams.push(startDate);
            paramCounter++;
        }

        if (endDate) {
            queryConditions.push(`gp.created_at <= $${paramCounter}`);
            queryParams.push(endDate);
            paramCounter++;
        }

        const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM gate_passes gp ${whereClause}`,
            queryParams
        );

        const total = parseInt(countResult.rows[0].total);

        // Get gate passes with user info
        queryParams.push(limit, offset);
        const result = await pool.query(
            `SELECT 
        gp.*,
        u.username,
        u.email,
        f.flat_number,
        f.block
       FROM gate_passes gp
       LEFT JOIN users u ON gp.user_id = u.id
       LEFT JOIN flats f ON u.flat_id = f.id
       ${whereClause}
       ORDER BY gp.created_at DESC
       LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
            queryParams
        );

        res.json({
            gatePasses: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error("getAllGatePassesAdmin error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
