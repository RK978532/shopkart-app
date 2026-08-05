const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Yeh middleware har admin-only route ko protect karta hai.
// Frontend "Authorization: Bearer <token>" header bhejta hai login ke baad.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Login zaroori hai' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expire ho gaya, dobara login karein' });
  }
}

module.exports = { requireAdmin };
