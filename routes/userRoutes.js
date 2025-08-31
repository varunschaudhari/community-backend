const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all users
router.get('/', userController.getAllUsers);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Search users
router.get('/search', userController.searchUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user role
router.put('/:id/role', userController.updateUserRole);

// Toggle user verification
router.patch('/:id/verification', userController.toggleUserVerification);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
