const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
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

        // Verify token
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                // Handle different types of JWT errors
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token has expired. Please login again.'
                    });
                } else if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token. Please provide a valid token.'
                    });
                } else {
                    return res.status(401).json({
                        success: false,
                        message: 'Token verification failed.'
                    });
                }
            }

            try {
                // Check if user still exists in database
                const user = await User.findById(decoded.userId);

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found. Token may be invalid.'
                    });
                }

                // Check if user is still verified
                if (!user.verified) {
                    return res.status(403).json({
                        success: false,
                        message: 'Account not verified. Please verify your account.'
                    });
                }

                // Attach user information to request object
                req.user = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role,
                    email: decoded.email
                };

                next();
            } catch (dbError) {
                console.error('Database error in auth middleware:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error during authentication.'
                });
            }
        });

    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.'
        });
    }
};

/**
 * Role-based authorization middleware
 * @param {String|Array} requiredRoles - Single role or array of roles that are allowed
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (requiredRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login first.'
                });
            }

            // Convert single role to array for consistent handling
            const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error('Authorization middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authorization.'
            });
        }
    };
};

/**
 * Admin-only authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeAdmin = (req, res, next) => {
    return authorizeRoles('admin')(req, res, next);
};

/**
 * Member-only authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeMember = (req, res, next) => {
    return authorizeRoles('member')(req, res, next);
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        // Try to verify token
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                // Invalid token, continue without authentication
                req.user = null;
                return next();
            }

            try {
                const user = await User.findById(decoded.userId);

                if (user && user.verified) {
                    req.user = {
                        userId: decoded.userId,
                        username: decoded.username,
                        role: decoded.role,
                        email: decoded.email
                    };
                } else {
                    req.user = null;
                }

                next();
            } catch (dbError) {
                console.error('Database error in optional auth middleware:', dbError);
                req.user = null;
                next();
            }
        });

    } catch (error) {
        console.error('Optional authentication middleware error:', error);
        req.user = null;
        next();
    }
};

/**
 * Rate limiting middleware (basic implementation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rateLimiter = (req, res, next) => {
    // This is a basic implementation
    // In production, use a proper rate limiting library like express-rate-limit

    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Simple in-memory store (not suitable for production with multiple instances)
    if (!req.app.locals.rateLimitStore) {
        req.app.locals.rateLimitStore = new Map();
    }

    const store = req.app.locals.rateLimitStore;
    const key = `${clientIP}:${req.path}`;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max 100 requests per window

    const current = store.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > current.resetTime) {
        current.count = 1;
        current.resetTime = now + windowMs;
    } else {
        current.count++;
    }

    store.set(key, current);

    if (current.count > maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeAdmin,
    authorizeMember,
    optionalAuth,
    rateLimiter
};
