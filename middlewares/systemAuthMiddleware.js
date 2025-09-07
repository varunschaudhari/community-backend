const jwt = require('jsonwebtoken');
const SystemUser = require('../models/SystemUser');

// JWT Secret for system users
const SYSTEM_JWT_SECRET = process.env.SYSTEM_JWT_SECRET || 'system-secret-key-change-in-production';

/**
 * Middleware to authenticate system user JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateSystemToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required for system access'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, SYSTEM_JWT_SECRET);

        // Check if user still exists and is active
        const systemUser = await SystemUser.findById(decoded.userId);
        if (!systemUser) {
            return res.status(401).json({
                success: false,
                message: 'System user not found'
            });
        }

        // Check if user can access system
        if (!systemUser.canAccessSystem()) {
            return res.status(403).json({
                success: false,
                message: 'System access denied. Account may be locked, inactive, or password expired.'
            });
        }

        // Add user info to request object
        req.user = {
            userId: systemUser._id,
            username: systemUser.username,
            systemRole: systemUser.systemRole,
            accessLevel: systemUser.accessLevel,
            employeeId: systemUser.employeeId,
            department: systemUser.department,
            permissions: systemUser.permissions,
            userType: 'system'
        };

        next();

    } catch (error) {
        console.error('System authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid system token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'System token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'System authentication failed'
        });
    }
};

/**
 * Middleware to authorize system user roles
 * @param {String|Array} allowedRoles - Role(s) that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorizeSystemRoles = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user || req.user.userType !== 'system') {
                return res.status(401).json({
                    success: false,
                    message: 'System authentication required'
                });
            }

            const userRole = req.user.systemRole;
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${roles.join(' or ')}`
                });
            }

            next();

        } catch (error) {
            console.error('System authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'System authorization failed'
            });
        }
    };
};

/**
 * Middleware to authorize system user access levels
 * @param {Number} requiredLevel - Minimum access level required
 * @returns {Function} Express middleware function
 */
const authorizeSystemAccessLevel = (requiredLevel) => {
    return (req, res, next) => {
        try {
            if (!req.user || req.user.userType !== 'system') {
                return res.status(401).json({
                    success: false,
                    message: 'System authentication required'
                });
            }

            const userAccessLevel = req.user.accessLevel;

            if (userAccessLevel < requiredLevel) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required access level: ${requiredLevel}`
                });
            }

            next();

        } catch (error) {
            console.error('System access level authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'System access level authorization failed'
            });
        }
    };
};

/**
 * Middleware to authorize system user permissions
 * @param {String|Array} requiredPermissions - Permission(s) required to access the route
 * @returns {Function} Express middleware function
 */
const authorizeSystemPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user || req.user.userType !== 'system') {
                return res.status(401).json({
                    success: false,
                    message: 'System authentication required'
                });
            }

            const userPermissions = req.user.permissions || [];
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

            // Check if user has at least one of the required permissions
            const hasPermission = permissions.some(permission => userPermissions.includes(permission));

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required permission: ${permissions.join(' or ')}`
                });
            }

            next();

        } catch (error) {
            console.error('System permission authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'System permission authorization failed'
            });
        }
    };
};

/**
 * Rate limiter for system authentication endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const systemRateLimiter = (req, res, next) => {
    // Simple in-memory rate limiting (in production, use Redis)
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5; // 5 attempts per window

    // Initialize rate limit store if it doesn't exist
    if (!global.systemRateLimitStore) {
        global.systemRateLimitStore = new Map();
    }

    const key = `system_auth_${clientIP}`;
    const attempts = global.systemRateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > attempts.resetTime) {
        attempts.count = 0;
        attempts.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (attempts.count >= maxAttempts) {
        return res.status(429).json({
            success: false,
            message: 'Too many system authentication attempts. Please try again later.',
            retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
        });
    }

    // Increment attempt count
    attempts.count++;
    global.systemRateLimitStore.set(key, attempts);

    next();
};

module.exports = {
    authenticateSystemToken,
    authorizeSystemRoles,
    authorizeSystemAccessLevel,
    authorizeSystemPermissions,
    systemRateLimiter
};
