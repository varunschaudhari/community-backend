const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticateUnifiedToken } = require('../middlewares/unifiedAuthMiddleware');

/**
 * @route   GET /api/permissions/user-permissions
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get('/user-permissions', authenticateUnifiedToken, permissionController.getUserPermissions);

/**
 * @route   GET /api/permissions/roles
 * @desc    Get all available roles and their permissions
 * @access  Private
 */
router.get('/roles', authenticateUnifiedToken, permissionController.getAllRoles);

/**
 * @route   POST /api/permissions/roles/:roleName
 * @desc    Update role permissions (admin only)
 * @access  Private (Admin)
 */
router.post('/roles/:roleName', authenticateUnifiedToken, permissionController.updateRolePermissions);

/**
 * @route   GET /api/permissions/check/:permission
 * @desc    Check if user has specific permission
 * @access  Private
 */
router.get('/check/:permission', authenticateUnifiedToken, permissionController.checkPermission);

/**
 * @route   GET /api/permissions/test
 * @desc    Test endpoint to check if permission routes are working
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Permission routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
