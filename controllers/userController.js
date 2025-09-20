const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

class UserController {
  /**
   * Create a new user with enhanced schema
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const currentUserId = req.user?.userId;

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'password', 'dobAsPerDocument', 'role'];
      const missingFields = requiredFields.filter(field => !userData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields
        });
      }

      // Validate marriage date if marital status is married
      if (userData.maritalStatus === 'married') {
        if (!userData.marriages || userData.marriages.length === 0 || !userData.marriages[0].marriageDate) {
          return res.status(400).json({
            success: false,
            message: 'Marriage date is required when marital status is married'
          });
        }
      }

      // Set addedBy to current user if authenticated
      if (currentUserId) {
        userData.addedBy = currentUserId;
      }
      // If no authenticated user, addedBy will be null (which is now allowed)

      // Create new user
      const newUser = new User(userData);
      await newUser.save();

      // Populate role information
      await newUser.populate('role', 'name description permissions isActive');

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      console.error('Create user error:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          success: false,
          message: `${field} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }

  /**
   * Get user profile with full details
   */
  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .populate('role', 'name description permissions isActive')
        .populate('familyId', 'familyName')
        .populate('addedBy', 'firstName lastName email')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile',
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      const currentUserId = req.user.userId;

      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.password;
      delete updateData.role;
      delete updateData.isVerified;
      delete updateData.isActive;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).populate('role', 'name description permissions isActive');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user profile',
        error: error.message
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req, res) {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: error.message
      });
    }
  }

  /**
   * Get user family tree
   */
  async getUserFamilyTree(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .populate('familyId', 'familyName')
        .select('firstName lastName middleName fatherDetails motherDetails marriages children familyId');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get family members
      const familyMembers = await User.find({ familyId: user.familyId })
        .select('firstName lastName middleName fatherDetails motherDetails marriages children')
        .populate('role', 'name');

      // Build family tree structure
      const familyTree = {
        user: user,
        familyMembers: familyMembers,
        relationships: {
          parents: {
            father: user.fatherDetails,
            mother: user.motherDetails
          },
          spouse: user.getCurrentSpouse(),
          children: user.children,
          marriages: user.getMarriageHistory()
        }
      };

      res.json({
        success: true,
        data: familyTree
      });
    } catch (error) {
      console.error('Get family tree error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching family tree',
        error: error.message
      });
    }
  }

  /**
   * Search users by name with suggestions
   */
  async searchUsers(req, res) {
    try {
      const { q, excludeIds = [] } = req.query;
      const searchTerm = q || '';

      if (searchTerm.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const users = await User.searchByName(searchTerm, excludeIds.split(','));

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching users',
        error: error.message
      });
    }
  }

  /**
   * Get user suggestions for relationships
   */
  async getUserSuggestions(req, res) {
    try {
      const { type, q, excludeIds = [] } = req.query;
      const searchTerm = q || '';
      const excludeArray = excludeIds.split(',').filter(id => id);

      let suggestions = [];

      switch (type) {
        case 'father':
          suggestions = await User.getFatherSuggestions(searchTerm, excludeArray);
          break;
        case 'mother':
          suggestions = await User.getMotherSuggestions(searchTerm, excludeArray);
          break;
        case 'spouse':
          suggestions = await User.getSpouseSuggestions(searchTerm, excludeArray);
          break;
        case 'children':
          suggestions = await User.getChildrenSuggestions(searchTerm, excludeArray);
          break;
        default:
          suggestions = await User.searchByName(searchTerm, excludeArray);
      }

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Get user suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user suggestions',
        error: error.message
      });
    }
  }

  /**
   * Add family relationship
   */
  async addFamilyRelationship(req, res) {
    try {
      const { userId } = req.params;
      const { relationshipType, relatedUserId, relationshipData } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const relatedUser = await User.findById(relatedUserId);
      if (!relatedUser) {
        return res.status(404).json({
          success: false,
          message: 'Related user not found'
        });
      }

      let result;

      switch (relationshipType) {
        case 'child':
          result = user.addChild(
            relationshipData.childName,
            relationshipData.relationshipType,
            relationshipData.birthDate,
            relationshipData.fromWhichMarriage,
            relationshipData.otherParentId,
            relationshipData.otherParentName
          );
          break;
        case 'marriage':
          result = user.addMarriage(
            relationshipData.spouseDetails,
            relationshipData.marriageDate,
            relationshipData.marriageOrder
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid relationship type'
          });
      }

      await user.save();

      res.json({
        success: true,
        message: 'Family relationship added successfully',
        data: result
      });
    } catch (error) {
      console.error('Add family relationship error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding family relationship',
        error: error.message
      });
    }
  }

  /**
   * Get user statistics and analytics
   */
  async getUserAnalytics(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .populate('role', 'name')
        .select('firstName lastName role createdAt');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's family statistics
      const familyStats = await User.aggregate([
        { $match: { familyId: user.familyId } },
        {
          $group: {
            _id: null,
            totalFamilyMembers: { $sum: 1 },
            verifiedMembers: {
              $sum: { $cond: ['$isVerified', 1, 0] }
            },
            activeMembers: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);

      // Get user's role statistics
      const roleStats = await User.aggregate([
        { $match: { role: user.role._id } },
        {
          $group: {
            _id: null,
            totalUsersWithSameRole: { $sum: 1 }
          }
        }
      ]);

      const analytics = {
        user: {
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.name,
          memberSince: user.createdAt
        },
        family: familyStats[0] || {
          totalFamilyMembers: 0,
          verifiedMembers: 0,
          activeMembers: 0
        },
        role: roleStats[0] || {
          totalUsersWithSameRole: 0
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user analytics',
        error: error.message
      });
    }
  }

  /**
   * Verify user account
   */
  async verifyUser(req, res) {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isVerified },
        { new: true }
      ).populate('role', 'name');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user verification status',
        error: error.message
      });
    }
  }

  /**
   * Activate/Deactivate user account
   */
  async toggleUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      ).populate('role', 'name');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user status',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
