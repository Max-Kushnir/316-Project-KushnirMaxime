const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, username, password, avatar_image } = req.body;

    // Check if email already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await userModel.create(email, username, passwordHash, avatar_image);

    sendSuccess(res, 201, { user }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return token and user (without password_hash)
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_image: user.avatar_image
    };

    sendSuccess(res, 200, { token, user: userData }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // JWT logout is handled client-side by removing the token
    sendSuccess(res, 200, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const me = async (req, res, next) => {
  try {
    // req.user is set by authenticateToken middleware
    sendSuccess(res, 200, { user: req.user }, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  me
};
