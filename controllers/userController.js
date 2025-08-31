const User = require('../models/User');
const Role = require('../models/Role');

class UserController {
    /**
     * Get all users with role information
     */
    async getAllUsers(req, res) {
        try {
            const users = await User.find({})
                .populate('roleId', 'name description permissions')
                .select('-password')
                .sort({ createdAt: -1 });

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
                total: usersWithRoles.length
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
     * Get user by ID
     */
    async getUserById(req, res) {
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
     * Search users
     */
    async searchUsers(req, res) {
        try {
            const { query, role, verified, limit = 10, page = 1 } = req.query;

            let searchCriteria = {};

            // Text search
            if (query) {
                searchCriteria.$or = [
                    { username: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                    { firstName: { $regex: query, $options: 'i' } },
                    { lastName: { $regex: query, $options: 'i' } }
                ];
            }

            // Role filter
            if (role) {
                searchCriteria.role = role;
            }

            // Verification filter
            if (verified !== undefined) {
                searchCriteria.verified = verified === 'true';
            }

            const skip = (page - 1) * limit;

            const users = await User.find(searchCriteria)
                .populate('roleId', 'name description permissions')
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await User.countDocuments(searchCriteria);

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
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
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
     * Get user statistics
     */
    async getUserStats(req, res) {
        try {
            const totalUsers = await User.countDocuments();
            const verifiedUsers = await User.countDocuments({ verified: true });
            const unverifiedUsers = await User.countDocuments({ verified: false });
            const adminUsers = await User.countDocuments({ role: 'admin' });
            const memberUsers = await User.countDocuments({ role: 'member' });

            // Get users by role (with populated role names)
            const usersByRole = await User.aggregate([
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'roleInfo'
                    }
                },
                {
                    $group: {
                        _id: { $arrayElemAt: ['$roleInfo.name', 0] },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        roleName: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            ]);

            // Recent users (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentUsers = await User.countDocuments({
                createdAt: { $gte: sevenDaysAgo }
            });

            res.json({
                success: true,
                data: {
                    total: totalUsers,
                    verified: verifiedUsers,
                    unverified: unverifiedUsers,
                    admins: adminUsers,
                    members: memberUsers,
                    recent: recentUsers,
                    byRole: usersByRole
                }
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user statistics',
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

    /**
     * Delete user
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent deletion of admin users
            if (user.role === 'admin') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete admin users'
                });
            }

            await User.findByIdAndDelete(id);

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
}

module.exports = new UserController();
