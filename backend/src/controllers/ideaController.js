const prisma = require('../config/prisma');
const { isNonEmptyString } = require('../utils/validate');
const { createAnonymousToken, verifyAnonymousToken } = require('../utils/anonymousToken');
const { logAction } = require('../utils/auditLog');

const TERMINAL_STATUSES = ['IMPLEMENTED', 'REJECTED', 'CLOSED'];
const ALL_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'IMPLEMENTED', 'REJECTED', 'CLOSED'];
// Voting is locked once an idea reaches a terminal state.
const VOTABLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'];

function serializeAttachment(att) {
  return {
    id: att.id,
    filename: att.filename,
    mimetype: att.mimetype,
    size: att.size,
    url: `/uploads/${att.storedAs}`,
  };
}

function serializeIdea(idea, viewerVoteMap = {}) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    rootCause: idea.rootCause,
    proposedSolution: idea.proposedSolution,
    expectedBenefit: idea.expectedBenefit,
    isAnonymous: idea.isAnonymous,
    authorId: idea.isAnonymous ? null : idea.authorId,
    authorName: idea.isAnonymous ? 'Anonymous' : idea.author ? idea.author.name : 'Unknown',
    departmentId: idea.departmentId,
    departmentName: idea.department ? idea.department.name : null,
    categoryId: idea.categoryId,
    categoryName: idea.category ? idea.category.name : null,
    status: idea.status,
    adminResponse: idea.adminResponse,
    score: idea.score,
    commentCount: idea._count ? idea._count.comments : undefined,
    myVote: viewerVoteMap[idea.id] || null,
    votingOpen: VOTABLE_STATUSES.includes(idea.status),
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    closedAt: idea.closedAt,
    attachments: idea.attachments ? idea.attachments.map(serializeAttachment) : [],
  };
}

const ideaInclude = {
  author: true,
  department: true,
  category: true,
  attachments: true,
  _count: { select: { comments: true } },
};

async function getVoteMapForUser(userId, ideaIds) {
  if (!userId || ideaIds.length === 0) return {};
  const votes = await prisma.vote.findMany({
    where: { userId, ideaId: { in: ideaIds } },
  });
  return Object.fromEntries(votes.map((v) => [v.ideaId, v.value]));
}

async function listIdeas(req, res) {
  const { status, departmentId, categoryId, search, sort = 'new', mine } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 50);

  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (mine === 'true' && req.user) {
    where.authorId = req.user.id;
  }

  const orderBy = sort === 'top' ? [{ score: 'desc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }];

  const [items, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      include: ideaInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.idea.count({ where }),
  ]);

  const voteMap = await getVoteMapForUser(req.user?.id, items.map((i) => i.id));

  res.json({
    items: items.map((idea) => serializeIdea(idea, voteMap)),
    total,
    page,
    pageSize,
  });
}

async function createIdea(req, res) {
  const { title, description, rootCause, proposedSolution, expectedBenefit, departmentId, categoryId } = req.body;
  const isAnonymous = req.body.isAnonymous === true || req.body.isAnonymous === 'true';

  if (!isNonEmptyString(title, 200)) {
    return res.status(400).json({ error: 'Please give your idea a short title.' });
  }
  if (!isNonEmptyString(description, 5000)) {
    return res.status(400).json({ error: 'Please describe your idea.' });
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return res.status(400).json({ error: 'Please choose a valid department.' });
  }
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) return res.status(400).json({ error: 'Please choose a valid category.' });
  }

  let anonymousEditTokenHash = null;
  let rawToken = null;
  if (isAnonymous) {
    const generated = await createAnonymousToken();
    rawToken = generated.raw;
    anonymousEditTokenHash = generated.hash;
  }

  const idea = await prisma.idea.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      rootCause: isNonEmptyString(rootCause, 3000) ? rootCause.trim() : null,
      proposedSolution: isNonEmptyString(proposedSolution, 3000) ? proposedSolution.trim() : null,
      expectedBenefit: isNonEmptyString(expectedBenefit, 2000) ? expectedBenefit.trim() : null,
      departmentId: departmentId || null,
      categoryId: categoryId || null,
      isAnonymous,
      authorId: isAnonymous ? null : req.user.id,
      anonymousEditTokenHash,
    },
    include: ideaInclude,
  });

  // Persist any uploaded files as Attachment records linked to this idea
  if (req.files && req.files.length > 0) {
    await prisma.attachment.createMany({
      data: req.files.map((f) => ({
        filename: f.originalname,
        storedAs: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        ideaId: idea.id,
      })),
    });
    // Re-fetch so attachments are included in the response
    const withAttachments = await prisma.idea.findUnique({ where: { id: idea.id }, include: ideaInclude });
    Object.assign(idea, withAttachments);
  }

  const response = { idea: serializeIdea(idea) };
  if (rawToken) {
    response.anonymousEditToken = rawToken;
    response.anonymousNotice =
      'Save this code now — it is the only way to edit or withdraw this idea later. We do not store any link between this idea and your account, so we cannot recover it for you.';
  }
  res.status(201).json(response);
}

