const Role = require('../models/Role');
const User = require('../models/User');

class RoleController {
  /**
   * Get all roles with optional filtering and pagination
   */
  async getAllRoles(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        isSystem,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      const filter = {};

      // Add search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Add status filters
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      if (isSystem !== undefined) {
        filter.isSystem = isSystem === 'true';
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const roles = await Role.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get member counts for each role
      const rolesWithMemberCount = await Promise.all(
        roles.map(async (role) => {
          const memberCount = await User.countDocuments({ role: role.name });
          const roleObj = role.toObject();
          roleObj.memberCount = memberCount;
          return roleObj;
        })
      );

      const total = await Role.countDocuments(filter);

      res.json({
        success: true,
        data: rolesWithMemberCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get all roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roles',
        error: error.message
      });
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req, res) {
    try {
      const { id } = req.params;

      const role = await Role.findById(id)
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Get member count
      const memberCount = await User.countDocuments({ role: role.name });
      const roleObj = role.toObject();
      roleObj.memberCount = memberCount;

      res.json({
        success: true,
        data: roleObj
      });

    } catch (error) {
      console.error('Get role by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role',
        error: error.message
      });
    }
  }

  /**
   * Create a new role
   */
  async createRole(req, res) {
    try {
      const { name, description, permissions } = req.body;
      const userId = req.user.userId;

      // Check if role with name already exists
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }

      // Create new role
      const roleData = {
        name: name.trim(),
        description: description.trim(),
        permissions,
        createdBy: userId
      };

      const role = new Role(roleData);
      await role.save();

      // Populate createdBy field
      await role.populate('createdBy', 'username firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });

    } catch (error) {
      console.error('Create role error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error.message
      });
    }
  }

  /**
   * Update role
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      // Check if role exists
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent updating system roles
      if (existingRole.isSystem) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be modified'
        });
      }

      // Check if name is being updated and if it conflicts
      if (updateData.name && updateData.name !== existingRole.name) {
        const nameConflict = await Role.findOne({
          name: updateData.name.toLowerCase(),
          _id: { $ne: id }
        });
        if (nameConflict) {
          return res.status(409).json({
            success: false,
            message: 'Role with this name already exists'
          });
        }
      }

      // Add updatedBy field
      updateData.updatedBy = userId;

      const role = await Role.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role
      });

    } catch (error) {
      console.error('Update role error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: error.message
      });
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req, res) {
    try {
      const { id } = req.params;

      // Check if role exists
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent deleting system roles
      if (role.isSystem) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be deleted'
        });
      }

      // Check if role is assigned to any users
      const memberCount = await User.countDocuments({ role: role.name });
      if (memberCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role. It is assigned to ${memberCount} user(s). Please reassign users before deleting.`
        });
      }

      await Role.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });

    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: error.message
      });
    }
  }

  /**
   * Toggle role status
   */
  async toggleRoleStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = req.user.userId;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent deactivating system roles
      if (role.isSystem && !isActive) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be deactivated'
        });
      }

      role.isActive = isActive;
      role.updatedBy = userId;
      await role.save();

      await role.populate('createdBy', 'username firstName lastName');
      await role.populate('updatedBy', 'username firstName lastName');

      res.json({
        success: true,
        message: `Role ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: role
      });

    } catch (error) {
      console.error('Toggle role status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle role status',
        error: error.message
      });
    }
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(req, res) {
    try {
      const { id } = req.params;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role.permissions
      });

    } catch (error) {
      console.error('Get role permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role permissions',
        error: error.message
      });
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const userId = req.user.userId;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent updating system roles
      if (role.isSystem) {
        return res.status(403).json({
          success: false,
          message: 'System role permissions cannot be modified'
        });
      }

      role.permissions = permissions;
      role.updatedBy = userId;
      await role.save();

      await role.populate('createdBy', 'username firstName lastName');
      await role.populate('updatedBy', 'username firstName lastName');

      res.json({
        success: true,
        message: 'Role permissions updated successfully',
        data: role
      });

    } catch (error) {
      console.error('Update role permissions error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update role permissions',
        error: error.message
      });
    }
  }

  /**
   * Get all available permissions
   */
  async getAvailablePermissions(req, res) {
    try {
      const permissions = [
        {
          id: 'users:read',
          name: 'View Users',
          description: 'Can view community users',
          resource: 'users',
          action: 'read'
        },
        {
          id: 'users:create',
          name: 'Create Users',
          description: 'Can create new users',
          resource: 'users',
          action: 'create'
        },
        {
          id: 'users:update',
          name: 'Update Users',
          description: 'Can edit user information',
          resource: 'users',
          action: 'update'
        },
        {
          id: 'users:delete',
          name: 'Delete Users',
          description: 'Can remove users',
          resource: 'users',
          action: 'delete'
        },
        {
          id: 'roles:read',
          name: 'View Roles',
          description: 'Can view role definitions',
          resource: 'roles',
          action: 'read'
        },
        {
          id: 'roles:create',
          name: 'Create Roles',
          description: 'Can create new roles',
          resource: 'roles',
          action: 'create'
        },
        {
          id: 'roles:update',
          name: 'Update Roles',
          description: 'Can edit role permissions',
          resource: 'roles',
          action: 'update'
        },
        {
          id: 'roles:delete',
          name: 'Delete Roles',
          description: 'Can remove roles',
          resource: 'roles',
          action: 'delete'
        },
        {
          id: 'analytics:read',
          name: 'View Analytics',
          description: 'Can access analytics dashboard',
          resource: 'analytics',
          action: 'read'
        },
        {
          id: 'settings:read',
          name: 'View Settings',
          description: 'Can view system settings',
          resource: 'settings',
          action: 'read'
        },
        {
          id: 'settings:update',
          name: 'Update Settings',
          description: 'Can modify system settings',
          resource: 'settings',
          action: 'update'
        }
      ];

      res.json({
        success: true,
        data: permissions
      });

    } catch (error) {
      console.error('Get available permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions',
        error: error.message
      });
    }
  }

  /**
   * Get roles statistics
   */
  async getRolesStats(req, res) {
    try {
      const totalRoles = await Role.countDocuments();
      const activeRoles = await Role.countDocuments({ isActive: true });
      const systemRoles = await Role.countDocuments({ isSystem: true });
      const customRoles = await Role.countDocuments({ isSystem: false });

      // Get roles by member count
      const rolesByMemberCount = await Role.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'name',
            foreignField: 'role',
            as: 'users'
          }
        },
        {
          $project: {
            name: 1,
            memberCount: { $size: '$users' }
          }
        },
        {
          $sort: { memberCount: -1 }
        },
        {
          $limit: 10
        }
      ]);

      // Get permission usage statistics
      const permissionStats = await Role.aggregate([
        {
          $unwind: '$permissions'
        },
        {
          $group: {
            _id: '$permissions',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          total: totalRoles,
          active: activeRoles,
          inactive: totalRoles - activeRoles,
          system: systemRoles,
          custom: customRoles,
          rolesByMemberCount,
          permissionStats
        }
      });

    } catch (error) {
      console.error('Get roles stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role statistics',
        error: error.message
      });
    }
  }

  /**
   * Search roles
   */
  async searchRoles(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const roles = await Role.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ],
        isActive: true
      })
        .select('name description permissions')
        .limit(10);

      res.json({
        success: true,
        data: roles
      });

    } catch (error) {
      console.error('Search roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search roles',
        error: error.message
      });
    }
  }

  /**
   * Duplicate role
   */
  async duplicateRole(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user.userId;

      const originalRole = await Role.findById(id);
      if (!originalRole) {
        return res.status(404).json({
          success: false,
          message: 'Original role not found'
        });
      }

      // Check if new name already exists
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }

      // Create duplicated role
      const duplicatedRole = new Role({
        name: name.trim(),
        description: `${originalRole.description} (Copy)`,
        permissions: originalRole.permissions,
        createdBy: userId
      });

      await duplicatedRole.save();
      await duplicatedRole.populate('createdBy', 'username firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Role duplicated successfully',
        data: duplicatedRole
      });

    } catch (error) {
      console.error('Duplicate role error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to duplicate role',
        error: error.message
      });
    }
  }
}

module.exports = new RoleController();
