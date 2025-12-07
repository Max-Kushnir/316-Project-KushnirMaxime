const { body } = require('express-validator');

/**
 * Validation schema for user registration
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

/**
 * Validation schema for user login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation schema for song creation/update
 */
const songValidation = [
  body('title')
    .notEmpty()
    .withMessage('Song title is required')
    .trim(),
  body('artist')
    .notEmpty()
    .withMessage('Artist name is required')
    .trim(),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be a valid year'),
  body('youtube_id')
    .notEmpty()
    .withMessage('YouTube ID is required')
];

/**
 * Validation schema for playlist creation (name is optional)
 */
const playlistCreateValidation = [
  body('name')
    .optional()
    .trim()
];

/**
 * Validation schema for playlist update (name is required)
 */
const playlistUpdateValidation = [
  body('name')
    .notEmpty()
    .withMessage('Playlist name is required')
    .trim()
];

module.exports = {
  registerValidation,
  loginValidation,
  songValidation,
  playlistCreateValidation,
  playlistUpdateValidation
};