async function getIdea(req, res) {
  const { id } = req.params;
  const idea = await prisma.idea.findUnique({ where: { id }, include: ideaInclude });
  if (!idea) return res.status(404).json({ error: 'Idea not found.' });

  const voteMap = await getVoteMapForUser(req.user?.id, [id]);
  res.json({ idea: serializeIdea(idea, voteMap) });
}

async function canModify(idea, req) {
  const userOk = req.user && req.user.status === 'APPROVED';

  if (userOk && req.user.role === 'ADMIN') return { allowed: true, asAdmin: true };
  if (idea.status !== 'SUBMITTED') return { allowed: false };

  if (!idea.isAnonymous && userOk && idea.authorId === req.user.id) {
    return { allowed: true, asAdmin: false };
  }
  if (idea.isAnonymous && req.body && req.body.anonymousEditToken) {
    const ok = await verifyAnonymousToken(req.body.anonymousEditToken, idea.anonymousEditTokenHash);
    if (ok) return { allowed: true, asAdmin: false };
  }
  return { allowed: false };
}

async function updateIdea(req, res) {
  const { id } = req.params;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return res.status(404).json({ error: 'Idea not found.' });

  const permission = await canModify(idea, req);
  if (!permission.allowed) {
    return res.status(403).json({ error: 'You do not have permission to edit this idea, or it is no longer editable.' });
  }

  const { title, description, rootCause, proposedSolution, expectedBenefit, departmentId, categoryId } = req.body;
  const data = {};
  if (title !== undefined) {
    if (!isNonEmptyString(title, 200)) return res.status(400).json({ error: 'Title cannot be empty.' });
    data.title = title.trim();
  }
  if (description !== undefined) {
    if (!isNonEmptyString(description, 5000)) return res.status(400).json({ error: 'Description cannot be empty.' });
    data.description = description.trim();
  }
  if (rootCause !== undefined) data.rootCause = isNonEmptyString(rootCause, 3000) ? rootCause.trim() : null;
  if (proposedSolution !== undefined) data.proposedSolution = isNonEmptyString(proposedSolution, 3000) ? proposedSolution.trim() : null;
  if (expectedBenefit !== undefined) data.expectedBenefit = isNonEmptyString(expectedBenefit, 2000) ? expectedBenefit.trim() : null;
  if (departmentId !== undefined) data.departmentId = departmentId || null;
  if (categoryId !== undefined) data.categoryId = categoryId || null;

  const updated = await prisma.idea.update({ where: { id }, data, include: ideaInclude });

  // Attach any new files added during the edit
  if (req.files && req.files.length > 0) {
    await prisma.attachment.createMany({
      data: req.files.map((f) => ({
        filename: f.originalname,
        storedAs: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        ideaId: id,
      })),
    });
    const refreshed = await prisma.idea.findUnique({ where: { id }, include: ideaInclude });
    return res.json({ idea: serializeIdea(refreshed) });
  }

  if (permission.asAdmin) {
    await logAction(req.user.id, 'EDIT_IDEA', 'Idea', id, { title: updated.title });
  }

  res.json({ idea: serializeIdea(updated) });
}

async function deleteIdea(req, res) {
  const { id } = req.params;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return res.status(404).json({ error: 'Idea not found.' });

  const permission = await canModify(idea, req);
  if (!permission.allowed) {
    return res.status(403).json({ error: 'You do not have permission to remove this idea, or it is no longer removable.' });
  }

  await prisma.idea.delete({ where: { id } });

  if (permission.asAdmin) {
    await logAction(req.user.id, 'DELETE_IDEA', 'Idea', id, { title: idea.title });
  }

  res.json({ message: 'Idea removed.' });
}

async function changeStatus(req, res) {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  if (!ALL_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return res.status(404).json({ error: 'Idea not found.' });

  const updated = await prisma.idea.update({
    where: { id },
    data: {
      status,
      adminResponse: adminResponse !== undefined ? adminResponse : idea.adminResponse,
      closedAt: TERMINAL_STATUSES.includes(status) ? new Date() : null,
    },
    include: ideaInclude,
  });

  await logAction(req.user.id, 'CHANGE_IDEA_STATUS', 'Idea', id, {
    from: idea.status,
    to: status,
    title: idea.title,
  });

  res.json({ idea: serializeIdea(updated) });
}

module.exports = { listIdeas, createIdea, getIdea, updateIdea, deleteIdea, changeStatus, ALL_STATUSES };
