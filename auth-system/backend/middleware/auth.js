const jwt = require('jsonwebtoken');

/**
 * Attach decoded JWT payload to req.user.
 * Expects:  Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message: msg });
  }
};

/**
 * Restrict access to a specific role.
 * Must be used AFTER verifyToken.
 * Usage:  router.get('/path', verifyToken, requireRole('teacher'), handler)
 */
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: 'Access denied: insufficient role' });
  }
  next();
};

module.exports = { verifyToken, requireRole };
