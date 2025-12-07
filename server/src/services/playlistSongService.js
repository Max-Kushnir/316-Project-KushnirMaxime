const { Op } = require('sequelize');
const { sequelize, PlaylistSong, Song, User } = require('../models');

/**
 * Find all songs in a playlist ordered by position
 * @param {Number} playlistId - Playlist ID
 * @returns {Array} Array of song objects with position
 */
const findByPlaylistId = async (playlistId) => {
  const playlistSongs = await PlaylistSong.findAll({
    where: { playlist_id: playlistId },
    include: [{
      model: Song,
      as: 'song',
      include: [{
        model: User,
        as: 'owner',
        attributes: ['username']
      }]
    }],
    order: [['position', 'ASC']]
  });

  return playlistSongs.map(ps => {
    const psJson = ps.toJSON();
    return {
      ...psJson.song,
      position: psJson.position,
      owner_username: psJson.song.owner?.username || null
    };
  });
};

/**
 * Add song to playlist at next position
 * @param {Number} playlistId - Playlist ID
 * @param {Number} songId - Song ID
 * @returns {Object} Created playlist_song record
 */
const addSong = async (playlistId, songId) => {
  // Get current max position
  const maxPositionResult = await PlaylistSong.findOne({
    where: { playlist_id: playlistId },
    attributes: [[sequelize.fn('MAX', sequelize.col('position')), 'max_position']],
    raw: true
  });

  const nextPosition = (maxPositionResult?.max_position ?? -1) + 1;

  const playlistSong = await PlaylistSong.create({
    playlist_id: playlistId,
    song_id: songId,
    position: nextPosition
  });

  return playlistSong.toJSON();
};

/**
 * Remove song from playlist and reorder positions
 * @param {Number} playlistId - Playlist ID
 * @param {Number} songId - Song ID
 * @returns {Boolean} True if removed
 */
const removeSong = async (playlistId, songId) => {
  const transaction = await sequelize.transaction();

  try {
    // Get the position of the song to remove
    const playlistSong = await PlaylistSong.findOne({
      where: { playlist_id: playlistId, song_id: songId },
      transaction
    });

    if (!playlistSong) {
      await transaction.rollback();
      return false;
    }

    const removedPosition = playlistSong.position;

    // Delete the song
    await PlaylistSong.destroy({
      where: { playlist_id: playlistId, song_id: songId },
      transaction
    });

    // Reorder remaining songs (decrement positions above the removed one)
    await PlaylistSong.update(
      { position: sequelize.literal('position - 1') },
      {
        where: {
          playlist_id: playlistId,
          position: { [Op.gt]: removedPosition }
        },
        transaction
      }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Reorder songs in a playlist
 * @param {Number} playlistId - Playlist ID
 * @param {Array} songIds - Array of song IDs in new order
 * @returns {Boolean} True if reordered
 */
const reorderSongs = async (playlistId, songIds) => {
  const transaction = await sequelize.transaction();

  try {
    // First, set all positions to negative values to avoid unique constraint conflicts
    // Use negative index to ensure uniqueness during transition
    for (let i = 0; i < songIds.length; i++) {
      await PlaylistSong.update(
        { position: -1 - i },
        {
          where: { playlist_id: playlistId, song_id: songIds[i] },
          transaction
        }
      );
    }

    // Then update to final positions
    for (let i = 0; i < songIds.length; i++) {
      await PlaylistSong.update(
        { position: i },
        {
          where: { playlist_id: playlistId, song_id: songIds[i] },
          transaction
        }
      );
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Check if song exists in playlist
 * @param {Number} playlistId - Playlist ID
 * @param {Number} songId - Song ID
 * @returns {Boolean} True if song exists in playlist
 */
const songExistsInPlaylist = async (playlistId, songId) => {
  const count = await PlaylistSong.count({
    where: { playlist_id: playlistId, song_id: songId }
  });
  return count > 0;
};

module.exports = {
  findByPlaylistId,
  addSong,
  removeSong,
  reorderSongs,
  songExistsInPlaylist
};
