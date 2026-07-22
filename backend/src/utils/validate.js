const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

function isValidPassword(password) {
  // At least 8 characters. Kept simple on purpose — tune for your org's policy.
  return typeof password === 'string' && password.length >= 8;
}

function isNonEmptyString(value, maxLength = 10000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

module.exports = { isValidEmail, isValidPassword, isNonEmptyString };
