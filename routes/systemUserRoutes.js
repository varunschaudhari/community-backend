const express = require('express');
const router = express.Router();
const systemUserController = require('../controllers/systemUserController');
const {
    authenticateSystemToken,
    authorizeSystemRoles,
    authorizeSystemAccessLevel,
    authorizeSystemPermissions
} = require('../middlewares/systemAuthMiddleware');

/**
 * @route   GET /api/system/users
 * @desc    Get all system users with pagination and filtering
 * @access  Private (System Users with users:manage permission)
 */
router.get('/',
    authenticateSystemToken,
    authorizeSystemPermissions('users:manage'),
    systemUserController.getAllSystemUsers
);

/**
 * @route   GET /api/system/users/search
 * @desc    Search system users
 * @access  Private (System Users with users:manage permission)
 */
router.get('/search',
    authenticateSystemToken,
    authorizeSystemPermissions('users:manage'),
    systemUserController.searchSystemUsers
);

/**
 * @route   GET /api/system/users/stats
 * @desc    Get system user statistics
 * @access  Private (Super Admin or Admin)
 */
router.get('/stats',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin', 'Admin']),
    systemUserController.getSystemUserStats
);

/**
 * @route   GET /api/system/users/:id
 * @desc    Get system user by ID
 * @access  Private (System Users with users:manage permission)
 */
router.get('/:id',
    authenticateSystemToken,
    authorizeSystemPermissions('users:manage'),
    systemUserController.getSystemUserById
);

/**
 * @route   PUT /api/system/users/:id
 * @desc    Update system user
 * @access  Private (Super Admin or Admin)
 */
router.put('/:id',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin', 'Admin']),
    systemUserController.updateSystemUser
);

/**
 * @route   DELETE /api/system/users/:id
 * @desc    Delete system user
 * @access  Private (Super Admin only)
 */
router.delete('/:id',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    systemUserController.deleteSystemUser
);

/**
 * @route   POST /api/system/users/:id/deactivate
 * @desc    Deactivate system user
 * @access  Private (Super Admin only)
 */
router.post('/:id/deactivate',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    systemUserController.deactivateSystemUser
);

/**
 * @route   POST /api/system/users/:id/activate
 * @desc    Activate system user
 * @access  Private (Super Admin only)
 */
router.post('/:id/activate',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    systemUserController.activateSystemUser
);

/**
 * @route   POST /api/system/users/:id/reset-password
 * @desc    Reset system user password
 * @access  Private (Super Admin only)
 */
router.post('/:id/reset-password',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    systemUserController.resetSystemUserPassword
);

/**
 * @route   GET /api/system/users/department/:department
 * @desc    Get system users by department
 * @access  Private (System Users with users:manage permission)
 */
router.get('/department/:department',
    authenticateSystemToken,
    authorizeSystemPermissions('users:manage'),
    (req, res) => {
        // This would be handled by the getAllSystemUsers controller with department filter
        req.query.department = req.params.department;
        systemUserController.getAllSystemUsers(req, res);
    }
);

/**
 * @route   GET /api/system/users/role/:role
 * @desc    Get system users by role
 * @access  Private (System Users with users:manage permission)
 */
router.get('/role/:role',
    authenticateSystemToken,
    authorizeSystemPermissions('users:manage'),
    (req, res) => {
        // This would be handled by the getAllSystemUsers controller with role filter
        req.query.role = req.params.role;
        systemUserController.getAllSystemUsers(req, res);
    }
);

/**
 * @route   GET /api/system/users/active
 * @desc    Get active system users only
 * @access  Private (System Users with users:manage permission)
 */
router.get('/active',
    authenticateSystemToken,
    authorizeSystemPermissions('users:manage'),
    (req, res) => {
        // This would be handled by the getAllSystemUsers controller with isActive filter
        req.query.isActive = 'true';
        systemUserController.getAllSystemUsers(req, res);
    }
);

/**
 * @route   GET /api/system/users/inactive
 * @desc    Get inactive system users only
 * @access  Private (Super Admin only)
 */
router.get('/inactive',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    (req, res) => {
        // This would be handled by the getAllSystemUsers controller with isActive filter
        req.query.isActive = 'false';
        systemUserController.getAllSystemUsers(req, res);
    }
);

/**
 * @route   GET /api/system/users/locked
 * @desc    Get locked system users
 * @access  Private (Super Admin only)
 */
router.get('/locked',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    async (req, res) => {
        try {
            const SystemUser = require('../models/SystemUser');
            const { page = 1, limit = 10 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Find locked users
            const lockedUsers = await SystemUser.find({
                lockUntil: { $exists: true, $gt: new Date() }
            })
                .select('-password -twoFactorSecret -loginAttempts')
                .sort({ lockUntil: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await SystemUser.countDocuments({
                lockUntil: { $exists: true, $gt: new Date() }
            });

            res.status(200).json({
                success: true,
                data: {
                    systemUsers: lockedUsers,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalUsers: total,
                        hasNext: skip + lockedUsers.length < total,
                        hasPrev: parseInt(page) > 1
                    }
                }
            });

        } catch (error) {
            console.error('Get locked system users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.'
            });
        }
    }
);

/**
 * @route   POST /api/system/users/:id/unlock
 * @desc    Unlock system user account
 * @access  Private (Super Admin only)
 */
router.post('/:id/unlock',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const SystemUser = require('../models/SystemUser');

            const systemUser = await SystemUser.findById(id);
            if (!systemUser) {
                return res.status(404).json({
                    success: false,
                    message: 'System user not found'
                });
            }

            // Unlock the account
            systemUser.loginAttempts = 0;
            systemUser.lockUntil = undefined;
            await systemUser.save();

            res.status(200).json({
                success: true,
                message: 'System user account unlocked successfully'
            });

        } catch (error) {
            console.error('Unlock system user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.'
            });
        }
    }
);

module.exports = router;
