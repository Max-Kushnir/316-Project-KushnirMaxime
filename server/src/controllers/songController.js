const songService = require('../services/songService');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Get all songs with optional search filters and sorting
 * GET /api/songs
 */
const getAllSongs = async (req, res, next) => {
  try {
    const { title, artist, year, sortBy, sortOrder } = req.query;

    const filters = {};
    if (title) filters.title = title;
    if (artist) filters.artist = artist;
    if (year) filters.year = parseInt(year);

    const songs = await songService.findAll(
      filters,
      sortBy || 'created_at',
      sortOrder?.toUpperCase() || 'DESC'
    );

    sendSuccess(res, 200, { songs }, 'Songs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single song by ID
 * GET /api/songs/:id
 */
const getSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    const song = await songService.findById(parseInt(id));
    if (!song) {
      throw new AppError('Song not found', 404);
    }

    sendSuccess(res, 200, { song }, 'Song retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new song
 * POST /api/songs
 */
const createSong = async (req, res, next) => {
  try {
    const { title, artist, year, youtube_id } = req.body;
    const ownerId = req.user.id;

    const song = await songService.create(title, artist, year, youtube_id, ownerId);

    sendSuccess(res, 201, { song }, 'Song created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update song
 * PUT /api/songs/:id
 */
const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artist, year, youtube_id } = req.body;

    // Check if song exists
    const existingSong = await songService.findById(parseInt(id));
    if (!existingSong) {
      throw new AppError('Song not found', 404);
    }

    // Check if user is the owner
    if (existingSong.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to update this song', 403);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (artist !== undefined) updates.artist = artist;
    if (year !== undefined) updates.year = year;
    if (youtube_id !== undefined) updates.youtube_id = youtube_id;

    const song = await songService.update(parseInt(id), updates);

    sendSuccess(res, 200, { song }, 'Song updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete song
 * DELETE /api/songs/:id
 */
const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if song exists
    const existingSong = await songService.findById(parseInt(id));
    if (!existingSong) {
      throw new AppError('Song not found', 404);
    }

    // Check if user is the owner
    if (existingSong.owner_id !== req.user.id) {
      throw new AppError('You do not have permission to delete this song', 403);
    }

    await songService.deleteById(parseInt(id));

    sendSuccess(res, 200, null, 'Song deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Copy song
 * POST /api/songs/:id/copy
 */
const copySong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newOwnerId = req.user.id;

    const originalSong = await songService.findById(parseInt(id));
    if (!originalSong) {
      throw new AppError('Song not found', 404);
    }

    const newSong = await songService.copy(parseInt(id), newOwnerId);

    sendSuccess(res, 201, { song: newSong }, 'Song copied successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
  copySong
};
