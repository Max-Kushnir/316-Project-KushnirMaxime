const request = require('supertest');
const app = require('../../src/index');
const { createTestUser, getAuthHeader, createTestSong, createTestPlaylist } = require('../helpers');

describe('Playlists API', () => {
  let testUser;
  let testToken;
  let otherUser;
  let otherToken;
  let testSong1;
  let testSong2;

  beforeEach(async () => {
    const result1 = await createTestUser('test@example.com', 'testuser', 'Password123!');
    testUser = result1.user;
    testToken = result1.token;

    const result2 = await createTestUser('other@example.com', 'otheruser', 'Password123!');
    otherUser = result2.user;
    otherToken = result2.token;

    testSong1 = await createTestSong(testToken, {
      title: 'Song 1',
      artist: 'Artist 1',
      year: 2023,
      youtube_id: 'abc123'
    });

    testSong2 = await createTestSong(testToken, {
      title: 'Song 2',
      artist: 'Artist 2',
      year: 2023,
      youtube_id: 'def456'
    });
  });

  describe('GET /api/playlists', () => {
    it('should list playlists as guest', async () => {
      await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .get('/api/playlists');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.playlists)).toBe(true);
      expect(response.body.data.playlists.length).toBeGreaterThan(0);
    });

    it('should filter playlists by name', async () => {
      await createTestPlaylist(testToken, { name: 'Rock Playlist' });
      await createTestPlaylist(testToken, { name: 'Jazz Playlist' });

      const response = await request(app)
        .get('/api/playlists?name=Rock');

      expect(response.status).toBe(200);
      expect(response.body.data.playlists.length).toBe(1);
      expect(response.body.data.playlists[0].name).toContain('Rock');
    });

    it('should sort playlists by name ascending', async () => {
      await createTestPlaylist(testToken, { name: 'Zulu Playlist' });
      await createTestPlaylist(testToken, { name: 'Alpha Playlist' });

      const response = await request(app)
        .get('/api/playlists?sortBy=name&sortOrder=asc');

      expect(response.status).toBe(200);
      expect(response.body.data.playlists[0].name).toBe('Alpha Playlist');
      expect(response.body.data.playlists[1].name).toBe('Zulu Playlist');
    });
  });

  describe('GET /api/playlists/:id', () => {
    it('should get single playlist with songs', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      // Add songs to playlist
      await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      const response = await request(app)
        .get(`/api/playlists/${playlist.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.playlist.id).toBe(playlist.id);
      expect(response.body.data.playlist.name).toBe('Test Playlist');
      expect(Array.isArray(response.body.data.playlist.songs)).toBe(true);
    });
  });

  describe('POST /api/playlists', () => {
    it('should create playlist when authenticated', async () => {
      const response = await request(app)
        .post('/api/playlists')
        .set(getAuthHeader(testToken))
        .send({ name: 'New Playlist' });

      expect(response.status).toBe(201);
      expect(response.body.data.playlist).toHaveProperty('id');
      expect(response.body.data.playlist.name).toBe('New Playlist');
      expect(response.body.data.playlist.owner_id).toBe(testUser.id);
    });

    it('should reject creation when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/playlists')
        .send({ name: 'New Playlist' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate playlist name for same user', async () => {
      await createTestPlaylist(testToken, { name: 'Duplicate Playlist' });

      const response = await request(app)
        .post('/api/playlists')
        .set(getAuthHeader(testToken))
        .send({ name: 'Duplicate Playlist' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/playlists/:id', () => {
    it('should update own playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Original Playlist' });

      const response = await request(app)
        .put(`/api/playlists/${playlist.id}`)
        .set(getAuthHeader(testToken))
        .send({ name: 'Updated Playlist' });

      expect(response.status).toBe(200);
      expect(response.body.data.playlist.name).toBe('Updated Playlist');
    });

    it('should reject update of another user playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .put(`/api/playlists/${playlist.id}`)
        .set(getAuthHeader(otherToken))
        .send({ name: 'Hacked Playlist' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/playlists/:id', () => {
    it('should delete own playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .delete(`/api/playlists/${playlist.id}`)
        .set(getAuthHeader(testToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject delete of another user playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .delete(`/api/playlists/${playlist.id}`)
        .set(getAuthHeader(otherToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/playlists/:id/copy', () => {
    it('should copy playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Original Playlist' });

      // Add songs to original playlist
      await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      const response = await request(app)
        .post(`/api/playlists/${playlist.id}/copy`)
        .set(getAuthHeader(otherToken));

      expect(response.status).toBe(201);
      expect(response.body.data.playlist).toHaveProperty('id');
      expect(response.body.data.playlist.id).not.toBe(playlist.id);
      expect(response.body.data.playlist.owner_id).toBe(otherUser.id);
    });
  });

  describe('POST /api/playlists/:id/listen', () => {
    it('should record listener as guest', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .post(`/api/playlists/${playlist.id}/listen`)
        .send({ sessionId: 'guest-session-123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should record listener as authenticated user', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .post(`/api/playlists/${playlist.id}/listen`)
        .set(getAuthHeader(otherToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/playlists/:id/songs', () => {
    it('should add song to playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      const response = await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      expect(response.status).toBe(201);
      expect(response.body.data.playlist).toHaveProperty('id');
      expect(response.body.data.playlist.songs.some(s => s.id === testSong1.id)).toBe(true);
    });

    it('should reject duplicate song in playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      const response = await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/playlists/:playlistId/songs/:songId', () => {
    it('should remove song from playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      const response = await request(app)
        .delete(`/api/playlists/${playlist.id}/songs/${testSong1.id}`)
        .set(getAuthHeader(testToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/playlists/:id/songs/reorder', () => {
    it('should reorder songs in playlist', async () => {
      const playlist = await createTestPlaylist(testToken, { name: 'Test Playlist' });

      // Add songs to playlist
      await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong1.id });

      await request(app)
        .post(`/api/playlists/${playlist.id}/songs`)
        .set(getAuthHeader(testToken))
        .send({ songId: testSong2.id });

      // Reorder: song2 first, song1 second
      const response = await request(app)
        .put(`/api/playlists/${playlist.id}/songs/reorder`)
        .set(getAuthHeader(testToken))
        .send({ songIds: [testSong2.id, testSong1.id] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});
