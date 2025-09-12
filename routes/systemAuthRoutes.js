const express = require('express');
const router = express.Router();
const systemAuthController = require('../controllers/systemAuthController');
const {
    authenticateSystemToken,
    authorizeSystemRoles,
    authorizeSystemAccessLevel,
    authorizeSystemPermissions,
    systemRateLimiter
} = require('../middlewares/systemAuthMiddleware');

/**
 * @route   POST /api/system/auth/login
 * @desc    Authenticate system user and return JWT token
 * @access  Public
 */
router.post('/login', systemRateLimiter, systemAuthController.systemLogin);

/**
 * @route   POST /api/system/auth/reset
 * @desc    Reset system user (Temporary endpoint for development)
 * @access  Public (Development only)
 */
router.post('/reset', systemAuthController.resetSystemUser);

/**
 * @route   POST /api/system/auth/register
 * @desc    Register a new system user (Super Admin only)
 * @access  Private (Super Admin)
 */
router.post('/register',
    authenticateSystemToken,
    authorizeSystemRoles('Super Admin'),
    systemAuthController.systemRegister
);

/**
 * @route   GET /api/system/auth/profile
 * @desc    Get current system user profile
 * @access  Private (System Users)
 */
router.get('/profile', authenticateSystemToken, systemAuthController.getSystemProfile);

/**
 * @route   POST /api/system/auth/logout
 * @desc    Logout system user (client-side token removal)
 * @access  Private (System Users)
 */
router.post('/logout', authenticateSystemToken, systemAuthController.systemLogout);

/**
 * @route   GET /api/system/auth/validate
 * @desc    Validate system JWT token
 * @access  Private (System Users)
 */
router.get('/validate', authenticateSystemToken, systemAuthController.validateSystemToken);

/**
 * @route   POST /api/system/auth/change-password
 * @desc    Change system user password
 * @access  Private (System Users)
 */
router.post('/change-password', authenticateSystemToken, systemAuthController.changeSystemPassword);

/**
 * @route   GET /api/system/auth/admin
 * @desc    Super Admin only endpoint example
 * @access  Private (Super Admin only)
 */
router.get('/admin',
    authenticateSystemToken,
    authorizeSystemRoles('Super Admin'),
    (req, res) => {
        res.json({
            success: true,
            message: 'Super Admin access granted',
            data: {
                user: req.user,
                adminFeatures: ['user-management', 'system-settings', 'database-backup', 'security-monitoring']
            }
        });
    }
);

/**
 * @route   GET /api/system/auth/manager
 * @desc    Admin or Admin endpoint example
 * @access  Private (Admin or Admin)
 */
router.get('/manager',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin', 'Admin']),
    (req, res) => {
        res.json({
            success: true,
            message: 'Admin access granted',
            data: {
                user: req.user,
                managerFeatures: ['user-management', 'system-monitoring', 'reports-generation']
            }
        });
    }
);

/**
 * @route   GET /api/system/auth/operator
 * @desc    Moderator or higher endpoint example
 * @access  Private (Moderator or higher)
 */
router.get('/operator',
    authenticateSystemToken,
    authorizeSystemRoles(['Super Admin', 'Admin', 'Moderator']),
    (req, res) => {
        res.json({
            success: true,
            message: 'Moderator access granted',
            data: {
                user: req.user,
                operatorFeatures: ['system-monitoring', 'basic-maintenance', 'log-viewing']
            }
        });
    }
);

/**
 * @route   GET /api/system/auth/high-access
 * @desc    High access level endpoint example (Level 4+)
 * @access  Private (Access Level 4+)
 */
router.get('/high-access',
    authenticateSystemToken,
    authorizeSystemAccessLevel(4),
    (req, res) => {
        res.json({
            success: true,
            message: 'High access level granted',
            data: {
                user: req.user,
                highAccessFeatures: ['critical-system-access', 'security-settings', 'backup-management']
            }
        });
    }
);

/**
 * @route   GET /api/system/auth/system-write
 * @desc    System write permission endpoint example
 * @access  Private (system:write permission)
 */
router.get('/system-write',
    authenticateSystemToken,
    authorizeSystemPermissions('system:write'),
    (req, res) => {
        res.json({
            success: true,
            message: 'System write permission granted',
            data: {
                user: req.user,
                writeFeatures: ['system-configuration', 'user-management', 'database-modification']
            }
        });
    }
);

/**
 * @route   GET /api/system/auth/backup-access
 * @desc    Backup permission endpoint example
 * @access  Private (backup:create or backup:restore permission)
 */
router.get('/backup-access',
    authenticateSystemToken,
    authorizeSystemPermissions(['backup:create', 'backup:restore']),
    (req, res) => {
        res.json({
            success: true,
            message: 'Backup access granted',
            data: {
                user: req.user,
                backupFeatures: ['create-backup', 'restore-backup', 'backup-management']
            }
        });
    }
);

/**
 * @route   GET /api/system/auth/health
 * @desc    Health check endpoint for system authentication service
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'System authentication service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        userType: 'system'
    });
});

/**
 * @route   GET /api/system/auth/permissions
 * @desc    Get current system user permissions
 * @access  Private (System Users)
 */
router.get('/permissions', authenticateSystemToken, (req, res) => {
    res.json({
        success: true,
        data: {
            permissions: req.user.permissions,
            role: req.user.role,
            accessLevel: req.user.accessLevel,
            department: req.user.department
        }
    });
});

/**
 * @route   GET /api/system/auth/access-info
 * @desc    Get detailed access information for current system user
 * @access  Private (System Users)
 */
router.get('/access-info', authenticateSystemToken, (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user,
            accessInfo: {
                role: req.user.role,
                accessLevel: req.user.accessLevel,
                permissions: req.user.permissions,
                department: req.user.department,
                employeeId: req.user.employeeId,
                userType: 'system'
            }
        }
    });
});

module.exports = router;
