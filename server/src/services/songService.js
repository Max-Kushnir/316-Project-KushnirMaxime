const { Op, literal, fn, col } = require('sequelize');
const { Song, User, PlaylistSong } = require('../models');

/**
 * Find all songs with optional filters and sorting
 * @param {Object} filters - { title, artist, year }
 * @param {String} sortBy - Sort field (listen_count, playlist_count, title, artist, year)
 * @param {String} sortOrder - Sort order (ASC or DESC)
 * @returns {Array} Array of song objects
 */
const findAll = async (filters = {}, sortBy = 'created_at', sortOrder = 'DESC') => {
  const where = {};

  if (filters.title) {
    where.title = { [Op.iLike]: `%${filters.title}%` };
  }
  if (filters.artist) {
    where.artist = { [Op.iLike]: `%${filters.artist}%` };
  }
  if (filters.year) {
    where.year = filters.year;
  }

  // Build order clause
  let order;
  switch (sortBy) {
    case 'title':
      order = [[fn('LOWER', col('Song.title')), sortOrder]];
      break;
    case 'artist':
      order = [[fn('LOWER', col('Song.artist')), sortOrder]];
      break;
    case 'year':
      order = [['year', sortOrder]];
      break;
    case 'listen_count':
      order = [['listen_count', sortOrder]];
      break;
    case 'playlist_count':
      order = [[literal('playlist_count'), sortOrder]];
      break;
    default:
      order = [['created_at', sortOrder]];
  }

  const songs = await Song.findAll({
    where,
    include: [{
      model: User,
      as: 'owner',
      attributes: ['username']
    }],
    order,
    attributes: {
      include: [
        [literal('(SELECT COUNT(*) FROM playlist_songs WHERE playlist_songs.song_id = "Song".id)'), 'playlist_count']
      ]
    }
  });

  return songs.map(song => {
    const songJson = song.toJSON();
    return {
      ...songJson,
      owner_username: songJson.owner?.username || null
    };
  });
};

/**
 * Find song by ID
 * @param {Number} id - Song ID
 * @returns {Object|null} Song object or null if not found
 */
const findById = async (id) => {
  const song = await Song.findByPk(id, {
    include: [{
      model: User,
      as: 'owner',
      attributes: ['username']
    }],
    attributes: {
      include: [
        [literal('(SELECT COUNT(*) FROM playlist_songs WHERE playlist_songs.song_id = "Song".id)'), 'playlist_count']
      ]
    }
  });

  if (!song) return null;

  const songJson = song.toJSON();
  return {
    ...songJson,
    owner_username: songJson.owner?.username || null
  };
};

/**
 * Create new song
 * @param {String} title - Song title
 * @param {String} artist - Artist name
 * @param {Number} year - Release year
 * @param {String} youtubeId - YouTube video ID
 * @param {Number} ownerId - User ID of the song creator
 * @returns {Object} Created song object
 */
const create = async (title, artist, year, youtubeId, ownerId) => {
  try {
    const song = await Song.create({
      title,
      artist,
      year,
      youtube_id: youtubeId,
      owner_id: ownerId,
      listen_count: 0
    });
    return song.toJSON();
  } catch (error) {
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      const err = new Error('A song with this title, artist, and year already exists');
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
};

/**
 * Update song
 * @param {Number} id - Song ID
 * @param {Object} updates - Fields to update (title, artist, year, youtube_id)
 * @returns {Object} Updated song object
 */
const update = async (id, updates) => {
  const allowedFields = ['title', 'artist', 'year', 'youtube_id'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  await Song.update(filteredUpdates, { where: { id } });
  return findById(id);
};

/**
 * Delete song by ID
 * @param {Number} id - Song ID
 * @returns {Boolean} True if deleted, false if not found
 */
const deleteById = async (id) => {
  const deleted = await Song.destroy({ where: { id } });
  return deleted > 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById
};
