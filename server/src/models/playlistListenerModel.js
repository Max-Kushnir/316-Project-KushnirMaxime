const db = require('../config/db');

/**
 * Record a unique listener for a playlist
 * @param {Number} playlistId - Playlist ID
 * @param {String} listenerIdentifier - User ID or session ID
 * @returns {Boolean} True if new listener recorded, false if already exists
 */
const recordListener = async (playlistId, listenerIdentifier) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Try to insert listener record
    const result = await client.query(
      `INSERT INTO playlist_listeners (playlist_id, listener_identifier)
       VALUES ($1, $2)
       ON CONFLICT (playlist_id, listener_identifier) DO NOTHING
       RETURNING id`,
      [playlistId, listenerIdentifier]
    );

    const isNewListener = result.rowCount > 0;

    // If new listener, increment listener_count
    if (isNewListener) {
      await client.query(
        `UPDATE playlists
         SET listener_count = listener_count + 1
         WHERE id = $1`,
        [playlistId]
      );
    }

    await client.query('COMMIT');
    return isNewListener;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get listener count for a playlist
 * @param {Number} playlistId - Playlist ID
 * @returns {Number} Number of unique listeners
 */
const getListenerCount = async (playlistId) => {
  const result = await db.query(
    'SELECT COUNT(DISTINCT listener_identifier) as count FROM playlist_listeners WHERE playlist_id = $1',
    [playlistId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  recordListener,
  getListenerCount
};
