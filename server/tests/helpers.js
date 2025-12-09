const request = require('supertest');
const app = require('../src/index');

/**
 * Creates a test user and returns user data with authenticated agent
 * The agent persists cookies across requests for cookie-based auth
 * @param {string} email - User email
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<{user: object, agent: object}>}
 */
async function createTestUser(email, username, password) {
  // Create an agent to persist cookies across requests
  const agent = request.agent(app);

  // Register the user
  const registerResponse = await agent
    .post('/api/auth/register')
    .send({ email, username, password });

  if (registerResponse.status !== 201) {
    throw new Error(`Failed to register user: ${registerResponse.status} - ${JSON.stringify(registerResponse.body)}`);
  }

  // Login to ensure cookies are set (registration also sets cookies, but login is explicit)
  const loginResponse = await agent
    .post('/api/auth/login')
    .send({ email, password });

  if (loginResponse.status !== 200 || !loginResponse.body.data) {
    throw new Error(`Failed to login user: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
  }

  return {
    user: loginResponse.body.data.user,
    agent: agent
  };
}

/**
 * Creates a test song via API using authenticated agent
 * @param {object} agent - Supertest agent with auth cookies
 * @param {object} songData - Song data
 * @returns {Promise<object>} Created song
 */
async function createTestSong(agent, songData) {
  const response = await agent
    .post('/api/songs')
    .send(songData);

  if (response.status !== 201 || !response.body.data) {
    throw new Error(`Failed to create test song: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  return response.body.data.song;
}

/**
 * Creates a test playlist via API using authenticated agent
 * @param {object} agent - Supertest agent with auth cookies
 * @param {object} playlistData - Playlist data
 * @returns {Promise<object>} Created playlist
 */
async function createTestPlaylist(agent, playlistData) {
  const response = await agent
    .post('/api/playlists')
    .send(playlistData);

  if (response.status !== 201 || !response.body.data) {
    throw new Error(`Failed to create test playlist: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  return response.body.data.playlist;
}

module.exports = {
  createTestUser,
  createTestSong,
  createTestPlaylist
};
