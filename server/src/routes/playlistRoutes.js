const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { playlistCreateValidation, playlistUpdateValidation } = require('../utils/validators');

/**
 * GET /api/playlists
 * Get all playlists with optional filters and sorting
 * Query params: name, username, songTitle, songArtist, songYear, sortBy, sortOrder
 * Optional auth: logged in users see their own playlists by default
 */
router.get(
  '/',
  optionalAuth,
  playlistController.getAllPlaylists
);

/**
 * GET /api/playlists/:id
 * Get single playlist by ID with songs
 * Optional auth
 */
router.get(
  '/:id',
  optionalAuth,
  playlistController.getPlaylist
);

/**
 * POST /api/playlists
 * Create new playlist (requires authentication)
 * Body: { name? } - name is optional, defaults to "Untitled N"
 */
router.post(
  '/',
  authenticateToken,
  playlistCreateValidation,
  validateRequest,
  playlistController.createPlaylist
);

/**
 * PUT /api/playlists/:id
 * Update playlist name (requires authentication and ownership)
 * Body: { name }
 */
router.put(
  '/:id',
  authenticateToken,
  playlistUpdateValidation,
  validateRequest,
  playlistController.updatePlaylist
);

/**
 * DELETE /api/playlists/:id
 * Delete playlist (requires authentication and ownership)
 */
router.delete(
  '/:id',
  authenticateToken,
  playlistController.deletePlaylist
);

/**
 * POST /api/playlists/:id/copy
 * Copy playlist (deep copy with all songs)
 * Requires authentication
 */
router.post(
  '/:id/copy',
  authenticateToken,
  playlistController.copyPlaylist
);

/**
 * POST /api/playlists/:id/listen
 * Record unique listener
 * Optional auth: uses userId for logged in users, sessionId for guests
 * Body: { sessionId? } - optional for guests
 */
router.post(
  '/:id/listen',
  optionalAuth,
  playlistController.recordListener
);

/**
 * POST /api/playlists/:id/songs
 * Add song to playlist (requires authentication and ownership)
 * Body: { songId }
 */
router.post(
  '/:id/songs',
  authenticateToken,
  playlistController.addSongToPlaylist
);

/**
 * DELETE /api/playlists/:playlistId/songs/:songId
 * Remove song from playlist (requires authentication and ownership)
 */
router.delete(
  '/:playlistId/songs/:songId',
  authenticateToken,
  playlistController.removeSongFromPlaylist
);

/**
 * PUT /api/playlists/:id/songs/reorder
 * Reorder songs in playlist (requires authentication and ownership)
 * Body: { songIds: [] }
 */
router.put(
  '/:id/songs/reorder',
  authenticateToken,
  playlistController.reorderSongs
);

module.exports = router;
