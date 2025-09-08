const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT Token expiration time (24 hours)
const JWT_EXPIRES_IN = '24h';

/**
 * Login controller function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

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
        const mobileRegex = /^[0-9]{10}$/;
        if (mobileRegex.test(trimmedUsername)) {
            // It's a mobile number, no length validation needed
        } else if (trimmedUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters long'
            });
        }

        if (trimmedPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find user by username or mobile number
        // First try to find by mobile number (if it's a 10-digit number)
        let user;
        if (mobileRegex.test(trimmedUsername)) {
            // It's a mobile number, find by phone
            user = await User.findByMobile(trimmedUsername);
        } else {
            // It's a username, find by username (case-insensitive)
            user = await User.findByUsername(trimmedUsername.toLowerCase());
        }

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is verified
        if (!user.verified) {
            return res.status(403).json({
                success: false,
                message: 'Account not verified. Please verify your account before logging in.'
            });
        }

        // Compare password with hashed password
        const isPasswordValid = await user.comparePassword(trimmedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const tokenPayload = {
            userId: user._id,
            username: user.username,
            role: user.role,
            email: user.email
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        // Prepare user data for response (without password)
        const userData = user.getPublicProfile();

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userData,
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Register controller function (bonus)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        // Input validation
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and email are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByUsername(username.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await User.findByEmail(email.toLowerCase());
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Create new user
        const newUser = new User({
            username: username.toLowerCase(),
            password,
            email: email.toLowerCase(),
            firstName,
            lastName,
            verified: true, // Set to true for demo, in production this should be false initially
            // Provide default values for optional fields
            phone: req.body.phone || '0000000000', // Default phone number
            maritalStatus: req.body.maritalStatus || 'Single', // Default marital status
            dateOfBirth: req.body.dateOfBirth || new Date('1990-01-01'), // Default date of birth
            role: req.body.role || 'Member' // Default role
        });

        await newUser.save();

        // Generate JWT token for auto-login after registration
        const tokenPayload = {
            userId: newUser._id,
            username: newUser.username,
            role: newUser.role,
            email: newUser.email
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        // Return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: newUser.getPublicProfile(),
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

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
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: user.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Logout controller function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // by removing the token. However, you could implement a blacklist
        // or use refresh tokens for more security.

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

/**
 * Validate token endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateToken = async (req, res) => {
    try {
        // Get full user data from database
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Token is valid',
            data: {
                user: user.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};

module.exports = {
    login,
    register,
    getProfile,
    logout,
    validateToken
};
