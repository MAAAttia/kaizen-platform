const prisma = require('../config/prisma');
const { verifyToken, COOKIE_NAME } = require('../utils/jwt');

/**
 * Reads the JWT from the httpOnly cookie, verifies it, and loads the
 * current user from the database (not just the token payload) so that a
 * status change (e.g. SUSPENDED) takes effect immediately on the next
 * request, without waiting for the token to expire.
 */
async function authenticate(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'Not logged in.' });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return res.status(401).json({ error: 'Session is no longer valid.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

/**
 * Like authenticate, but does not fail if there is no session — it just
 * leaves req.user undefined. Useful for endpoints that behave slightly
 * differently for logged-in vs anonymous callers without requiring login.
 */
async function authenticateOptional(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return next();
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.user = user;
    next();
  } catch (err) {
    next();
  }
}

function requireApproved(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not logged in.' });
  if (req.user.status === 'PENDING') {
    return res.status(403).json({ error: 'Your account is still awaiting admin approval.' });
  }
  if (req.user.status === 'REJECTED') {
    return res.status(403).json({ error: 'Your account request was not approved.' });
  }
  if (req.user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Your account has been suspended.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, authenticateOptional, requireApproved, requireAdmin };
