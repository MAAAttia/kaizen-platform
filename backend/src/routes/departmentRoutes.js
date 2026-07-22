const express = require('express');
const router = express.Router();
const departments = require('../controllers/departmentController');
const { authenticate, requireApproved, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Public so the signup form can populate a department dropdown.
router.get('/', asyncHandler(departments.list));

router.post('/', authenticate, requireApproved, requireAdmin, asyncHandler(departments.create));
router.delete('/:id', authenticate, requireApproved, requireAdmin, asyncHandler(departments.remove));

module.exports = router;
