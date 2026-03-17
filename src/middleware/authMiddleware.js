const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  // ✅ Only standard Bearer token — no fallback non-standard headers
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization denied. Token missing." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authorization denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ society_id included — societyMiddleware can now read from token, no DB query needed
    req.user = {
      id: decoded.id,
      role: decoded.role,
      phone: decoded.phone,
      society_id: decoded.society_id ?? null,
    };

    next();

  } catch (err) {
    // ✅ Distinguish expired vs invalid — client knows whether to refresh or re-login
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};