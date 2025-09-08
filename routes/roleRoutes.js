const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateUnifiedToken } = require('../middlewares/unifiedAuthMiddleware');

// Apply unified authentication middleware to all routes (accepts both community and system user tokens)
router.use(authenticateUnifiedToken);

// Get all available permissions
router.get('/permissions', roleController.getAvailablePermissions);

// Search roles
router.get('/search', roleController.searchRoles);

// Get roles statistics
router.get('/stats', roleController.getRolesStats);

// Get all roles (with pagination and filtering)
router.get('/', roleController.getAllRoles);

// Create a new role
router.post('/', roleController.createRole);

// Get role by ID
router.get('/:id', roleController.getRoleById);

// Update role
router.put('/:id', roleController.updateRole);

// Delete role
router.delete('/:id', roleController.deleteRole);

// Toggle role status
router.patch('/:id/status', roleController.toggleRoleStatus);

// Get role permissions
router.get('/:id/permissions', roleController.getRolePermissions);

// Update role permissions
router.put('/:id/permissions', roleController.updateRolePermissions);

// Duplicate role
router.post('/:id/duplicate', roleController.duplicateRole);

module.exports = router;
