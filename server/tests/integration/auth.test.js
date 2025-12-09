const request = require('supertest');
const app = require('../../src/index');
const { createTestUser } = require('../helpers');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with duplicate email', async () => {
      await createTestUser('test@example.com', 'testuser', 'Password123!');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'anotheruser',
          password: 'Password123!'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createTestUser('test@example.com', 'testuser', 'Password123!');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      // Token is set as HTTP-only cookie, not in response body
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      await createTestUser('test@example.com', 'testuser', 'Password123!');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user when authenticated', async () => {
      const { user, agent } = await createTestUser('test@example.com', 'testuser', 'Password123!');

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should reject when unauthenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { agent } = await createTestUser('test@example.com', 'testuser', 'Password123!');

      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});
