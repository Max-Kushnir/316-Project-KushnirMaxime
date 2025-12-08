const { Op, literal, fn, col } = require('sequelize');
const { Playlist, User, Song, PlaylistSong } = require('../models');

/**
 * Find all playlists with optional filters and sorting
 * @param {Object} filters - { name, username, songTitle, songArtist, songYear }
 * @param {String} sortBy - Sort field (listener_count, name, username)
 * @param {String} sortOrder - Sort order (ASC or DESC)
 * @param {Number|null} userId - Current user ID (for default filtering)
 * @returns {Array} Array of playlist objects
 */
const findAll = async (filters = {}, sortBy = 'created_at', sortOrder = 'DESC', userId = null) => {
  const where = {};
  const include = [
    {
      model: User,
      as: 'owner',
      attributes: ['username'],
      required: false
    },
    {
      model: PlaylistSong,
      as: 'playlistSongs',
      include: [{
        model: Song,
        as: 'song',
        attributes: ['id', 'title', 'artist', 'year', 'youtube_id']
      }]
    }
  ];

  if (filters.name) {
    where.name = { [Op.iLike]: `%${filters.name}%` };
  }

  if (filters.username) {
    include[0].where = { username: { [Op.iLike]: `%${filters.username}%` } };
    include[0].required = true;
  }

  // Song filters require EXISTS subqueries
  const songConditions = [];
  if (filters.songTitle) {
    songConditions.push(literal(`EXISTS (SELECT 1 FROM playlist_songs ps JOIN songs s ON ps.song_id = s.id WHERE ps.playlist_id = "Playlist".id AND s.title ILIKE '%${filters.songTitle.replace(/'/g, "''")}%')`));
  }
  if (filters.songArtist) {
    songConditions.push(literal(`EXISTS (SELECT 1 FROM playlist_songs ps JOIN songs s ON ps.song_id = s.id WHERE ps.playlist_id = "Playlist".id AND s.artist ILIKE '%${filters.songArtist.replace(/'/g, "''")}%')`));
  }
  if (filters.songYear) {
    songConditions.push(literal(`EXISTS (SELECT 1 FROM playlist_songs ps JOIN songs s ON ps.song_id = s.id WHERE ps.playlist_id = "Playlist".id AND s.year = ${parseInt(filters.songYear)})`));
  }

  if (songConditions.length > 0) {
    where[Op.and] = songConditions;
  }

  // Default: if user is logged in and no filters, show only their playlists
  const hasFilters = Object.keys(filters).length > 0;
  if (!hasFilters && userId) {
    where.owner_id = userId;
  }

  // Build order clause
  let order;
  switch (sortBy) {
    case 'name':
      order = [[fn('LOWER', col('Playlist.name')), sortOrder]];
      break;
    case 'username':
      order = [[literal('"owner"."username"'), sortOrder]];
      break;
    case 'listener_count':
      order = [['listener_count', sortOrder]];
      break;
    default:
      order = [['created_at', sortOrder]];
  }

  const playlists = await Playlist.findAll({
    where,
    include,
    order,
    attributes: {
      include: [
        [literal('(SELECT COUNT(*) FROM playlist_songs WHERE playlist_songs.playlist_id = "Playlist".id)'), 'song_count']
      ]
    }
  });

  return playlists.map(p => {
    const pJson = p.toJSON();
    return {
      ...pJson,
      owner_username: pJson.owner?.username || null,
      // Map playlistSongs to playlist_songs for frontend compatibility
      playlist_songs: (pJson.playlistSongs || []).map(ps => ({
        id: ps.id,
        position: ps.position,
        song: ps.song
      }))
    };
  });
};;

/**
 * Find playlist by ID with owner info and songs
 * @param {Number} id - Playlist ID
 * @returns {Object|null} Playlist object with songs or null if not found
 */
const findById = async (id) => {
  const playlist = await Playlist.findByPk(id, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['username']
      },
      {
        model: PlaylistSong,
        as: 'playlistSongs',
        include: [{
          model: Song,
          as: 'song',
          include: [{
            model: User,
            as: 'owner',
            attributes: ['username']
          }]
        }]
      }
    ],
    attributes: {
      include: [
        [literal('(SELECT COUNT(*) FROM playlist_songs WHERE playlist_songs.playlist_id = "Playlist".id)'), 'song_count']
      ]
    }
  });

  if (!playlist) return null;

  const pJson = playlist.toJSON();
  const result = {
    ...pJson,
    owner_username: pJson.owner?.username || null,
    songs: pJson.playlistSongs
      .sort((a, b) => a.position - b.position)
      .map(ps => ({
        ...ps.song,
        position: ps.position,
        owner_username: ps.song.owner?.username || null
      }))
  };

  delete result.playlistSongs;
  return result;
};

/**
 * Create new playlist
 * @param {String} name - Playlist name
 * @param {Number} ownerId - User ID of the playlist creator
 * @returns {Object} Created playlist object
 */
const create = async (name, ownerId) => {
  const playlist = await Playlist.create({
    name,
    owner_id: ownerId,
    listener_count: 0
  });
  return playlist.toJSON();
};

/**
 * Update playlist name
 * @param {Number} id - Playlist ID
 * @param {String} name - New playlist name
 * @returns {Object} Updated playlist object
 */
const update = async (id, name) => {
  await Playlist.update({ name }, { where: { id } });
  return findById(id);
};

/**
 * Delete playlist by ID
 * @param {Number} id - Playlist ID
 * @returns {Boolean} True if deleted, false if not found
 */
const deleteById = async (id) => {
  const deleted = await Playlist.destroy({ where: { id } });
  return deleted > 0;
};

/**
 * Find playlist by owner and name
 * @param {Number} ownerId - User ID
 * @param {String} name - Playlist name
 * @returns {Object|null} Playlist object or null if not found
 */
const findByOwnerAndName = async (ownerId, name) => {
  const playlist = await Playlist.findOne({
    where: { owner_id: ownerId, name }
  });
  return playlist ? playlist.toJSON() : null;
};

/**
 * Get next available "Untitled N" name for user
 * @param {Number} ownerId - User ID
 * @returns {String} Next available untitled name
 */
const getNextUntitledName = async (ownerId) => {
  return Playlist.getNextUntitledName(ownerId);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById,
  findByOwnerAndName,
  getNextUntitledName
};
