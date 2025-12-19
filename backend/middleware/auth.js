const jwt = require('jsonwebtoken');

// Basic auth middleware – attaches decoded token to req.user
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded contains: { userId, email, role, name, iat, exp }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verify error:', error.message);
    res.status(401).json({ success: false, msg: 'Invalid token' });
  }
};

// Role check middleware – use for HR / TRAINER / Intern
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, msg: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};

module.exports = { auth, checkRole };
