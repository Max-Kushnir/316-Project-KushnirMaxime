const request = require('supertest');
const app = require('../../src/index');
const { createTestUser } = require('../helpers');

describe('Users API', () => {
  let testUser;
  let testAgent;

  beforeEach(async () => {
    const result = await createTestUser('test@example.com', 'testuser', 'Password123!');
    testUser = result.user;
    testAgent = result.agent;
  });

  describe('GET /api/users/:id', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update own profile', async () => {
      const response = await testAgent
        .put(`/api/users/${testUser.id}`)
        .send({
          username: 'updateduser'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('updateduser');
    });

    it('should reject update with invalid password', async () => {
      const response = await testAgent
        .put(`/api/users/${testUser.id}`)
        .send({
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject update of another user profile', async () => {
      const { user: otherUser } = await createTestUser('other@example.com', 'otheruser', 'Password123!');

      const response = await testAgent
        .put(`/api/users/${otherUser.id}`)
        .send({
          username: 'hacker'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});
