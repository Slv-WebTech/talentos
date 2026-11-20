const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');

async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'missing or malformed Authorization header' } });
  }

  let claims;
  try {
    claims = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: { message: 'invalid or expired token' } });
  }

  // Re-check the account on every request so deleted or role-changed users lose access
  // immediately instead of keeping a stale token's privileges until it expires.
  try {
    const user = await findUserById(claims.id);
    if (!user) {
      return res.status(401).json({ error: { message: 'account no longer exists' } });
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'insufficient permissions' } });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
