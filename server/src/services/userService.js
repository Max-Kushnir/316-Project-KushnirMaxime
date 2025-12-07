const { User } = require('../models');

/**
 * Find user by email
 * @param {String} email - User email
 * @returns {Object|null} User object or null if not found
 */
const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  return user ? user.toJSON() : null;
};

/**
 * Find user by ID
 * @param {Number} id - User ID
 * @returns {Object|null} User object or null if not found
 */
const findById = async (id) => {
  const user = await User.findByPk(id);
  return user ? user.toJSON() : null;
};

/**
 * Create new user
 * @param {String} email - User email
 * @param {String} username - User username
 * @param {String} passwordHash - Hashed password
 * @param {String} avatarImage - Base64 encoded avatar image (optional)
 * @returns {Object} Created user object (without password)
 */
const create = async (email, username, passwordHash, avatarImage = null) => {
  const user = await User.create({
    email,
    username,
    password_hash: passwordHash,
    avatar_image: avatarImage
  });
  return user.toSafeJSON();
};

/**
 * Update user
 * @param {Number} id - User ID
 * @param {Object} updates - Fields to update (username, password_hash, avatar_image)
 * @returns {Object} Updated user object (without password)
 */
const update = async (id, updates) => {
  const allowedFields = ['username', 'password_hash', 'avatar_image'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  await User.update(filteredUpdates, { where: { id } });
  const user = await User.findByPk(id);
  return user.toSafeJSON();
};

module.exports = {
  findByEmail,
  findById,
  create,
  update
};
