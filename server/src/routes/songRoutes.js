const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const { authenticateToken } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { songValidation } = require('../utils/validators');

/**
 * GET /api/songs
 * Get all songs with optional filters and sorting
 * Query params: title, artist, year, sortBy, sortOrder
 */
router.get(
  '/',
  songController.getAllSongs
);

/**
 * GET /api/songs/:id
 * Get single song by ID
 */
router.get(
  '/:id',
  songController.getSong
);

/**
 * POST /api/songs
 * Create new song (requires authentication)
 */
router.post(
  '/',
  authenticateToken,
  songValidation,
  validateRequest,
  songController.createSong
);

/**
 * PUT /api/songs/:id
 * Update song (requires authentication and ownership)
 */
router.put(
  '/:id',
  authenticateToken,
  songValidation,
  validateRequest,
  songController.updateSong
);

/**
 * DELETE /api/songs/:id
 * Delete song (requires authentication and ownership)
 */
router.delete(
  '/:id',
  authenticateToken,
  songController.deleteSong
);

/**
 * POST /api/songs/:id/copy
 * Copy song (requires authentication)
 */
router.post(
  '/:id/copy',
  authenticateToken,
  songController.copySong
);

module.exports = router;
