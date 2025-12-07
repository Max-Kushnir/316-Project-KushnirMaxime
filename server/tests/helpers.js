const request = require('supertest');
const app = require('../src/index');

/**
 * Creates a test user and returns user data with token
 * @param {string} email - User email
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<{user: object, token: string}>}
 */
async function createTestUser(email, username, password) {
  // Register the user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({ email, username, password });

  if (registerResponse.status !== 201) {
    throw new Error(`Failed to register user: ${registerResponse.status} - ${JSON.stringify(registerResponse.body)}`);
  }

  // Login to get the token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (loginResponse.status !== 200 || !loginResponse.body.data) {
    throw new Error(`Failed to login user: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
  }

  return {
    user: loginResponse.body.data.user,
    token: loginResponse.body.data.token
  };
}

/**
 * Returns authorization header object
 * @param {string} token - JWT token
 * @returns {object} Authorization header
 */
function getAuthHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Creates a test song via API
 * @param {string} token - JWT token
 * @param {object} songData - Song data
 * @returns {Promise<object>} Created song
 */
async function createTestSong(token, songData) {
  const response = await request(app)
    .post('/api/songs')
    .set(getAuthHeader(token))
    .send(songData);

  if (response.status !== 201 || !response.body.data) {
    throw new Error(`Failed to create test song: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  return response.body.data.song;
}

/**
 * Creates a test playlist via API
 * @param {string} token - JWT token
 * @param {object} playlistData - Playlist data
 * @returns {Promise<object>} Created playlist
 */
async function createTestPlaylist(token, playlistData) {
  const response = await request(app)
    .post('/api/playlists')
    .set(getAuthHeader(token))
    .send(playlistData);

  if (response.status !== 201 || !response.body.data) {
    throw new Error(`Failed to create test playlist: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  return response.body.data.playlist;
}

module.exports = {
  createTestUser,
  getAuthHeader,
  createTestSong,
  createTestPlaylist
};
