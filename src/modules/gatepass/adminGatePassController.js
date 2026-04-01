const pool = require("../../config/db");

exports.getAllGatePassesAdmin = async (req, res) => {
    const societyId = req.societyId;
    const { page = 1, limit = 50, search = '', used = null, startDate = null, endDate = null } = req.query;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const offset = (page - 1) * limit;
        let queryConditions = ['gp.society_id = $1'];
        let queryParams = [societyId];
        let paramCounter = 2;

        if (search) {
            queryConditions.push(`(gp.visitor_name ILIKE $${paramCounter} OR gp.visitor_phone ILIKE $${paramCounter})`);
            queryParams.push(`%${search}%`);
            paramCounter++;
        }

        if (used !== null && used !== '') {
            queryConditions.push(`gp.used = $${paramCounter}`);
            queryParams.push(used === 'true');
            paramCounter++;
        }

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

        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM gate_passes gp ${whereClause}`,
            queryParams
        );

        const total = parseInt(countResult.rows[0].total);

        queryParams.push(limit, offset);
        const result = await pool.query(
            `SELECT 
        gp.*,
        u.name AS username,
        u.email,
        f.flat_number,
        f.block
       FROM gate_passes gp
       LEFT JOIN users u ON gp.user_id = u.id
       LEFT JOIN flats f ON u.flat_number = f.flat_number AND f.society_id = gp.society_id
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
