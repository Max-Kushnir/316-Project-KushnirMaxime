const db = require('../config/db');

/**
 * Find all songs in a playlist ordered by position
 * @param {Number} playlistId - Playlist ID
 * @returns {Array} Array of song objects with position
 */
const findByPlaylistId = async (playlistId) => {
  const result = await db.query(
    `SELECT
      s.*,
      ps.position,
      u.username as owner_username
    FROM playlist_songs ps
    JOIN songs s ON ps.song_id = s.id
    LEFT JOIN users u ON s.owner_id = u.id
    WHERE ps.playlist_id = $1
    ORDER BY ps.position ASC`,
    [playlistId]
  );
  return result.rows;
};

/**
 * Add song to playlist at next position
 * @param {Number} playlistId - Playlist ID
 * @param {Number} songId - Song ID
 * @returns {Object} Created playlist_song record
 */
const addSong = async (playlistId, songId) => {
  // Get current max position
  const maxPositionResult = await db.query(
    'SELECT MAX(position) as max_position FROM playlist_songs WHERE playlist_id = $1',
    [playlistId]
  );

  const nextPosition = (maxPositionResult.rows[0].max_position ?? -1) + 1;

  const result = await db.query(
    `INSERT INTO playlist_songs (playlist_id, song_id, position)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [playlistId, songId, nextPosition]
  );

  return result.rows[0];
};

/**
 * Remove song from playlist and reorder positions
 * @param {Number} playlistId - Playlist ID
 * @param {Number} songId - Song ID
 * @returns {Boolean} True if removed
 */
const removeSong = async (playlistId, songId) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Get the position of the song to remove
    const posResult = await client.query(
      'SELECT position FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );

    if (posResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const removedPosition = posResult.rows[0].position;

    // Delete the song
    await client.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );

    // Reorder remaining songs (decrement positions above the removed one)
    await client.query(
      `UPDATE playlist_songs
       SET position = position - 1
       WHERE playlist_id = $1 AND position > $2`,
      [playlistId, removedPosition]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reorder songs in a playlist
 * @param {Number} playlistId - Playlist ID
 * @param {Array} songIds - Array of song IDs in new order
 * @returns {Boolean} True if reordered
 */
const reorderSongs = async (playlistId, songIds) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Update position for each song
    for (let i = 0; i < songIds.length; i++) {
      await client.query(
        `UPDATE playlist_songs
         SET position = $1
         WHERE playlist_id = $2 AND song_id = $3`,
        [i, playlistId, songIds[i]]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Check if song exists in playlist
 * @param {Number} playlistId - Playlist ID
 * @param {Number} songId - Song ID
 * @returns {Boolean} True if song exists in playlist
 */
const songExistsInPlaylist = async (playlistId, songId) => {
  const result = await db.query(
    'SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
    [playlistId, songId]
  );
  return result.rows.length > 0;
};

module.exports = {
  findByPlaylistId,
  addSong,
  removeSong,
  reorderSongs,
  songExistsInPlaylist
};
