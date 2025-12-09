const request = require('supertest');
const app = require('../../src/index');
const { createTestUser, createTestSong } = require('../helpers');

describe('Songs API', () => {
  let testUser;
  let testAgent;
  let otherUser;
  let otherAgent;

  beforeEach(async () => {
    const result1 = await createTestUser('test@example.com', 'testuser', 'Password123!');
    testUser = result1.user;
    testAgent = result1.agent;

    const result2 = await createTestUser('other@example.com', 'otheruser', 'Password123!');
    otherUser = result2.user;
    otherAgent = result2.agent;
  });

  describe('GET /api/songs', () => {
    it('should list songs as guest', async () => {
      await createTestSong(testAgent, {
        title: 'Test Song',
        artist: 'Test Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await request(app)
        .get('/api/songs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.songs)).toBe(true);
      expect(response.body.data.songs.length).toBeGreaterThan(0);
    });

    it('should filter songs by title', async () => {
      await createTestSong(testAgent, {
        title: 'Hello World',
        artist: 'Artist 1',
        year: 2023,
        youtube_id: 'abc123'
      });

      await createTestSong(testAgent, {
        title: 'Goodbye Moon',
        artist: 'Artist 2',
        year: 2023,
        youtube_id: 'def456'
      });

      const response = await request(app)
        .get('/api/songs?title=Hello');

      expect(response.status).toBe(200);
      expect(response.body.data.songs.length).toBe(1);
      expect(response.body.data.songs[0].title).toContain('Hello');
    });

    it('should sort songs by year descending', async () => {
      await createTestSong(testAgent, {
        title: 'Old Song',
        artist: 'Artist 1',
        year: 2020,
        youtube_id: 'abc123'
      });

      await createTestSong(testAgent, {
        title: 'New Song',
        artist: 'Artist 2',
        year: 2023,
        youtube_id: 'def456'
      });

      const response = await request(app)
        .get('/api/songs?sortBy=year&sortOrder=desc');

      expect(response.status).toBe(200);
      expect(response.body.data.songs[0].year).toBeGreaterThan(response.body.data.songs[1].year);
    });
  });

  describe('GET /api/songs/:id', () => {
    it('should get single song', async () => {
      const song = await createTestSong(testAgent, {
        title: 'Test Song',
        artist: 'Test Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await request(app)
        .get(`/api/songs/${song.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.song.id).toBe(song.id);
      expect(response.body.data.song.title).toBe('Test Song');
    });

    it('should return 404 for non-existent song', async () => {
      const response = await request(app)
        .get('/api/songs/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/songs', () => {
    it('should create song when authenticated', async () => {
      const response = await testAgent
        .post('/api/songs')
        .send({
          title: 'New Song',
          artist: 'New Artist',
          year: 2023,
          youtube_id: 'xyz789'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.song).toHaveProperty('id');
      expect(response.body.data.song.title).toBe('New Song');
      expect(response.body.data.song.owner_id).toBe(testUser.id);
    });

    it('should reject creation when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/songs')
        .send({
          title: 'New Song',
          artist: 'New Artist',
          year: 2023,
          youtube_id: 'xyz789'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate song', async () => {
      await createTestSong(testAgent, {
        title: 'Duplicate Song',
        artist: 'Same Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await testAgent
        .post('/api/songs')
        .send({
          title: 'Duplicate Song',
          artist: 'Same Artist',
          year: 2023,
          youtube_id: 'def456'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/songs/:id', () => {
    it('should update own song', async () => {
      const song = await createTestSong(testAgent, {
        title: 'Original Song',
        artist: 'Original Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await testAgent
        .put(`/api/songs/${song.id}`)
        .send({
          title: 'Updated Song',
          artist: 'Updated Artist',
          year: 2024,
          youtube_id: 'abc123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.song.title).toBe('Updated Song');
      expect(response.body.data.song.artist).toBe('Updated Artist');
    });

    it('should reject update of another user song', async () => {
      const song = await createTestSong(testAgent, {
        title: 'Test Song',
        artist: 'Test Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await otherAgent
        .put(`/api/songs/${song.id}`)
        .send({
          title: 'Hacked Song',
          artist: 'Hacker',
          year: 2024,
          youtube_id: 'abc123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/songs/:id', () => {
    it('should delete own song', async () => {
      const song = await createTestSong(testAgent, {
        title: 'Test Song',
        artist: 'Test Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await testAgent
        .delete(`/api/songs/${song.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject delete of another user song', async () => {
      const song = await createTestSong(testAgent, {
        title: 'Test Song',
        artist: 'Test Artist',
        year: 2023,
        youtube_id: 'abc123'
      });

      const response = await otherAgent
        .delete(`/api/songs/${song.id}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});
