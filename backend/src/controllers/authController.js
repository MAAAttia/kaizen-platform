const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken, COOKIE_NAME, cookieOptions } = require('../utils/jwt');
const { isValidEmail, isValidPassword, isNonEmptyString } = require('../utils/validate');

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    departmentId: user.departmentId,
  };
}

async function signup(req, res) {
  const { name, email, password, departmentId } = req.body;

  if (!isNonEmptyString(name, 200)) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return res.status(400).json({ error: 'Please choose a valid department.' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      departmentId: departmentId || null,
      status: 'PENDING',
      role: 'MEMBER',
    },
  });

  res.status(201).json({
    message: 'Account created. An admin needs to approve it before you can sign in.',
    user: publicUser(user),
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  if (user.status === 'PENDING') {
    return res.status(403).json({ error: 'Your account is still awaiting admin approval.', status: 'PENDING' });
  }
  if (user.status === 'REJECTED') {
    return res.status(403).json({ error: 'Your account request was not approved.', status: 'REJECTED' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Your account has been suspended. Contact an admin.', status: 'SUSPENDED' });
  }

  const token = signToken({ sub: user.id });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ user: publicUser(user) });
}

async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logged out.' });
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = { signup, login, logout, me, publicUser };
