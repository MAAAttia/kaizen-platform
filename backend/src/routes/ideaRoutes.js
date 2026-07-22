const express = require('express');
const router = express.Router();
const ideas = require('../controllers/ideaController');
const votes = require('../controllers/voteController');
const comments = require('../controllers/commentController');
const { deleteAttachment } = require('../controllers/attachmentController');
const { authenticate, authenticateOptional, requireApproved, requireAdmin } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const { upload, handleUploadError } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', authenticateOptional, asyncHandler(ideas.listIdeas));

// multipart/form-data — multer runs first, then the controller
router.post(
  '/',
  authenticate,
  requireApproved,
  writeLimiter,
  upload.array('files', 5),
  handleUploadError,
  asyncHandler(ideas.createIdea)
);

router.get('/:id', authenticateOptional, asyncHandler(ideas.getIdea));

// Edit also accepts new file uploads
router.put(
  '/:id',
  authenticateOptional,
  upload.array('files', 5),
  handleUploadError,
  asyncHandler(ideas.updateIdea)
);

router.delete('/:id', authenticateOptional, asyncHandler(ideas.deleteIdea));
router.post('/:id/status', authenticate, requireApproved, requireAdmin, asyncHandler(ideas.changeStatus));
router.post('/:id/vote', authenticate, requireApproved, writeLimiter, asyncHandler(votes.voteOnIdea));

// Delete a single attachment from an idea (owner or admin)
router.delete(
  '/:id/attachments/:attId',
  authenticate,
  requireApproved,
  asyncHandler(deleteAttachment)
);

// Comments on an idea
router.get('/:ideaId/comments', asyncHandler(comments.listComments));
router.post(
  '/:ideaId/comments',
  authenticate,
  requireApproved,
  writeLimiter,
  upload.array('files', 5),
  handleUploadError,
  asyncHandler(comments.createComment)
);

module.exports = router;
