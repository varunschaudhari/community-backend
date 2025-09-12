const SystemUser = require('../models/SystemUser');

/**
 * Get all system users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSystemUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, department, role, isActive } = req.query;

        // Build filter object
        const filter = {};
        if (department) filter.department = department;
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get system users with pagination
        const systemUsers = await SystemUser.find(filter)
            .select('-password -twoFactorSecret -loginAttempts -lockUntil')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await SystemUser.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                systemUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalUsers: total,
                    hasNext: skip + systemUsers.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all system users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Get system user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const systemUser = await SystemUser.findById(id)
            .select('-password -twoFactorSecret -loginAttempts -lockUntil');

        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                systemUser
            }
        });

    } catch (error) {
        console.error('Get system user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Update system user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSystemUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove sensitive fields that shouldn't be updated directly
        delete updateData.password;
        delete updateData.twoFactorSecret;
        delete updateData.loginAttempts;
        delete updateData.lockUntil;
        delete updateData.createdBy;

        // Check if system user exists
        const systemUser = await SystemUser.findById(id);
        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Update system user
        const updatedSystemUser = await SystemUser.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -twoFactorSecret -loginAttempts -lockUntil');

        res.status(200).json({
            success: true,
            message: 'System user updated successfully',
            data: {
                systemUser: updatedSystemUser
            }
        });

    } catch (error) {
        console.error('Update system user error:', error);

        // Handle Mongoose validation errors
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
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Deactivate system user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deactivateSystemUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if system user exists
        const systemUser = await SystemUser.findById(id);
        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Prevent self-deactivation
        if (systemUser._id.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }

        // Deactivate system user
        systemUser.isActive = false;
        await systemUser.save();

        res.status(200).json({
            success: true,
            message: 'System user deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate system user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Activate system user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const activateSystemUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if system user exists
        const systemUser = await SystemUser.findById(id);
        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Activate system user
        systemUser.isActive = true;
        await systemUser.save();

        res.status(200).json({
            success: true,
            message: 'System user activated successfully'
        });

    } catch (error) {
        console.error('Activate system user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Reset system user password (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetSystemUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 12 characters long'
            });
        }

        // Check if system user exists
        const systemUser = await SystemUser.findById(id);
        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Update password
        systemUser.password = newPassword;
        systemUser.lastPasswordChange = new Date();
        systemUser.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
        systemUser.loginAttempts = 0;
        systemUser.lockUntil = undefined;
        await systemUser.save();

        res.status(200).json({
            success: true,
            message: 'System user password reset successfully'
        });

    } catch (error) {
        console.error('Reset system user password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Get system user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemUserStats = async (req, res) => {
    try {
        const stats = await SystemUser.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    verifiedUsers: {
                        $sum: { $cond: [{ $eq: ['$verified', true] }, 1, 0] }
                    },
                    lockedUsers: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$lockUntil', null] }, { $gt: ['$lockUntil', new Date()] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const departmentStats = await SystemUser.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const roleStats = await SystemUser.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalUsers: 0,
                    activeUsers: 0,
                    verifiedUsers: 0,
                    lockedUsers: 0
                },
                departmentStats,
                roleStats
            }
        });

    } catch (error) {
        console.error('Get system user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Search system users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchSystemUsers = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchQuery = q.trim();
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build search filter
        const filter = {
            $or: [
                { username: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { employeeId: { $regex: searchQuery, $options: 'i' } },
                { firstName: { $regex: searchQuery, $options: 'i' } },
                { lastName: { $regex: searchQuery, $options: 'i' } },
                { department: { $regex: searchQuery, $options: 'i' } },
                { designation: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        // Search system users
        const systemUsers = await SystemUser.find(filter)
            .select('-password -twoFactorSecret -loginAttempts -lockUntil')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await SystemUser.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                systemUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalResults: total,
                    hasNext: skip + systemUsers.length < total,
                    hasPrev: parseInt(page) > 1
                },
                searchQuery
            }
        });

    } catch (error) {
        console.error('Search system users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

module.exports = {
    getAllSystemUsers,
    getSystemUserById,
    updateSystemUser,
    deactivateSystemUser,
    activateSystemUser,
    resetSystemUserPassword,
    getSystemUserStats,
    searchSystemUsers
};
