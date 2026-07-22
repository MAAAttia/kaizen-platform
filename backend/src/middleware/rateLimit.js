const rateLimit = require('express-rate-limit');

// Slows down brute-force login/signup attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

// Prevents a single account (or anonymous-but-authenticated session) from
// flooding the board with ideas/comments/votes.
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You are doing that too often. Please slow down.' },
});

module.exports = { authLimiter, writeLimiter };
