const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticateUnifiedToken } = require('../middlewares/unifiedAuthMiddleware');

// Apply unified authentication middleware to all routes (accepts both community and system user tokens)
router.use(authenticateUnifiedToken);

// Create a new member
router.post('/create', memberController.createMember);

// Search users for autocomplete
router.get('/search', memberController.searchUsers);

// Get all users (with pagination and filtering)
router.get('/', memberController.getAllUsers);

// Get member by ID
router.get('/:id', memberController.getMemberById);

// Update user
router.put('/:id', memberController.updateMember);

// Update user role
router.put('/:id/role', memberController.updateUserRole);

// Delete user
router.delete('/:id', memberController.deleteMember);

// Verify user
router.patch('/:id/verify', memberController.verifyUser);

// Toggle user verification
router.patch('/:id/verification', memberController.toggleUserVerification);

// Get user statistics
router.get('/stats/overview', memberController.getUserStats);

module.exports = router;
