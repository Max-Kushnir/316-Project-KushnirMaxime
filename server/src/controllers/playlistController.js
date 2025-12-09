const playlistService = require('../services/playlistService');
const playlistSongService = require('../services/playlistSongService');
const playlistListenerService = require('../services/playlistListenerService');
const songService = require('../services/songService');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all playlists with optional search filters and sorting
 * GET /api/playlists
 */
const getAllPlaylists = async (req, res, next) => {
  try {
    const { name, username, songTitle, songArtist, songYear, sortBy, sortOrder } = req.query;

    const filters = {};
    if (name) filters.name = name;
    if (username) filters.username = username;
    if (songTitle) filters.songTitle = songTitle;
    if (songArtist) filters.songArtist = songArtist;
    if (songYear) filters.songYear = parseInt(songYear);

    const userId = req.user ? req.user.id : null;

    const playlists = await playlistService.findAll(
      filters,
      sortBy || 'created_at',
      sortOrder?.toUpperCase() || 'DESC',
      userId
    );

    sendSuccess(res, 200, { playlists }, 'Playlists retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single playlist by ID with songs
 * GET /api/playlists/:id
 */
const getPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const playlist = await playlistService.findById(parseInt(id));
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }

    sendSuccess(res, 200, { playlist }, 'Playlist retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new playlist
 * POST /api/playlists
 */
const createPlaylist = async (req, res, next) => {
  try {
    let { name } = req.body;
    const ownerId = req.user.id;

    // If no name provided, generate "Untitled N" name
    if (!name || name.trim() === '') {
      name = await playlistService.getNextUntitledName(ownerId);
    } else {
      // Check uniqueness for this user
      const existing = await playlistService.findByOwnerAndName(ownerId, name);
      if (existing) {
        throw new AppError('You already have a playlist with this name', 409);
      }
    }

    const playlist = await playlistService.create(name, ownerId);

    // Attach owner info for immediate UI display (avoids extra DB query)
    const playlistWithOwner = {
      ...playlist,
      owner: {
        username: req.user.username
      },
      owner_username: req.user.username,
      song_count: 0  // New playlist has no songs
    };

    sendSuccess(res, 201, { playlist: playlistWithOwner }, 'Playlist created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update playlist name
 * PUT /api/playlists/:id
 */
const updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if playlist exists
    const existingPlaylist = await playlistService.findById(parseInt(id));
    if (!existingPlaylist) {
      throw new AppError('Playlist not found', 404);
    }

    // Check if user is the owner
    if (existingPlaylist.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to update this playlist', 403);
    }

    // Check uniqueness for this user (if name is changing)
    if (name !== existingPlaylist.name) {
      const duplicate = await playlistService.findByOwnerAndName(req.user.id, name);
      if (duplicate && duplicate.id !== parseInt(id)) {
        throw new AppError('You already have a playlist with this name', 409);
      }
    }

    const playlist = await playlistService.update(parseInt(id), name);

    sendSuccess(res, 200, { playlist }, 'Playlist updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete playlist
 * DELETE /api/playlists/:id
 */
const deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if playlist exists
    const existingPlaylist = await playlistService.findById(parseInt(id));
    if (!existingPlaylist) {
      throw new AppError('Playlist not found', 404);
    }

    // Check if user is the owner
    if (existingPlaylist.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to delete this playlist', 403);
    }

    await playlistService.deleteById(parseInt(id));

    sendSuccess(res, 200, null, 'Playlist deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Copy playlist (deep copy with all songs)
 * POST /api/playlists/:id/copy
 */
const copyPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    // Get original playlist with songs
    const originalPlaylist = await playlistService.findById(parseInt(id));
    if (!originalPlaylist) {
      throw new AppError('Playlist not found', 404);
    }

    // Generate unique name for the copy
    let copyName = `${originalPlaylist.name} (Copy)`;
    let existing = await playlistService.findByOwnerAndName(ownerId, copyName);
    let counter = 1;

    while (existing) {
      copyName = `${originalPlaylist.name} (Copy ${counter})`;
      existing = await playlistService.findByOwnerAndName(ownerId, copyName);
      counter++;
    }

    // Create new playlist
    const newPlaylist = await playlistService.create(copyName, ownerId);

    // Copy all songs (deep copy)
    for (const ps of originalPlaylist.playlist_songs) {
      await playlistSongService.addSong(newPlaylist.id, ps.song.id);
    }

    // Fetch complete playlist with songs
    const playlist = await playlistService.findById(newPlaylist.id);

    sendSuccess(res, 201, { playlist }, 'Playlist copied successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Record unique listener for playlist
 * POST /api/playlists/:id/listen
 */
const recordListener = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if playlist exists
    const playlist = await playlistService.findById(parseInt(id));
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }

    // Generate listener identifier (userId or sessionId)
    let listenerIdentifier;
    if (req.user) {
      listenerIdentifier = `user_${req.user.id}`;
    } else {
      // For guests, use or generate session ID
      listenerIdentifier = req.body.sessionId || `guest_${uuidv4()}`;
    }

    const isNewListener = await playlistListenerService.recordListener(
      parseInt(id),
      listenerIdentifier
    );

    sendSuccess(
      res,
      200,
      { isNewListener, listenerIdentifier },
      isNewListener ? 'Listener recorded' : 'Listener already recorded'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add song to playlist
 * POST /api/playlists/:id/songs
 */
const addSongToPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    if (!songId) {
      throw new AppError('Song ID is required', 400);
    }

    // Check if playlist exists
    const playlist = await playlistService.findById(parseInt(id));
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }

    // Check if user is the owner
    if (playlist.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to modify this playlist', 403);
    }

    // Check if song exists
    const song = await songService.findById(parseInt(songId));
    if (!song) {
      throw new AppError('Song not found', 404);
    }

    // Check if song already in playlist
    const alreadyExists = await playlistSongService.songExistsInPlaylist(
      parseInt(id),
      parseInt(songId)
    );
    if (alreadyExists) {
      throw new AppError('Song already in playlist', 409);
    }

    await playlistSongService.addSong(parseInt(id), parseInt(songId));

    // Return updated playlist
    const updatedPlaylist = await playlistService.findById(parseInt(id));

    sendSuccess(res, 201, { playlist: updatedPlaylist }, 'Song added to playlist');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove song from playlist
 * DELETE /api/playlists/:playlistId/songs/:songId
 */
const removeSongFromPlaylist = async (req, res, next) => {
  try {
    const { playlistId, songId } = req.params;

    // Check if playlist exists
    const playlist = await playlistService.findById(parseInt(playlistId));
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }

    // Check if user is the owner
    if (playlist.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to modify this playlist', 403);
    }

    const removed = await playlistSongService.removeSong(
      parseInt(playlistId),
      parseInt(songId)
    );

    if (!removed) {
      throw new AppError('Song not found in playlist', 404);
    }

    // Return updated playlist
    const updatedPlaylist = await playlistService.findById(parseInt(playlistId));

    sendSuccess(res, 200, { playlist: updatedPlaylist }, 'Song removed from playlist');
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder songs in playlist
 * PUT /api/playlists/:id/songs/reorder
 */
const reorderSongs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { songIds } = req.body;

    if (!songIds || !Array.isArray(songIds)) {
      throw new AppError('songIds array is required', 400);
    }

    // Check if playlist exists
    const playlist = await playlistService.findById(parseInt(id));
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }

    // Check if user is the owner
    if (playlist.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to modify this playlist', 403);
    }

    // Verify all songs exist in playlist
    const currentSongs = await playlistSongService.findByPlaylistId(parseInt(id));
    const currentSongIds = currentSongs.map(s => s.id);

    if (songIds.length !== currentSongIds.length) {
      throw new AppError('Song IDs count mismatch', 400);
    }

    for (const songId of songIds) {
      if (!currentSongIds.includes(songId)) {
        throw new AppError(`Song ${songId} not found in playlist`, 400);
      }
    }

    await playlistSongService.reorderSongs(parseInt(id), songIds);

    // Return updated playlist
    const updatedPlaylist = await playlistService.findById(parseInt(id));

    sendSuccess(res, 200, { playlist: updatedPlaylist }, 'Songs reordered successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  copyPlaylist,
  recordListener,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderSongs
};
