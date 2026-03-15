const SOCIETY_EXEMPT_ROUTES = [
    { path: '/societies', method: 'POST' },
];

const societyMiddleware = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Read society_id from JWT token (no DB query needed)
    // Make sure society_id is included when creating the token in auth controller
    req.societyId = req.user.society_id || null;

    if (!req.societyId) {
        const isExempt = SOCIETY_EXEMPT_ROUTES.some(
            r => req.path === r.path && req.method === r.method
        );

        if (isExempt) return next();

        console.warn(`[societyMiddleware] User ${req.user.id} has no society — blocked at ${req.method} ${req.path}`);
        return res.status(403).json({
            message: "You are not assigned to any society yet."
        });
    }

    next();
};

module.exports = societyMiddleware;