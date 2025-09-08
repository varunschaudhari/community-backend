const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemUser = require('../models/SystemUser');

// JWT Secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SYSTEM_JWT_SECRET = process.env.SYSTEM_JWT_SECRET || 'system-secret-key-change-in-production';

/**
 * Unified authentication middleware that handles both community and system users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateUnifiedToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required. Please provide a valid token in the Authorization header.'
            });
        }

        let decoded;
        let user;
        let userType;

        // Try to verify with community user secret first
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            user = await User.findById(decoded.userId);
            if (user) {
                userType = 'community';
            }
        } catch (communityError) {
            // If community verification fails, try system user secret
            try {
                decoded = jwt.verify(token, SYSTEM_JWT_SECRET);
                user = await SystemUser.findById(decoded.userId);
                if (user) {
                    userType = 'system';
                }
            } catch (systemError) {
                // Both verifications failed
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please provide a valid token.'
                });
            }
        }

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Get permissions from database based on role
        let permissions = [];
        try {
            const Role = require('../models/Role');
            const role = await Role.findOne({ name: user.role, isActive: true });
            if (role) {
                permissions = role.permissions || [];
            }
        } catch (error) {
            console.error('Error fetching role permissions:', error);
            permissions = [];
        }

        // Add user info to request object
        req.user = {
            userId: user._id,
            username: user.username,
            email: user.email,
            userType: userType,
            role: user.role,
            accessLevel: user.accessLevel,
            permissions: permissions
        };

        next();
    } catch (error) {
        console.error('Unified auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

module.exports = {
    authenticateUnifiedToken
};
