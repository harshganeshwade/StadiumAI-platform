const request = require('supertest');
const { app, server } = require('../backend/src/index');
const db = require('../backend/src/db');

describe('Authentication API Endpoint Tests', () => {
  let token;
  const testUser = {
    name: 'Test Fan User',
    email: `fan-${Date.now()}@test.com`,
    password: 'password123',
    role: 'fan',
    preferred_language: 'en'
  };



  test('POST /api/auth/register - Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toEqual(testUser.email);
    expect(res.body.user.role).toEqual('fan');
    token = res.body.token;
  });

  test('POST /api/auth/register - Should fail if email already exists', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('EMAIL_EXISTS');
  });

  test('POST /api/auth/register - Should fail to self-register as staff/admin (fail-closed check)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        email: `staff-${Date.now()}@test.com`,
        role: 'staff'
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toEqual('UNAUTHORIZED_ROLE');
  });

  test('POST /api/auth/login - Should log in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(testUser.email);
  });

  test('POST /api/auth/login - Should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toEqual('INVALID_CREDENTIALS');
  });

  test('GET /api/auth/me - Should fetch profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.user.id).toBeDefined();
  });

  test('GET /api/auth/me - Should fail profile retrieval with missing token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toEqual(401);
  });

  test('POST /api/auth/reset-password - Should successfully reset password', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testUser.email,
        password: 'newpassword123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain('successful');
  });

  test('POST /api/auth/register - Should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('MISSING_FIELDS');
  });

  test('POST /api/auth/login - Should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('MISSING_FIELDS');
  });
});
