const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/users/profile/:userId
 * @desc Get user profile with full details
 * @access Private (Admin, Moderator, or own profile)
 */
router.get('/profile/:userId', async (req, res, next) => {
  // Allow users to view their own profile or admins/moderators to view any profile
  if (req.params.userId !== req.user.userId && 
      !['Super Admin', 'Admin', 'Moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own profile.'
    });
  }
  next();
}, userController.getUserProfile);

/**
 * @route PUT /api/users/profile/:userId
 * @desc Update user profile
 * @access Private (Admin, Moderator, or own profile)
 */
router.put('/profile/:userId', async (req, res, next) => {
  // Allow users to update their own profile or admins/moderators to update any profile
  if (req.params.userId !== req.user.userId && 
      !['Super Admin', 'Admin', 'Moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own profile.'
    });
  }
  next();
}, userController.updateUserProfile);

/**
 * @route PUT /api/users/change-password/:userId
 * @desc Change user password
 * @access Private (own account only)
 */
router.put('/change-password/:userId', async (req, res, next) => {
  // Only allow users to change their own password
  if (req.params.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only change your own password.'
    });
  }
  next();
}, userController.changePassword);

/**
 * @route GET /api/users/family-tree/:userId
 * @desc Get user family tree
 * @access Private (Admin, Moderator, or own family)
 */
router.get('/family-tree/:userId', async (req, res, next) => {
  // Allow users to view their own family tree or admins/moderators to view any family tree
  if (req.params.userId !== req.user.userId && 
      !['Super Admin', 'Admin', 'Moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own family tree.'
    });
  }
  next();
}, userController.getUserFamilyTree);

/**
 * @route GET /api/users/search
 * @desc Search users by name
 * @access Private (Admin, Moderator)
 */
router.get('/search', authorizeRoles(['Super Admin', 'Admin', 'Moderator']), userController.searchUsers);

/**
 * @route GET /api/users/suggestions
 * @desc Get user suggestions for relationships
 * @access Private (Admin, Moderator)
 */
router.get('/suggestions', authorizeRoles(['Super Admin', 'Admin', 'Moderator']), userController.getUserSuggestions);

/**
 * @route POST /api/users/family-relationship/:userId
 * @desc Add family relationship
 * @access Private (Admin, Moderator)
 */
router.post('/family-relationship/:userId', authorizeRoles(['Super Admin', 'Admin', 'Moderator']), userController.addFamilyRelationship);

/**
 * @route GET /api/users/analytics/:userId
 * @desc Get user statistics and analytics
 * @access Private (Admin, Moderator, or own analytics)
 */
router.get('/analytics/:userId', async (req, res, next) => {
  // Allow users to view their own analytics or admins/moderators to view any analytics
  if (req.params.userId !== req.user.userId && 
      !['Super Admin', 'Admin', 'Moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own analytics.'
    });
  }
  next();
}, userController.getUserAnalytics);

/**
 * @route PUT /api/users/verify/:userId
 * @desc Verify user account
 * @access Private (Admin, Moderator)
 */
router.put('/verify/:userId', authorizeRoles(['Super Admin', 'Admin', 'Moderator']), userController.verifyUser);

/**
 * @route PUT /api/users/status/:userId
 * @desc Activate/Deactivate user account
 * @access Private (Admin, Moderator)
 */
router.put('/status/:userId', authorizeRoles(['Super Admin', 'Admin', 'Moderator']), userController.toggleUserStatus);

module.exports = router;
