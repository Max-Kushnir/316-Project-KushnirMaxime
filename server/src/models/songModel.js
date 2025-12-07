const db = require('../config/db');

/**
 * Find all songs with optional filters and sorting
 * @param {Object} filters - { title, artist, year }
 * @param {String} sortBy - Sort field (listen_count, playlist_count, title, artist, year)
 * @param {String} sortOrder - Sort order (ASC or DESC)
 * @returns {Array} Array of song objects
 */
const findAll = async (filters = {}, sortBy = 'created_at', sortOrder = 'DESC') => {
  const conditions = [];
  const values = [];
  let paramCount = 1;

  // Build WHERE conditions
  if (filters.title) {
    conditions.push(`title ILIKE $${paramCount}`);
    values.push(`%${filters.title}%`);
    paramCount++;
  }

  if (filters.artist) {
    conditions.push(`artist ILIKE $${paramCount}`);
    values.push(`%${filters.artist}%`);
    paramCount++;
  }

  if (filters.year) {
    conditions.push(`year = $${paramCount}`);
    values.push(filters.year);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause
  let orderByClause;
  switch (sortBy) {
    case 'listen_count':
      orderByClause = `ORDER BY listen_count ${sortOrder}`;
      break;
    case 'playlist_count':
      orderByClause = `ORDER BY playlist_count ${sortOrder}`;
      break;
    case 'title':
      orderByClause = `ORDER BY LOWER(title) ${sortOrder}`;
      break;
    case 'artist':
      orderByClause = `ORDER BY LOWER(artist) ${sortOrder}`;
      break;
    case 'year':
      orderByClause = `ORDER BY year ${sortOrder}`;
      break;
    default:
      orderByClause = `ORDER BY created_at ${sortOrder}`;
  }

  const query = `
    SELECT
      s.*,
      u.username as owner_username,
      (
        SELECT COUNT(*)
        FROM playlist_songs ps
        WHERE ps.song_id = s.id
      ) as playlist_count
    FROM songs s
    LEFT JOIN users u ON s.owner_id = u.id
    ${whereClause}
    ${orderByClause}
  `;

  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Find song by ID
 * @param {Number} id - Song ID
 * @returns {Object|null} Song object or null if not found
 */
const findById = async (id) => {
  const result = await db.query(
    `SELECT
      s.*,
      u.username as owner_username,
      (
        SELECT COUNT(*)
        FROM playlist_songs ps
        WHERE ps.song_id = s.id
      ) as playlist_count
    FROM songs s
    LEFT JOIN users u ON s.owner_id = u.id
    WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
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
  const result = await db.query(
    `INSERT INTO songs (title, artist, year, youtube_id, owner_id, listen_count)
     VALUES ($1, $2, $3, $4, $5, 0)
     RETURNING *`,
    [title, artist, year, youtubeId, ownerId]
  );
  return result.rows[0];
};

/**
 * Update song
 * @param {Number} id - Song ID
 * @param {Object} updates - Fields to update (title, artist, year, youtube_id)
 * @returns {Object} Updated song object
 */
const update = async (id, updates) => {
  const allowedFields = ['title', 'artist', 'year', 'youtube_id'];
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await db.query(
    `UPDATE songs
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete song by ID
 * @param {Number} id - Song ID
 * @returns {Boolean} True if deleted, false if not found
 */
const deleteById = async (id) => {
  const result = await db.query(
    'DELETE FROM songs WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById
};
