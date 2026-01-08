module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: No user context found",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: Requires role(s): ${allowedRoles.join(", ")}`,
        your_role: req.user.role,
      });
    }

    next();
  };
};
