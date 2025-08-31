const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new member
router.post('/create', memberController.createMember);

// Search members for autocomplete
router.get('/search', memberController.searchMembers);

// Get all members (with pagination and filtering)
router.get('/', memberController.getAllMembers);

// Get member by ID
router.get('/:id', memberController.getMemberById);

// Update member
router.put('/:id', memberController.updateMember);

// Delete member
router.delete('/:id', memberController.deleteMember);

// Verify member
router.patch('/:id/verify', memberController.verifyMember);

// Get member statistics
router.get('/stats/overview', memberController.getMemberStats);

module.exports = router;
