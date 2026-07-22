const prisma = require('../config/prisma');
const { isNonEmptyString } = require('../utils/validate');
const { createAnonymousToken, verifyAnonymousToken } = require('../utils/anonymousToken');
const { logAction } = require('../utils/auditLog');

function serializeAttachment(att) {
  return {
    id: att.id,
    filename: att.filename,
    mimetype: att.mimetype,
    size: att.size,
    url: `/uploads/${att.storedAs}`,
  };
}

function serializeComment(comment) {
  return {
    id: comment.id,
    ideaId: comment.ideaId,
    parentId: comment.parentId,
    body: comment.isHidden ? '[removed by moderator]' : comment.body,
    isHidden: comment.isHidden,
    isAnonymous: comment.isAnonymous,
    authorId: comment.isAnonymous ? null : comment.authorId,
    authorName: comment.isAnonymous ? 'Anonymous' : comment.author ? comment.author.name : 'Unknown',
    attachments: comment.attachments ? comment.attachments.map(serializeAttachment) : [],
    createdAt: comment.createdAt,
  };
}

function buildTree(comments) {
  const byId = new Map(comments.map((c) => [c.id, { ...serializeComment(c), replies: [] }]));
  const roots = [];
  for (const c of comments) {
    const node = byId.get(c.id);
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

async function listComments(req, res) {
  const { ideaId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { ideaId },
    include: { author: true, attachments: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ comments: buildTree(comments) });
}

async function createComment(req, res) {
  const { ideaId } = req.params;
  const { body, parentId } = req.body;
  const isAnonymous = req.body.isAnonymous === true || req.body.isAnonymous === 'true';

  if (!isNonEmptyString(body, 3000)) {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) return res.status(404).json({ error: 'Idea not found.' });

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.ideaId !== ideaId) {
      return res.status(400).json({ error: 'Invalid reply target.' });
    }
  }

  let anonymousDeleteTokenHash = null;
  let rawToken = null;
  if (isAnonymous) {
    const generated = await createAnonymousToken();
    rawToken = generated.raw;
    anonymousDeleteTokenHash = generated.hash;
  }

  const comment = await prisma.comment.create({
    data: {
      ideaId,
      parentId: parentId || null,
      body: body.trim(),
      isAnonymous,
      authorId: isAnonymous ? null : req.user.id,
      anonymousDeleteTokenHash,
    },
    include: { author: true, attachments: true },
  });

  // Persist any uploaded files linked to this comment
  if (req.files && req.files.length > 0) {
    await prisma.attachment.createMany({
      data: req.files.map((f) => ({
        filename: f.originalname,
        storedAs: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        commentId: comment.id,
      })),
    });
    const withAttachments = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: { author: true, attachments: true },
    });
    Object.assign(comment, withAttachments);
  }

  const response = { comment: serializeComment(comment) };
  if (rawToken) {
    response.anonymousDeleteToken = rawToken;
    response.anonymousNotice = 'Save this code if you might want to delete this comment later — we cannot recover it for you.';
  }
  res.status(201).json(response);
}

async function deleteComment(req, res) {
  const { id } = req.params;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  const isAdmin = req.user && req.user.status === 'APPROVED' && req.user.role === 'ADMIN';
  const isNamedAuthor = !comment.isAnonymous && req.user && req.user.status === 'APPROVED' && comment.authorId === req.user.id;
  let isAnonymousOwner = false;
  if (comment.isAnonymous && req.body && req.body.anonymousDeleteToken) {
    isAnonymousOwner = await verifyAnonymousToken(req.body.anonymousDeleteToken, comment.anonymousDeleteTokenHash);
  }

  if (!isAdmin && !isNamedAuthor && !isAnonymousOwner) {
    return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
  }

  await prisma.comment.delete({ where: { id } });

  if (isAdmin) {
    await logAction(req.user.id, 'DELETE_COMMENT', 'Comment', id, { ideaId: comment.ideaId });
  }

  res.json({ message: 'Comment deleted.' });
}

async function hideComment(req, res) {
  const { id } = req.params;
  const { hidden } = req.body;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  const updated = await prisma.comment.update({ where: { id }, data: { isHidden: hidden !== false }, include: { author: true, attachments: true } });
  await logAction(req.user.id, hidden !== false ? 'HIDE_COMMENT' : 'UNHIDE_COMMENT', 'Comment', id, { ideaId: comment.ideaId });

  res.json({ comment: serializeComment(updated) });
}

module.exports = { listComments, createComment, deleteComment, hideComment };
