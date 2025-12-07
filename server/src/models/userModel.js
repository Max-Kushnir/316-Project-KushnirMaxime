const db = require('../config/db');

/**
 * Find user by email
 * @param {String} email - User email
 * @returns {Object|null} User object or null if not found
 */
const findByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {Number} id - User ID
 * @returns {Object|null} User object or null if not found
 */
const findById = async (id) => {
  const result = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Create new user
 * @param {String} email - User email
 * @param {String} username - User username
 * @param {String} passwordHash - Hashed password
 * @param {String} avatarImage - Base64 encoded avatar image (optional)
 * @returns {Object} Created user object
 */
const create = async (email, username, passwordHash, avatarImage = null) => {
  const result = await db.query(
    `INSERT INTO users (email, username, password_hash, avatar_image)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, username, avatar_image, created_at, updated_at`,
    [email, username, passwordHash, avatarImage]
  );
  return result.rows[0];
};

/**
 * Update user
 * @param {Number} id - User ID
 * @param {Object} updates - Fields to update (username, password_hash, avatar_image)
 * @returns {Object} Updated user object
 */
const update = async (id, updates) => {
  const allowedFields = ['username', 'password_hash', 'avatar_image'];
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
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, email, username, avatar_image, created_at, updated_at`,
    values
  );

  return result.rows[0];
};

module.exports = {
  findByEmail,
  findById,
  create,
  update
};
