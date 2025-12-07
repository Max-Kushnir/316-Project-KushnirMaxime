const db = require('../config/db');

/**
 * Find all playlists with optional filters and sorting
 * @param {Object} filters - { name, username, songTitle, songArtist, songYear }
 * @param {String} sortBy - Sort field (listener_count, name, username)
 * @param {String} sortOrder - Sort order (ASC or DESC)
 * @param {Number|null} userId - Current user ID (for default filtering)
 * @returns {Array} Array of playlist objects
 */
const findAll = async (filters = {}, sortBy = 'created_at', sortOrder = 'DESC', userId = null) => {
  const conditions = [];
  const values = [];
  let paramCount = 1;

  // Build WHERE conditions
  if (filters.name) {
    conditions.push(`p.name ILIKE $${paramCount}`);
    values.push(`%${filters.name}%`);
    paramCount++;
  }

  if (filters.username) {
    conditions.push(`u.username ILIKE $${paramCount}`);
    values.push(`%${filters.username}%`);
    paramCount++;
  }

  if (filters.songTitle) {
    conditions.push(`EXISTS (
      SELECT 1 FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      WHERE ps.playlist_id = p.id
      AND s.title ILIKE $${paramCount}
    )`);
    values.push(`%${filters.songTitle}%`);
    paramCount++;
  }

  if (filters.songArtist) {
    conditions.push(`EXISTS (
      SELECT 1 FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      WHERE ps.playlist_id = p.id
      AND s.artist ILIKE $${paramCount}
    )`);
    values.push(`%${filters.songArtist}%`);
    paramCount++;
  }

  if (filters.songYear) {
    conditions.push(`EXISTS (
      SELECT 1 FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      WHERE ps.playlist_id = p.id
      AND s.year = $${paramCount}
    )`);
    values.push(filters.songYear);
    paramCount++;
  }

  // Default: if user is logged in and no filters, show only their playlists
  const hasFilters = Object.keys(filters).length > 0;
  if (!hasFilters && userId) {
    conditions.push(`p.owner_id = $${paramCount}`);
    values.push(userId);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause
  let orderByClause;
  switch (sortBy) {
    case 'listener_count':
      orderByClause = `ORDER BY p.listener_count ${sortOrder}`;
      break;
    case 'name':
      orderByClause = `ORDER BY LOWER(p.name) ${sortOrder}`;
      break;
    case 'username':
      orderByClause = `ORDER BY LOWER(u.username) ${sortOrder}`;
      break;
    default:
      orderByClause = `ORDER BY p.created_at ${sortOrder}`;
  }

  const query = `
    SELECT
      p.*,
      u.username as owner_username,
      (
        SELECT COUNT(*)
        FROM playlist_songs ps
        WHERE ps.playlist_id = p.id
      ) as song_count
    FROM playlists p
    LEFT JOIN users u ON p.owner_id = u.id
    ${whereClause}
    ${orderByClause}
  `;

  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Find playlist by ID with owner info and songs
 * @param {Number} id - Playlist ID
 * @returns {Object|null} Playlist object with songs or null if not found
 */
const findById = async (id) => {
  const playlistResult = await db.query(
    `SELECT
      p.*,
      u.username as owner_username,
      (
        SELECT COUNT(*)
        FROM playlist_songs ps
        WHERE ps.playlist_id = p.id
      ) as song_count
    FROM playlists p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = $1`,
    [id]
  );

  const playlist = playlistResult.rows[0];
  if (!playlist) return null;

  // Get songs in the playlist
  const songsResult = await db.query(
    `SELECT
      s.*,
      ps.position,
      u.username as owner_username
    FROM playlist_songs ps
    JOIN songs s ON ps.song_id = s.id
    LEFT JOIN users u ON s.owner_id = u.id
    WHERE ps.playlist_id = $1
    ORDER BY ps.position ASC`,
    [id]
  );

  playlist.songs = songsResult.rows;
  return playlist;
};

/**
 * Create new playlist
 * @param {String} name - Playlist name
 * @param {Number} ownerId - User ID of the playlist creator
 * @returns {Object} Created playlist object
 */
const create = async (name, ownerId) => {
  const result = await db.query(
    `INSERT INTO playlists (name, owner_id, listener_count)
     VALUES ($1, $2, 0)
     RETURNING *`,
    [name, ownerId]
  );
  return result.rows[0];
};

/**
 * Update playlist name
 * @param {Number} id - Playlist ID
 * @param {String} name - New playlist name
 * @returns {Object} Updated playlist object
 */
const update = async (id, name) => {
  const result = await db.query(
    `UPDATE playlists
     SET name = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [name, id]
  );
  return result.rows[0];
};

/**
 * Delete playlist by ID
 * @param {Number} id - Playlist ID
 * @returns {Boolean} True if deleted, false if not found
 */
const deleteById = async (id) => {
  const result = await db.query(
    'DELETE FROM playlists WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
};

/**
 * Find playlist by owner and name
 * @param {Number} ownerId - User ID
 * @param {String} name - Playlist name
 * @returns {Object|null} Playlist object or null if not found
 */
const findByOwnerAndName = async (ownerId, name) => {
  const result = await db.query(
    'SELECT * FROM playlists WHERE owner_id = $1 AND name = $2',
    [ownerId, name]
  );
  return result.rows[0] || null;
};

/**
 * Get next available "Untitled N" name for user
 * @param {Number} ownerId - User ID
 * @returns {String} Next available untitled name
 */
const getNextUntitledName = async (ownerId) => {
  const result = await db.query(
    `SELECT name FROM playlists
     WHERE owner_id = $1 AND name ~ '^Untitled [0-9]+$'
     ORDER BY name`,
    [ownerId]
  );

  const existingNumbers = result.rows.map(row => {
    const match = row.name.match(/^Untitled (\d+)$/);
    return match ? parseInt(match[1]) : -1;
  });

  // Find first missing number starting from 0
  let nextNumber = 0;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  return `Untitled ${nextNumber}`;
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
