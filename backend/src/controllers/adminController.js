const prisma = require('../config/prisma');
const { logAction } = require('../utils/auditLog');
const { publicUser } = require('./authController');

async function listUsers(req, res) {
  const { status } = req.query;
  const where = status ? { status } : {};
  const users = await prisma.user.findMany({
    where,
    include: { department: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    users: users.map((u) => ({ ...publicUser(u), departmentName: u.department?.name || null, createdAt: u.createdAt })),
  });
}

async function approveUser(req, res) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), rejectionReason: null },
  });
  await logAction(req.user.id, 'APPROVE_USER', 'User', id, { email: user.email });
  res.json({ user: publicUser(updated) });
}

async function rejectUser(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason || null },
  });
  await logAction(req.user.id, 'REJECT_USER', 'User', id, { email: user.email, reason });
  res.json({ user: publicUser(updated) });
}

async function suspendUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot suspend your own account.' });
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updated = await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
  await logAction(req.user.id, 'SUSPEND_USER', 'User', id, { email: user.email });
  res.json({ user: publicUser(updated) });
}

async function reinstateUser(req, res) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updated = await prisma.user.update({ where: { id }, data: { status: 'APPROVED' } });
  await logAction(req.user.id, 'REINSTATE_USER', 'User', id, { email: user.email });
  res.json({ user: publicUser(updated) });
}

async function analytics(req, res) {
  const [totalIdeas, byStatusRaw, byDepartmentRaw, byCategoryRaw, implementedIdeas] = await Promise.all([
    prisma.idea.count(),
    prisma.idea.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.idea.groupBy({ by: ['departmentId'], _count: { _all: true } }),
    prisma.idea.groupBy({ by: ['categoryId'], _count: { _all: true } }),
    prisma.idea.findMany({
      where: { status: 'IMPLEMENTED', closedAt: { not: null } },
      select: { createdAt: true, closedAt: true },
    }),
  ]);

  const [departments, categories] = await Promise.all([
    prisma.department.findMany(),
    prisma.category.findMany(),
  ]);
  const deptNameById = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const catNameById = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const byStatus = byStatusRaw.map((r) => ({ status: r.status, count: r._count._all }));
  const byDepartment = byDepartmentRaw.map((r) => ({
    department: r.departmentId ? deptNameById[r.departmentId] || 'Unknown' : 'Unassigned',
    count: r._count._all,
  }));
  const byCategory = byCategoryRaw.map((r) => ({
    category: r.categoryId ? catNameById[r.categoryId] || 'Unknown' : 'Uncategorized',
    count: r._count._all,
  }));

  let avgResolutionDays = null;
  if (implementedIdeas.length > 0) {
    const totalDays = implementedIdeas.reduce((sum, idea) => {
      const days = (new Date(idea.closedAt) - new Date(idea.createdAt)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgResolutionDays = Math.round((totalDays / implementedIdeas.length) * 10) / 10;
  }

  // Top contributors only ever counts NON-anonymous ideas, so the
  // anonymity guarantee is never weakened to build a leaderboard.
  const topContributorsRaw = await prisma.idea.groupBy({
    by: ['authorId'],
    where: { isAnonymous: false, authorId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { authorId: 'desc' } },
    take: 5,
  });
  const authorIds = topContributorsRaw.map((r) => r.authorId);
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } } });
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.name]));
  const topContributors = topContributorsRaw.map((r) => ({
    name: authorNameById[r.authorId] || 'Unknown',
    ideaCount: r._count._all,
  }));

  res.json({
    totalIdeas,
    byStatus,
    byDepartment,
    byCategory,
    avgResolutionDays,
    topContributors,
  });
}

async function auditLog(req, res) {
  const entries = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({
    entries: entries.map((e) => ({
      id: e.id,
      actorName: e.actor.name,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      details: e.details ? JSON.parse(e.details) : null,
      createdAt: e.createdAt,
    })),
  });
}

module.exports = { listUsers, approveUser, rejectUser, suspendUser, reinstateUser, analytics, auditLog };
