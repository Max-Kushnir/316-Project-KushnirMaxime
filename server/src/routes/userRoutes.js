const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/users/:id
 * Get user profile (public access with optional auth)
 */
router.get(
  '/:id',
  optionalAuth,
  userController.getProfile
);

/**
 * PUT /api/users/profile
 * Update current user's profile (authenticated users only)
 */
router.put(
  '/profile',
  authenticateToken,
  userController.updateOwnProfile
);

/**
 * PUT /api/users/:id
 * Update user profile (authenticated users only, can only update own profile)
 */
router.put(
  '/:id',
  authenticateToken,
  userController.updateProfile
);

module.exports = router;
