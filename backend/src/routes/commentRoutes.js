const express = require('express');
const router = express.Router();
const comments = require('../controllers/commentController');
const { authenticate, authenticateOptional, requireApproved, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Delete works for: the admin, the named author of a non-anonymous comment,
// or anyone presenting the correct anonymousDeleteToken — so it intentionally
// does not require login when a valid token is supplied.
router.delete('/:id', authenticateOptional, asyncHandler(comments.deleteComment));

router.post('/:id/hide', authenticate, requireApproved, requireAdmin, asyncHandler(comments.hideComment));

module.exports = router;
