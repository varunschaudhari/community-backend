const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');

class MemberController {
  /**
   * Create a new community member
   */
  async createMember(req, res) {
    try {
      console.log('Received member data:', JSON.stringify(req.body, null, 2));

      const {
        firstName,
        middleName,
        lastName,
        email,
        phone,
        password,
        pan,
        adhar,
        maritalStatus,
        dateOfBirth,
        dateOfMarriage,
        roles,
        kul,
        gotra,
        fatherName,
        motherName,
        childrenName
      } = req.body;

      // Check if user with email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Check if user with phone already exists
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists'
        });
      }

      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const userData = {
        firstName,
        middleName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        pan,
        adhar,
        maritalStatus,
        dateOfBirth: new Date(dateOfBirth),
        role: roles, // Map roles to role field
        kul,
        gotra,
        fatherName,
        motherName,
        childrenName
      };

      // Add date of marriage if provided and marital status is married
      if (dateOfMarriage && maritalStatus === 'Married') {
        userData.dateOfMarriage = new Date(dateOfMarriage);
      }

      const user = new User(userData);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
      });

    } catch (error) {
      console.error('Create member error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        console.log('Validation errors:', errors);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create member',
        error: error.message
      });
    }
  }

  /**
   * Get all users (with pagination and filtering)
   */
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        isVerified,
        verified,
        isActive
      } = req.query;

      const skip = (page - 1) * limit;
      const filter = {};

      // Add search filter
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Add role filter
      if (role) {
        filter.role = role;
      }

      // Add verification filter
      if (isVerified !== undefined) {
        filter.verified = isVerified === 'true';
      } else if (verified !== undefined) {
        filter.verified = verified === 'true';
      }

      // Add active filter
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const users = await User.find(filter)
        .populate('roleId', 'name description permissions')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(filter);

      // Add role information to each user
      const usersWithRoles = users.map(user => {
        const userObj = user.toObject();
        return {
          ...userObj,
          roleName: userObj.roleId?.name || 'No Role',
          roleDescription: userObj.roleId?.description || '',
          permissions: userObj.roleId?.permissions || []
        };
      });

      res.json({
        success: true,
        data: usersWithRoles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .populate('roleId', 'name description permissions')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userObj = user.toObject();
      const userWithRole = {
        ...userObj,
        roleName: userObj.roleId?.name || 'No Role',
        roleDescription: userObj.roleId?.description || '',
        permissions: userObj.roleId?.permissions || []
      };

      res.json({
        success: true,
        data: userWithRole
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }

  /**
   * Update member
   */
  async updateMember(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove sensitive fields from update
      delete updateData.password;
      delete updateData.email; // Email should be updated through a separate process

      // Convert date strings to Date objects
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
      if (updateData.dateOfMarriage) {
        updateData.dateOfMarriage = new Date(updateData.dateOfMarriage);
      }

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('roleId', 'name description permissions')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userObj = user.toObject();
      const userWithRole = {
        ...userObj,
        roleName: userObj.roleId?.name || 'No Role',
        roleDescription: userObj.roleId?.description || '',
        permissions: userObj.roleId?.permissions || []
      };

      res.json({
        success: true,
        message: 'User updated successfully',
        data: userWithRole
      });

    } catch (error) {
      console.error('Update user error:', error);

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
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  /**
   * Delete member
   */
  async deleteMember(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  /**
   * Search users for autocomplete
   */
  async searchUsers(req, res) {
    try {
      const { q, type } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      let searchField = 'firstName';
      if (type === 'father') {
        searchField = 'fatherName';
      } else if (type === 'mother') {
        searchField = 'motherName';
      } else if (type === 'children') {
        searchField = 'childrenName';
      }

      const users = await User.find({
        [searchField]: { $regex: q, $options: 'i' },
        isActive: true
      })
        .select(`${searchField} firstName lastName`)
        .limit(10);

      const results = users.map(user => ({
        id: user._id,
        name: user[searchField] || `${user.firstName} ${user.lastName}`,
        type
      }));

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search users',
        error: error.message
      });
    }
  }

  /**
   * Verify user
   */
  async verifyUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndUpdate(
        id,
        { verified: true },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User verified successfully',
        data: user
      });

    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify user',
        error: error.message
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ verified: true });
      const activeUsers = await User.countDocuments({ isActive: true });

      const roleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const maritalStats = await User.aggregate([
        {
          $group: {
            _id: '$maritalStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          total: totalUsers,
          verified: verifiedUsers,
          active: activeUsers,
          unverified: totalUsers - verifiedUsers,
          inactive: totalUsers - activeUsers,
          roleDistribution: roleStats,
          maritalDistribution: maritalStats
        }
      });

    } catch (error) {
      console.error('Get member stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch member statistics',
        error: error.message
      });
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify role exists
      if (roleId) {
        const role = await Role.findById(roleId);
        if (!role) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role ID'
          });
        }
      }

      user.roleId = roleId;
      await user.save();

      const updatedUser = await User.findById(id)
        .populate('roleId', 'name description permissions')
        .select('-password');

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message
      });
    }
  }

  /**
   * Toggle user verification status
   */
  async toggleUserVerification(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.verified = !user.verified;
      await user.save();

      res.json({
        success: true,
        message: `User ${user.verified ? 'verified' : 'unverified'} successfully`,
        data: {
          id: user._id,
          verified: user.verified
        }
      });
    } catch (error) {
      console.error('Toggle user verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle user verification',
        error: error.message
      });
    }
  }
}

module.exports = new MemberController();
