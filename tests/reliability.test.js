/**
 * StadiumAI Reliability and Resilience Tests
 */
'use strict';

const request = require('supertest');
const { app, server } = require('../backend/src/index');
const config = require('../backend/src/config');
const db = require('../backend/src/db');
const recommendation = require('../backend/src/services/recommendation');
const jwt = require('jsonwebtoken');

describe('Platform Reliability & Resilience Tests', () => {
  let token;

  beforeAll(() => {
    const fanUser = db.getUser('fan1@stadium.ai');
    token = jwt.sign({ id: fanUser.id, role: fanUser.role }, config.JWT_SECRET, { issuer: config.JWT_ISSUER });
  });

  // 1. Language Fallback Circuit Breaker Tests
  test('Should return localized circuit breaker fallback message in Spanish when timeout occurs', async () => {
    const originalTimeout = config.AI_MODEL_TIMEOUT_MS;
    config.AI_MODEL_TIMEOUT_MS = 1; // force immediate timeout

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        session_id: 'test-reliability-es',
        message: 'Dónde está mi asiento?',
        language: 'es'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.intent).toEqual('fallback_timeout');
    // Spanish translation of timeout fallback should be loaded
    expect(res.body.reply).toContain('preguntas frecuentes estáticas');
    expect(res.body.suggested_actions[0].label).toEqual('Hablar con personal');

    config.AI_MODEL_TIMEOUT_MS = originalTimeout;
  });

  test('Should return localized circuit breaker fallback message in French when timeout occurs', async () => {
    const originalTimeout = config.AI_MODEL_TIMEOUT_MS;
    config.AI_MODEL_TIMEOUT_MS = 1; // force immediate timeout

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        session_id: 'test-reliability-fr',
        message: 'Où est mon siège?',
        language: 'fr'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.intent).toEqual('fallback_timeout');
    // French translation of timeout fallback should be loaded
    expect(res.body.reply).toContain('FAQ statique');
    expect(res.body.suggested_actions[0].label).toEqual('Parler au personnel');

    config.AI_MODEL_TIMEOUT_MS = originalTimeout;
  });

  // 2. Dijkstra Routing safeguards
  test('findRoute should return degraded status and handle unreachable zones gracefully', () => {
    // Passing completely invalid zones
    const result = recommendation.findRoute('nonexistent-start-zone', 'sec-102');
    expect(result.degraded).toBe(true);
    expect(result.error).toContain('Unknown zone');

    // Passing invalid destination zone
    const resultDest = recommendation.findRoute('sec-101', 'nonexistent-dest-zone');
    expect(resultDest.degraded).toBe(true);
    expect(resultDest.error).toContain('Unknown zone');
  });

  test('findRoute should handle corrupt live telemetry configurations gracefully', () => {
    // Seed a corrupt telemetry data point with negative capacity or NaN
    db.setCrowdDensity('sec-102', {
      zone_id: 'sec-102',
      density_level: 'high',
      percentage: -50, // corrupt negative percentage
      current_count: NaN // corrupt NaN current count
    });

    // Request pathfinding through sec-102
    const pathResult = recommendation.findRoute('sec-101', 'sec-103');
    expect(pathResult.error).toBeUndefined();
    expect(pathResult.route.length).toBeGreaterThan(0);
    
    // Clean up
    db.setCrowdDensity('sec-102', null);
  });

  // 3. Input Validation, Limits, and HTML Sanitization
  test('POST /api/chat - Should block messages exceeding 500 characters', async () => {
    const extraLongMsg = 'a'.repeat(501);
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: extraLongMsg
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual(true);
    expect(res.body.message).toContain('at most 500 characters');
  });

  test('POST /api/chat - Should sanitize script tags from messages', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: '<script>alert("XSS")</script>Where is my seat?',
        language: 'en',
        context: { zone: 'sec-102' }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.intent).toEqual('seating');
    // Verify script tags were completely stripped and not executed
    expect(res.body.reply).not.toContain('<script>');
  });

  // 4. In-Memory Database limits
  test('In-memory DB should restrict chat session history size to 50 messages max', () => {
    const sessionId = 'test-pruning-session';
    
    // Insert 55 messages
    for (let i = 0; i < 55; i++) {
      db.addChatMessage(sessionId, {
        role: 'user',
        content: `Message ${i}`,
        timestamp: new Date().toISOString()
      });
    }

    const session = db.getChatSession(sessionId);
    expect(session.messages.length).toEqual(50);
    // Oldest messages (0 to 4) should be pruned
    expect(session.messages[0].content).toEqual('Message 5');
  });

  test('In-memory DB should cap total chat sessions to 100 max', () => {
    // Clear initial sessions if any to verify limit accurately
    for (let i = 0; i < 110; i++) {
      db.createChatSession(`session-id-${i}`);
    }

    // Attempting to query session-id-0 should return null as it was shift-deleted (FIFO)
    const oldestSession = db.getChatSession('session-id-0');
    expect(oldestSession).toBeNull();

    // Verify session-id-109 still exists
    const latestSession = db.getChatSession('session-id-109');
    expect(latestSession).not.toBeNull();
  });

  // 5. Health Diagnostic Checks Route
  test('GET /api/health should return status OK and diagnostic metadata', async () => {
    const res = await request(app)
      .get('/api/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toEqual('UP');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('memory');
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('active_alerts');
    expect(res.body.stats).toHaveProperty('total_registered_users');
  });

  // 6. Scenario Simulation Controller Tests
  test('POST /api/simulate - Should block invalid scenario keys', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ scenario: 'unknown-key' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('INVALID_SCENARIO');
  });

  test('POST /api/simulate - Should configure Surge scenario and trigger congestion alert', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ scenario: 'surge' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.scenario).toEqual('surge');
    expect(db.getActiveScenario()).toEqual('surge');

    // Confirm that a high severity congestion alert was raised
    const alerts = db.getAlerts();
    const surgeAlert = alerts.find(a => a.zone_id === 'gate-a' && a.severity === 'high');
    expect(surgeAlert).toBeDefined();
    expect(surgeAlert.type).toEqual('congestion');
  });

  test('POST /api/simulate - Should configure Fire scenario and trigger critical fire alert', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ scenario: 'fire' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.scenario).toEqual('fire');
    expect(db.getActiveScenario()).toEqual('fire');

    const alerts = db.getAlerts();
    const fireAlert = alerts.find(a => a.zone_id === 'sec-106' && a.severity === 'critical');
    expect(fireAlert).toBeDefined();
    expect(fireAlert.type).toEqual('fire');
  });

  test('POST /api/simulate - Should configure Heat scenario and trigger weather warnings', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ scenario: 'heat' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.scenario).toEqual('heat');
    expect(db.getActiveScenario()).toEqual('heat');

    const alerts = db.getAlerts();
    const heatAlert = alerts.find(a => a.zone_id === 'concourse-s' && a.type === 'weather');
    expect(heatAlert).toBeDefined();
    expect(heatAlert.severity).toEqual('medium');
  });

  test('POST /api/simulate - Should clear active alerts on Normal scenario', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ scenario: 'normal' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.scenario).toEqual('normal');
    expect(db.getActiveScenario()).toEqual('normal');

    // Confirm alerts are cleared or resolved
    const activeAlerts = db.getAlerts({ status: 'open' });
    expect(activeAlerts.length).toEqual(0);
  });

  // 7. Database edge cases
  test('db.updateAlert should return null on non-existent alert ID', () => {
    const result = db.updateAlert('non-existent-alert-uuid', { status: 'resolved' });
    expect(result).toBeNull();
  });

  test('db.getRecommendationById should return null on non-existent recommendation ID', () => {
    const result = db.getRecommendationById('non-existent-rec-uuid');
    expect(result).toBeNull();
  });

  // 8. Custom Error Classes
  test('Custom error classes should construct correctly with status codes', () => {
    const { HttpStatus, AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } = require('../backend/src/utils/errors');
    
    const appErr = new AppError('App Err', 500, 'APP_ERR');
    expect(appErr.statusCode).toEqual(500);
    expect(appErr.errorCode).toEqual('APP_ERR');

    const badRequest = new BadRequestError('Bad req', 'BAD_REQ');
    expect(badRequest.statusCode).toEqual(400);

    const unauthorized = new UnauthorizedError('Unauth', 'UNAUTH');
    expect(unauthorized.statusCode).toEqual(401);

    const forbidden = new ForbiddenError('Forbid', 'FORBID');
    expect(forbidden.statusCode).toEqual(403);

    const notFound = new NotFoundError('Not found', 'NOT_FOUND');
    expect(notFound.statusCode).toEqual(404);
  });

  // 9. Input Validation Type Mismatch and Regex
  test('POST /api/chat - Should reject non-string message types', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 12345 // number instead of string
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual(true);
    expect(res.body.message).toContain('must be of type "string"');
  });

  test('validator.js - should fail validation when regular expression mismatches', () => {
    const { validateBody } = require('../backend/src/middleware/validator');
    const middleware = validateBody({
      email: { required: true, type: 'string', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
    });
    const req = { body: { email: 'invalid-email-format' } };
    const res = {};
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('invalid');
  });

  // 10. Rate Limiter Trigger
  test('rateLimit.js - should block requests when limits are exceeded', () => {
    const { rateLimit } = require('../backend/src/middleware/rateLimit');
    const middleware = rateLimit({ windowMs: 60000, maxRequests: 2 });
    const req = { ip: '127.0.0.1', headers: {} };
    let resStatus = null;
    let resJson = null;
    const res = {
      set(header, val) {},
      status(code) {
        resStatus = code;
        return {
          json(data) {
            resJson = data;
          }
        };
      }
    };
    const next = jest.fn();

    // First two pass
    middleware(req, res, next);
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    // Third triggers limit
    middleware(req, res, next);
    expect(resStatus).toBe(429);
    expect(resJson.error).toBe('RATE_LIMIT_EXCEEDED');
  });

  // 11. Alerts route update failure path
  test('PATCH /api/alerts/:id - handles database update failure', async () => {
    const originalUpdateAlert = db.updateAlert;
    db.updateAlert = () => null;

    const alertsList = db.getAlerts();
    const alertId = alertsList[0].alert_id;
    const staffUser = db.getUser('staff1@stadium.ai');
    const staffToken = jwt.sign({ id: staffUser.id, role: 'staff' }, config.JWT_SECRET, { issuer: config.JWT_ISSUER });

    const res = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'raw_patch_fail' });

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toEqual('UPDATE_FAILED');

    db.updateAlert = originalUpdateAlert;
  });

  // 12. Authentication route branches
  test('POST /api/auth/register - blocks registration as staff/admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Spy Ops',
        email: 'spy@stadium.ai',
        password: 'password123',
        role: 'staff'
      });
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toEqual('UNAUTHORIZED_ROLE');
  });

  test('POST /api/auth/register - blocks duplicate emails', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex Fan Duplicate',
        email: 'fan1@stadium.ai',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('EMAIL_EXISTS');
  });

  test('POST /api/auth/register - blocks weak passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weakling',
        email: 'weak@stadium.ai',
        password: '123'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('WEAK_PASSWORD');
  });

  test('POST /api/auth/register - requires fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'missing@stadium.ai',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('MISSING_FIELDS');
  });

  test('POST /api/auth/login - requires fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'fan1@stadium.ai'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('MISSING_FIELDS');
  });

  test('POST /api/auth/login - returns 401 on unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@stadium.ai',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toEqual('INVALID_CREDENTIALS');
  });

  test('POST /api/auth/login - returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'fan1@stadium.ai',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toEqual('INVALID_CREDENTIALS');
  });
});
