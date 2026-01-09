const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, just proceed without req.user
    next();
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    // Convert both user role and allowed roles to uppercase for comparison
    const userRole = req.user?.role?.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ msg: "Forbidden" });
    }
    next();
  };
};

module.exports = { auth, optionalAuth, checkRole }; 
