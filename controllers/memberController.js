const Member = require('../models/Member');
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

      // Check if member with email already exists
      const existingMember = await Member.findOne({ email: email.toLowerCase() });
      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: 'Member with this email already exists'
        });
      }

      // Check if member with phone already exists
      const existingPhone = await Member.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Member with this phone number already exists'
        });
      }

      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new member
      const memberData = {
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
        roles,
        kul,
        gotra,
        fatherName,
        motherName,
        childrenName
      };

      // Add date of marriage if provided and marital status is married
      if (dateOfMarriage && maritalStatus === 'Married') {
        memberData.dateOfMarriage = new Date(dateOfMarriage);
      }

      const member = new Member(memberData);
      await member.save();

      // Remove password from response
      const memberResponse = member.toObject();
      delete memberResponse.password;

      res.status(201).json({
        success: true,
        message: 'Member created successfully',
        data: memberResponse
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
   * Get all members (with pagination and filtering)
   */
  async getAllMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        isVerified,
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
        filter.roles = role;
      }

      // Add verification filter
      if (isVerified !== undefined) {
        filter.isVerified = isVerified === 'true';
      }

      // Add active filter
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const members = await Member.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Member.countDocuments(filter);

      res.json({
        success: true,
        data: members,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get all members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch members',
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

      const member = await Member.findById(id).select('-password');
      
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        data: member
      });

    } catch (error) {
      console.error('Get member by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch member',
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

      const member = await Member.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member updated successfully',
        data: member
      });

    } catch (error) {
      console.error('Update member error:', error);
      
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
        message: 'Failed to update member',
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

      const member = await Member.findByIdAndDelete(id);
      
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member deleted successfully'
      });

    } catch (error) {
      console.error('Delete member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete member',
        error: error.message
      });
    }
  }

  /**
   * Search members for autocomplete
   */
  async searchMembers(req, res) {
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

      const members = await Member.find({
        [searchField]: { $regex: q, $options: 'i' },
        isActive: true
      })
      .select(`${searchField} firstName lastName`)
      .limit(10);

      const results = members.map(member => ({
        id: member._id,
        name: member[searchField] || `${member.firstName} ${member.lastName}`,
        type
      }));

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Search members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search members',
        error: error.message
      });
    }
  }

  /**
   * Verify member
   */
  async verifyMember(req, res) {
    try {
      const { id } = req.params;

      const member = await Member.findByIdAndUpdate(
        id,
        { isVerified: true },
        { new: true }
      ).select('-password');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member verified successfully',
        data: member
      });

    } catch (error) {
      console.error('Verify member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify member',
        error: error.message
      });
    }
  }

  /**
   * Get member statistics
   */
  async getMemberStats(req, res) {
    try {
      const totalMembers = await Member.countDocuments();
      const verifiedMembers = await Member.countDocuments({ isVerified: true });
      const activeMembers = await Member.countDocuments({ isActive: true });
      
      const roleStats = await Member.aggregate([
        {
          $group: {
            _id: '$roles',
            count: { $sum: 1 }
          }
        }
      ]);

      const maritalStats = await Member.aggregate([
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
          total: totalMembers,
          verified: verifiedMembers,
          active: activeMembers,
          unverified: totalMembers - verifiedMembers,
          inactive: totalMembers - activeMembers,
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
}

module.exports = new MemberController();
