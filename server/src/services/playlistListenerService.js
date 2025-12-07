const { sequelize, PlaylistListener, Playlist } = require('../models');

/**
 * Record a unique listener for a playlist
 * @param {Number} playlistId - Playlist ID
 * @param {String} listenerIdentifier - User ID or session ID
 * @returns {Boolean} True if new listener recorded, false if already exists
 */
const recordListener = async (playlistId, listenerIdentifier) => {
  const transaction = await sequelize.transaction();

  try {
    // Try to insert listener record, return created boolean
    const [listener, created] = await PlaylistListener.findOrCreate({
      where: {
        playlist_id: playlistId,
        listener_identifier: listenerIdentifier
      },
      defaults: {
        playlist_id: playlistId,
        listener_identifier: listenerIdentifier
      },
      transaction
    });

    // If new listener, increment listener_count
    if (created) {
      await Playlist.increment('listener_count', {
        where: { id: playlistId },
        transaction
      });
    }

    await transaction.commit();
    return created;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get listener count for a playlist
 * @param {Number} playlistId - Playlist ID
 * @returns {Number} Number of unique listeners
 */
const getListenerCount = async (playlistId) => {
  const count = await PlaylistListener.count({
    where: { playlist_id: playlistId },
    distinct: true,
    col: 'listener_identifier'
  });
  return count;
};

module.exports = {
  recordListener,
  getListenerCount
};
