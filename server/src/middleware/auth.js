const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const userService = require('../services/userService');

/**
 * Middleware to authenticate JWT token
 * Requires valid token in HTTP-only cookie
 */
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const user = await userService.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Attach user to request (exclude password_hash)
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_image: user.avatar_image
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Sets req.user to null for guests if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const user = await userService.findById(decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_image: user.avatar_image
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, treat as guest
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
