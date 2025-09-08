const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemUser = require('../models/SystemUser');
const Role = require('../models/Role');

// Dynamic role-permission mapping (can be moved to database later)
const ROLE_PERMISSIONS = {
  'Super Admin': {
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'system_users:read', 'system_users:create', 'system_users:update', 'system_users:delete',
      'roles:read', 'roles:create', 'roles:update', 'roles:delete',
      'analytics:read', 'analytics:export',
      'settings:read', 'settings:update',
      'community:read', 'community:create', 'community:update', 'community:delete',
      'documents:read', 'documents:create', 'documents:update', 'documents:delete',
      'messages:read', 'messages:create', 'messages:update', 'messages:delete'
    ],
    resources: [
      'dashboard', 'analytics', 'messages', 'team', 'documents',
      'users', 'user-management', 'system-users', 'roles', 'settings'
    ]
  },
  'Admin': {
    permissions: [
      'users:read', 'users:create', 'users:update',
      'system_users:read', 'system_users:create', 'system_users:update',
      'roles:read',
      'analytics:read',
      'settings:read', 'settings:update',
      'community:read', 'community:create', 'community:update',
      'documents:read', 'documents:create', 'documents:update',
      'messages:read', 'messages:create'
    ],
    resources: [
      'dashboard', 'analytics', 'messages', 'team', 'documents',
      'users', 'user-management', 'system-users', 'roles', 'settings'
    ]
  },
  'Moderator': {
    permissions: [
      'users:read', 'users:update',
      'analytics:read',
      'settings:read',
      'community:read', 'community:update',
      'documents:read', 'documents:create',
      'messages:read', 'messages:create'
    ],
    resources: [
      'dashboard', 'analytics', 'messages', 'team', 'documents',
      'users', 'user-management', 'system-users', 'roles', 'settings'
    ]
  },
  'Member': {
    permissions: [
      'settings:read', 'settings:update'
    ],
    resources: [
      'dashboard', 'settings'
    ]
  },
  'Guest': {
    permissions: [],
    resources: [
      'dashboard'
    ]
  },
  // Legacy role support
  'admin': {
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'system_users:read', 'system_users:create', 'system_users:update', 'system_users:delete',
      'roles:read', 'roles:create', 'roles:update', 'roles:delete',
      'analytics:read', 'analytics:export',
      'settings:read', 'settings:update',
      'community:read', 'community:create', 'community:update', 'community:delete',
      'documents:read', 'documents:create', 'documents:update', 'documents:delete',
      'messages:read', 'messages:create', 'messages:update', 'messages:delete'
    ],
    resources: [
      'dashboard', 'analytics', 'messages', 'team', 'documents',
      'users', 'user-management', 'system-users', 'roles', 'settings'
    ]
  }
};

/**
 * Get user permissions based on their role
 */
const getUserPermissions = async (req, res) => {
  try {
    // User data is already available from the unified auth middleware
    const { role, userType, userId } = req.user;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'User role not found'
      });
    }

    // Get permissions for user's role
    const rolePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['Guest'];

    // If user has a roleId, try to get permissions from Role model
    let user;
    if (userType === 'system') {
      user = await SystemUser.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (user && user.roleId) {
      try {
        const roleDoc = await Role.findById(user.roleId);
        if (roleDoc && roleDoc.permissions) {
          // Use database permissions if available
          rolePermissions.permissions = roleDoc.permissions;
        }
      } catch (error) {
        console.log('Could not fetch role from database, using default permissions');
      }
    }

    res.json({
      success: true,
      data: {
        role: role,
        permissions: rolePermissions.permissions,
        resources: rolePermissions.resources
      }
    });

  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all available roles and their permissions
 */
const getAllRoles = async (req, res) => {
  try {
    // Convert ROLE_PERMISSIONS to array format
    const roles = Object.entries(ROLE_PERMISSIONS).map(([name, data]) => ({
      id: name.toLowerCase().replace(' ', '_'),
      name,
      permissions: data.permissions.map(permission => ({
        id: permission,
        name: permission,
        resource: permission.split(':')[0],
        action: permission.split(':')[1]
      }))
    }));

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update role permissions (for admin use)
 */
const updateRolePermissions = async (req, res) => {
  try {
    const { roleName, permissions, resources } = req.body;

    if (!roleName || !permissions || !resources) {
      return res.status(400).json({
        success: false,
        message: 'Role name, permissions, and resources are required'
      });
    }

    // Update the role permissions (in a real app, this would update the database)
    ROLE_PERMISSIONS[roleName] = {
      permissions,
      resources
    };

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: {
        role: roleName,
        permissions,
        resources
      }
    });

  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check if user has specific permission
 */
const checkPermission = async (req, res) => {
  try {
    const { permission } = req.params;

    // Get user permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    let userRole;

    if (decoded.userType === 'system') {
      user = await SystemUser.findById(decoded.userId);
      userRole = user?.systemRole || user?.role;
    } else {
      user = await User.findById(decoded.userId);
      userRole = user?.role;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const rolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['Guest'];
    const hasPermission = rolePermissions.permissions.includes(permission);

    res.json({
      success: true,
      data: {
        hasPermission,
        permission,
        userRole
      }
    });

  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUserPermissions,
  getAllRoles,
  updateRolePermissions,
  checkPermission
};
