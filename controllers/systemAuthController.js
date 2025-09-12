const jwt = require('jsonwebtoken');
const SystemUser = require('../models/SystemUser');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SYSTEM_JWT_SECRET = process.env.SYSTEM_JWT_SECRET || 'system-secret-key-change-in-production';

// JWT Token expiration time (8 hours for system users - shorter for security)
const SYSTEM_JWT_EXPIRES_IN = '8h';

/**
 * System User Login controller function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const systemLogin = async (req, res) => {
    try {
        const { username, password, employeeId } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
                errors: {
                    username: !username ? 'Username is required' : undefined,
                    password: !password ? 'Password is required' : undefined
                }
            });
        }

        // Trim whitespace from inputs
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        // Additional validation
        if (trimmedUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters long'
            });
        }

        if (trimmedPassword.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'System user password must be at least 12 characters long'
            });
        }

        // Find system user by username (case-insensitive)
        const systemUser = await SystemUser.findByUsername(trimmedUsername.toLowerCase());

        console.log(systemUser);
        console.log(trimmedUsername);

        // Check if user exists
        if (!systemUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid system credentials'
            });
        }

        // Check if user is locked
        if (systemUser.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }

        // Check if user is verified
        if (!systemUser.verified) {
            return res.status(403).json({
                success: false,
                message: 'System account not verified. Please contact system administrator.'
            });
        }

        // Check if user is active
        if (!systemUser.isActive) {
            return res.status(403).json({
                success: false,
                message: 'System account is deactivated. Please contact system administrator.'
            });
        }

        // Check if password is expired
        if (systemUser.isPasswordExpired()) {
            return res.status(403).json({
                success: false,
                message: 'Password has expired. Please contact system administrator to reset password.'
            });
        }

        // Compare password with hashed password
        const isPasswordValid = await systemUser.comparePassword(trimmedPassword);

        console.log(isPasswordValid);
        console.log(trimmedPassword);
        console.log(systemUser.password);

        if (!isPasswordValid) {
            // Increment login attempts
            await systemUser.incLoginAttempts();

            return res.status(401).json({
                success: false,
                message: 'Invalid system credentials'
            });
        }

        // Reset login attempts on successful login
        await systemUser.resetLoginAttempts();

        // Update last login timestamp and IP
        systemUser.lastLogin = new Date();
        systemUser.lastLoginIP = req.ip || req.connection.remoteAddress;
        await systemUser.save();

        // Generate JWT token with system-specific payload
        const tokenPayload = {
            userId: systemUser._id,
            username: systemUser.username,
            role: systemUser.role,
            accessLevel: systemUser.accessLevel,
            employeeId: systemUser.employeeId,
            department: systemUser.department,
            permissions: systemUser.permissions,
            userType: 'system'
        };

        const token = jwt.sign(tokenPayload, SYSTEM_JWT_SECRET, {
            expiresIn: SYSTEM_JWT_EXPIRES_IN
        });

        // Prepare user data for response (without sensitive data)
        const userData = systemUser.getPublicProfile();

        // Return success response
        res.status(200).json({
            success: true,
            message: 'System login successful',
            data: {
                token,
                user: userData,
                expiresIn: SYSTEM_JWT_EXPIRES_IN,
                userType: 'system'
            }
        });

    } catch (error) {
        console.error('System login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * System User Register controller function (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const systemRegister = async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            employeeId,
            department,
            designation,
            firstName,
            lastName,
            phone,
            systemRole,
            accessLevel
        } = req.body;

        // Input validation
        if (!username || !password || !email || !employeeId || !department || !designation) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, email, employee ID, department, and designation are required'
            });
        }

        // Check if user already exists
        const existingUser = await SystemUser.findByUsername(username.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await SystemUser.findByEmail(email.toLowerCase());
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Check if employee ID already exists
        const existingEmployeeId = await SystemUser.findByEmployeeId(employeeId);
        if (existingEmployeeId) {
            return res.status(409).json({
                success: false,
                message: 'Employee ID already exists'
            });
        }

        // Get permissions from role
        const Role = require('../models/Role');
        const role = await Role.findOne({ name: systemRole || 'Member', isActive: true });
        const rolePermissions = role ? role.permissions || [] : [];

        // Create new system user
        const newSystemUser = new SystemUser({
            username: username.toLowerCase(),
            password,
            email: email.toLowerCase(),
            employeeId: employeeId.toUpperCase(),
            department,
            designation,
            firstName,
            lastName,
            phone: phone || '0000000000',
            role: systemRole || 'Member',
            accessLevel: accessLevel || 1,
            permissions: rolePermissions, // Get permissions from role
            verified: true, // System users are verified by default
            createdBy: req.user.userId // Assuming the creator is authenticated
        });

        await newSystemUser.save();

        // Generate JWT token for auto-login after registration
        const tokenPayload = {
            userId: newSystemUser._id,
            username: newSystemUser.username,
            role: newSystemUser.role,
            accessLevel: newSystemUser.accessLevel,
            employeeId: newSystemUser.employeeId,
            department: newSystemUser.department,
            permissions: newSystemUser.permissions,
            userType: 'system'
        };

        const token = jwt.sign(tokenPayload, SYSTEM_JWT_SECRET, {
            expiresIn: SYSTEM_JWT_EXPIRES_IN
        });

        // Return success response
        res.status(201).json({
            success: true,
            message: 'System user registered successfully',
            data: {
                token,
                user: newSystemUser.getPublicProfile(),
                expiresIn: SYSTEM_JWT_EXPIRES_IN,
                userType: 'system'
            }
        });

    } catch (error) {
        console.error('System registration error:', error);

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
 * Get current system user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemProfile = async (req, res) => {
    try {
        const systemUser = await SystemUser.findById(req.user.userId);

        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: systemUser.getPublicProfile(),
                userType: 'system'
            }
        });

    } catch (error) {
        console.error('Get system profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * System User Logout controller function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const systemLogout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // by removing the token. However, you could implement a blacklist
        // or use refresh tokens for more security.

        res.status(200).json({
            success: true,
            message: 'System logout successful'
        });

    } catch (error) {
        console.error('System logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Validate system token endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateSystemToken = async (req, res) => {
    try {
        // Get full system user data from database
        const systemUser = await SystemUser.findById(req.user.userId);

        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'System token is valid',
            data: {
                user: systemUser.getPublicProfile(),
                userType: 'system'
            }
        });

    } catch (error) {
        console.error('System token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Change system user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changeSystemPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 12 characters long'
            });
        }

        const systemUser = await SystemUser.findById(req.user.userId);
        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await systemUser.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        systemUser.password = newPassword;
        systemUser.lastPasswordChange = new Date();
        systemUser.passwordExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
        await systemUser.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change system password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Reset System User (Temporary endpoint for development)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetSystemUser = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Find and reset the system user
        const systemUser = await SystemUser.findOne({ username: username.toLowerCase() });

        if (!systemUser) {
            return res.status(404).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Reset rate limiting and account status
        systemUser.loginAttempts = 0;
        systemUser.lastLoginAttempt = null;
        systemUser.isLocked = false;
        systemUser.verified = true;
        systemUser.isActive = true;
        systemUser.updatedAt = new Date();

        await systemUser.save();

        res.status(200).json({
            success: true,
            message: 'System user reset successfully',
            user: {
                username: systemUser.username,
                email: systemUser.email,
                systemRole: systemUser.systemRole,
                verified: systemUser.verified,
                isActive: systemUser.isActive,
                loginAttempts: systemUser.loginAttempts,
                isLocked: systemUser.isLocked
            }
        });

    } catch (error) {
        console.error('Reset system user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

module.exports = {
    systemLogin,
    systemRegister,
    getSystemProfile,
    systemLogout,
    validateSystemToken,
    changeSystemPassword,
    resetSystemUser
};
