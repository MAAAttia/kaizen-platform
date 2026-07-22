const prisma = require('../config/prisma');

/**
 * Records an admin action. Used for every approve/reject/suspend, idea
 * status change, comment moderation, and category/department edit, so
 * there is always a trail of who changed what and when.
 */
async function logAction(actorId, action, targetType, targetId, details = null) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    // Auditing must never break the primary action — log and move on.
    console.error('Failed to write audit log entry:', err);
  }
}

module.exports = { logAction };
