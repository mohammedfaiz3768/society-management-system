const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

module.exports = function (req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  console.log('Auth middleware - Authorization header:', authHeader);

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    console.log('Auth middleware - Token extracted from Bearer:', token ? 'YES' : 'NO');
  }

  if (!token && req.headers.token) {
    token = req.headers.token;
    console.log('Auth middleware - Token from headers.token');
  }

  console.log('Auth middleware - Final token status:', token ? 'FOUND' : 'NOT FOUND');

  if (!token) {
    console.log('Auth middleware - No token found, returning 401');
    return res.status(401).json({
      message: "Authorization denied. Token missing.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      phone: decoded.phone,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
