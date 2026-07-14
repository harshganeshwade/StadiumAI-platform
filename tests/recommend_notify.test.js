const request = require('supertest');
const { app, server } = require('../backend/src/index');
const db = require('../backend/src/db');
const jwt = require('jsonwebtoken');
const config = require('../backend/src/config');

describe('Recommendations and Notifications Routes Tests', () => {
  let adminToken;
  let adminUser;
  let fanUser;

  beforeAll(() => {
    adminUser = db.getUser('admin@stadium.ai');
    fanUser = db.getUser('fan1@stadium.ai');

    adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, config.JWT_SECRET, { issuer: config.JWT_ISSUER });
  });

  afterAll((done) => {
    // No explicit close needed since it is removed globally, but keep it clean
    done();
  });

  test('GET /api/recommendations - Should fetch recommendations without filters', async () => {
    const res = await request(app).get('/api/recommendations');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/recommendations - Should filter by category food', async () => {
    const res = await request(app).get('/api/recommendations?category=food');
    expect(res.statusCode).toEqual(200);
    expect(res.body.every(item => item.category === 'food')).toBe(true);
  });

  test('GET /api/notifications/:userId - Should fetch notifications for fanUser', async () => {
    const res = await request(app).get(`/api/notifications/${fanUser.id}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/notifications/broadcast - Should broadcast message as admin', async () => {
    const res = await request(app)
      .post('/api/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'emergency',
        severity: 'high',
        message: 'Weather warning: please stay covered'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.user_id).toEqual('*');
    expect(res.body.message).toContain('Weather warning');
  });

  test('POST /api/notifications/send - Should send targeted message as admin', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: fanUser.id,
        type: 'general',
        severity: 'low',
        message: 'Your order is ready at North Concourse'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.user_id).toEqual(fanUser.id);
  });

  test('POST /api/notifications/send - Should fail if input is invalid', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: fanUser.id
      });

    expect(res.statusCode).toEqual(400);
  });

  test('rateLimit middleware - Should return 429 after exceeding maxRequests', async () => {
    const { rateLimit } = require('../backend/src/middleware/rateLimit');
    const express = require('express');
    const limiterApp = express();
    limiterApp.use(rateLimit({ windowMs: 1000, maxRequests: 2, message: 'Custom limit' }));
    limiterApp.get('/test-limit', (req, res) => res.send('ok'));

    const r1 = await request(limiterApp).get('/test-limit');
    expect(r1.statusCode).toBe(200);

    const r2 = await request(limiterApp).get('/test-limit');
    expect(r2.statusCode).toBe(200);

    const r3 = await request(limiterApp).get('/test-limit');
    expect(r3.statusCode).toBe(429);
    expect(r3.body.error).toEqual('RATE_LIMIT_EXCEEDED');
  });

  test('Mock DB Functions - Should return correct values for direct lookups', () => {
    expect(db.getAllUsers().length).toBeGreaterThan(0);
    expect(db.getZoneCapacity('gate-a')).toEqual(5000);
    expect(db.getZoneCapacity('nonexistent')).toBeNull();
    expect(db.getRecommendationById('nonexistent')).toBeNull();
  });

  test('TTLCache - Should expire entries and support clear', async () => {
    const TTLCache = require('../backend/src/utils/cache');
    const cache = new TTLCache(10); // 10ms expiry
    cache.set('key', 'val');
    expect(cache.get('key')).toEqual('val');

    await new Promise(resolve => setTimeout(resolve, 15));
    expect(cache.get('key')).toBeNull();

    cache.set('key2', 'val2');
    cache.clear();
    expect(cache.get('key2')).toBeNull();
  });
});
