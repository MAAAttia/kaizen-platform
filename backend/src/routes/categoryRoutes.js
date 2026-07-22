const express = require('express');
const router = express.Router();
const categories = require('../controllers/categoryController');
const { authenticate, requireApproved, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(categories.list));

router.post('/', authenticate, requireApproved, requireAdmin, asyncHandler(categories.create));
router.delete('/:id', authenticate, requireApproved, requireAdmin, asyncHandler(categories.remove));

module.exports = router;
