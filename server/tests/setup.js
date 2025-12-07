require('dotenv').config();
const { sequelize, User, Song, Playlist, PlaylistSong, PlaylistListener } = require('../src/models');

/**
 * Truncates all tables using Sequelize with CASCADE and resets sequences.
 */
async function cleanDatabase() {
  await PlaylistListener.destroy({ where: {}, truncate: true, cascade: true });
  await PlaylistSong.destroy({ where: {}, truncate: true, cascade: true });
  await Playlist.destroy({ where: {}, truncate: true, cascade: true });
  await Song.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
}

// Sync database before all tests
beforeAll(async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
});

// Clean database BEFORE each test - guarantees clean state
// regardless of whether previous test succeeded or failed
beforeEach(async () => {
  try {
    await cleanDatabase();
  } catch (error) {
    console.error('Error cleaning database in beforeEach:', error);
    throw error;
  }
});

// Note: We don't close the sequelize connection here because afterAll runs per test file,
// not globally. The process cleanup will handle closing the connection when tests complete.
