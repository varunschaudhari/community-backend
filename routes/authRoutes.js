const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles, rateLimiter } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', rateLimiter, authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', rateLimiter, authController.register);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate JWT token
 * @access  Private
 */
router.get('/validate', authenticateToken, authController.validateToken);

/**
 * @route   GET /api/auth/admin
 * @desc    Admin-only endpoint example
 * @access  Private (Admin only)
 */
router.get('/admin',
    authenticateToken,
    authorizeRoles(['Admin', 'Super Admin']),
    (req, res) => {
        res.json({
            success: true,
            message: 'Admin access granted',
            data: {
                user: req.user,
                adminFeatures: ['user-management', 'system-settings', 'analytics']
            }
        });
    }
);

/**
 * @route   GET /api/auth/member
 * @desc    Member-only endpoint example
 * @access  Private (Member only)
 */
router.get('/member',
    authenticateToken,
    authorizeRoles('Member'),
    (req, res) => {
        res.json({
            success: true,
            message: 'Member access granted',
            data: {
                user: req.user,
                memberFeatures: ['profile', 'community', 'posts']
            }
        });
    }
);

/**
 * @route   GET /api/auth/moderator
 * @desc    Moderator or Admin endpoint example
 * @access  Private (Moderator or Admin)
 */
router.get('/moderator',
    authenticateToken,
    authorizeRoles(['Admin', 'Moderator', 'Super Admin']),
    (req, res) => {
        res.json({
            success: true,
            message: 'Moderator access granted',
            data: {
                user: req.user,
                moderatorFeatures: ['content-moderation', 'user-reports', 'community-management']
            }
        });
    }
);

/**
 * @route   GET /api/auth/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
