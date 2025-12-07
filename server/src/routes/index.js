/**
 * Route aggregator - exports all route modules
 */
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const songRoutes = require('./songRoutes');
const playlistRoutes = require('./playlistRoutes');

module.exports = {
  authRoutes,
  userRoutes,
  songRoutes,
  playlistRoutes
};
