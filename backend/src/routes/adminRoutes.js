const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { authenticate, requireApproved, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate, requireApproved, requireAdmin);

router.get('/users', asyncHandler(admin.listUsers));
router.post('/users/:id/approve', asyncHandler(admin.approveUser));
router.post('/users/:id/reject', asyncHandler(admin.rejectUser));
router.post('/users/:id/suspend', asyncHandler(admin.suspendUser));
router.post('/users/:id/reinstate', asyncHandler(admin.reinstateUser));

router.get('/analytics', asyncHandler(admin.analytics));
router.get('/audit-log', asyncHandler(admin.auditLog));

module.exports = router;
