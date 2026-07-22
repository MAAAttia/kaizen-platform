const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { logAction } = require('../utils/auditLog');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

async function deleteAttachment(req, res) {
  const { attId } = req.params;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attId },
    include: {
      idea: true,
      comment: { include: { idea: true } },
    },
  });

  if (!attachment) return res.status(404).json({ error: 'Attachment not found.' });

  const isAdmin = req.user?.role === 'ADMIN' && req.user?.status === 'APPROVED';

  // Named owners of the parent idea or comment can delete its attachments.
  // Anonymous content owners intentionally cannot (no identity to verify against —
  // the anonymous-edit-token flow covers idea edits, but file deletion is scoped
  // to named users + admins to keep the permission surface small).
  const parentIdea = attachment.idea || attachment.comment?.idea;
  const isNamedOwner =
    req.user?.status === 'APPROVED' &&
    parentIdea &&
    !parentIdea.isAnonymous &&
    parentIdea.authorId === req.user?.id;

  if (!isAdmin && !isNamedOwner) {
    return res.status(403).json({ error: 'You do not have permission to delete this attachment.' });
  }

  // Remove the physical file (best-effort — don't fail the request if it's already gone)
  const filePath = path.join(UPLOAD_DIR, attachment.storedAs);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // file already gone or unreadable — proceed with DB cleanup
  }

  await prisma.attachment.delete({ where: { id: attId } });

  if (isAdmin) {
    await logAction(req.user.id, 'DELETE_ATTACHMENT', 'Attachment', attId, {
      filename: attachment.filename,
    });
  }

  res.json({ message: 'Attachment deleted.' });
}

module.exports = { deleteAttachment };
