const bcrypt = require('bcryptjs');
const userService = require('../services/userService');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Get user profile by ID
 * GET /api/users/:id
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    // Find user by ID
    const user = await userService.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Return user data without password_hash
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_image: user.avatar_image
    };

    sendSuccess(res, 200, { user: userData }, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 * User can only update their own profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    // Check if user is updating their own profile
    if (req.user.id !== userId) {
      throw new AppError('You can only update your own profile', 403);
    }

    const { username, password, avatar_image, email } = req.body;

    // Prevent email update (Business Rule 11.1)
    if (email !== undefined) {
      throw new AppError('Email cannot be changed after account creation', 400);
    }

    // Build updates object
    const updates = {};

    if (username !== undefined) {
      updates.username = username;
    }

    if (avatar_image !== undefined) {
      updates.avatar_image = avatar_image;
    }

    // If password is being updated, validate and hash it
    if (password !== undefined) {
      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    // Check if there are any updates to make
    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    // Update user
    const updatedUser = await userService.update(userId, updates);

    if (!updatedUser) {
      throw new AppError('Failed to update user profile', 500);
    }

    // Return updated user data without password_hash
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar_image: updatedUser.avatar_image
    };

    sendSuccess(res, 200, { user: userData }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's own profile
 * PUT /api/users/profile
 * Uses req.user.id from authenticated user
 */
const updateOwnProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, password, avatar_image, email } = req.body;

    // Prevent email update (Business Rule 11.1)
    if (email !== undefined) {
      throw new AppError('Email cannot be changed after account creation', 400);
    }

    // Build updates object
    const updates = {};

    if (username !== undefined) {
      if (!username.trim()) {
        throw new AppError('Username cannot be empty', 400);
      }
      updates.username = username;
    }

    if (avatar_image !== undefined) {
      updates.avatar_image = avatar_image;
    }

    // If password is being updated, validate and hash it
    if (password !== undefined && password !== '') {
      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    // Check if there are any updates to make
    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    // Update user
    const updatedUser = await userService.update(userId, updates);

    if (!updatedUser) {
      throw new AppError('Failed to update user profile', 500);
    }

    // Return updated user data without password_hash
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar_image: updatedUser.avatar_image
    };

    sendSuccess(res, 200, { user: userData }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateOwnProfile
};
