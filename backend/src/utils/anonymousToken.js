const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generates a one-time secret for an anonymous idea or comment, and its
 * bcrypt hash. The raw secret is returned to the submitter exactly once
 * (in the API response right after creation) and never stored anywhere.
 * Only the hash is persisted, so possession of the raw secret is the sole
 * way to later edit/withdraw the anonymous content — nobody can reverse
 * the hash back to a person.
 */
async function createAnonymousToken() {
  const raw = crypto.randomBytes(24).toString('hex');
  const hash = await bcrypt.hash(raw, 10);
  return { raw, hash };
}

async function verifyAnonymousToken(raw, hash) {
  if (!raw || !hash) return false;
  return bcrypt.compare(raw, hash);
}

module.exports = { createAnonymousToken, verifyAnonymousToken };
