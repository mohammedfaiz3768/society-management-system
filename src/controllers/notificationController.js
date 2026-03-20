const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const societyId = req.societyId;

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT id, title, message, type, is_read, read_at, created_at
             FROM notifications
             WHERE user_id=$1 AND society_id=$2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, societyId, limit, offset]
        );

        return res.json(result.rows);

    } catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const societyId = req.societyId;

        const result = await pool.query(
            `UPDATE notifications
             SET is_read=TRUE, read_at=NOW()
             WHERE id=$1 AND user_id=$2 AND society_id=$3
             RETURNING id, title, message, type, is_read, read_at, created_at`,
            [id, userId, societyId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.json(result.rows[0]);

    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const societyId = req.societyId;

        await pool.query(
            `UPDATE notifications
             SET is_read=TRUE, read_at=NOW()
             WHERE user_id=$1 AND society_id=$2 AND is_read=FALSE`,
            [userId, societyId]
        );

        return res.json({ message: 'All notifications marked as read' });

    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const societyId = req.societyId;

        const result = await pool.query(
            `SELECT COUNT(*) AS count FROM notifications
             WHERE user_id=$1 AND society_id=$2 AND is_read=FALSE`,
            [userId, societyId]
        );

        return res.json({ count: parseInt(result.rows[0].count) });

    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
