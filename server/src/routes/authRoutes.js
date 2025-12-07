const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { registerValidation, loginValidation } = require('../utils/validators');

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post(
  '/register',
  registerValidation,
  validateRequest,
  authController.register
);

/**
 * POST /api/auth/login
 * Login and receive JWT token
 */
router.post(
  '/login',
  loginValidation,
  validateRequest,
  authController.login
);

/**
 * POST /api/auth/logout
 * Invalidate token (client-side)
 */
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticateToken,
  authController.me
);

module.exports = router;
