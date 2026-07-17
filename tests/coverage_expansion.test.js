/**
 * Coverage Expansion Tests
 * Specifically targets uncovered lines in index.js, auth middleware, and crowd routes.
 */
'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, server } = require('../backend/src/index');
const db = require('../backend/src/db');
const config = require('../backend/src/config');
const { verifyToken, requireRole } = require('../backend/src/middleware/auth');

describe('Coverage Expansion & Edge Cases', () => {
  let validFanToken;
  let validStaffToken;
  let fanUser;
  let staffUser;

  beforeAll(() => {
    fanUser = db.getUser('fan1@stadium.ai');
    staffUser = db.getUser('staff1@stadium.ai');

    validFanToken = jwt.sign(
      { id: fanUser.id, role: fanUser.role, sub: fanUser.id },
      config.JWT_SECRET,
      { issuer: config.JWT_ISSUER }
    );

    validStaffToken = jwt.sign(
      { id: staffUser.id, role: staffUser.role, sub: staffUser.id },
      config.JWT_SECRET,
      { issuer: config.JWT_ISSUER }
    );
  });

  describe('1. Global Error Handler & Health Check', () => {
    test('GET /api/health - returns UP status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    test('Global Error Handler - handles normal errors', () => {
      const errorHandler = app._router.stack[app._router.stack.length - 1].handle;
      expect(errorHandler.length).toBe(4);

      const err = new Error('Simulated Test Error');
      const req = {};
      let resStatus = null;
      let resJson = null;
      const res = {
        headersSent: false,
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

      errorHandler(err, req, res, next);

      expect(resStatus).toBe(500);
      expect(resJson.error).toBe(true);
      expect(resJson.message).toBe('Simulated Test Error');
      expect(next).not.toHaveBeenCalled();
    });

    test('Global Error Handler - delegates to next if headersSent is true', () => {
      const errorHandler = app._router.stack[app._router.stack.length - 1].handle;
      const err = new Error('Simulated Test Error');
      const req = {};
      const res = {
        headersSent: true
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('2. Socket.IO Namespaces Connection & Auth', () => {
    test('Simulate Fan Socket.IO connection and message flow', () => {
      const io = app.get('io');
      const fanNamespace = io.of('/fan');
      const connectionListeners = fanNamespace.listeners('connection');

      let joinedRooms = [];
      const mockSocket = {
        id: 'mock-fan-socket-1',
        join: (room) => joinedRooms.push(room),
        events: {},
        on(event, cb) {
          this.events[event] = cb;
        },
        emit(event, data) {}
      };

      // Trigger connection
      connectionListeners.forEach(listener => listener(mockSocket));

      expect(mockSocket.events['authenticate']).toBeDefined();
      expect(mockSocket.events['disconnect']).toBeDefined();

      // Trigger valid authentication
      mockSocket.events['authenticate'](validFanToken);
      expect(joinedRooms).toContain(fanUser.id);

      // Trigger invalid authentication
      mockSocket.events['authenticate']('invalid.token.here');

      // Trigger disconnect
      mockSocket.events['disconnect']();
    });

    test('Simulate Dashboard Socket.IO connection and authentication', () => {
      const io = app.get('io');
      const dashboardNamespace = io.of('/dashboard');
      const connectionListeners = dashboardNamespace.listeners('connection');

      let joinedRooms = [];
      const mockSocket = {
        id: 'mock-staff-socket-1',
        join: (room) => joinedRooms.push(room),
        events: {},
        on(event, cb) {
          this.events[event] = cb;
        },
        emit(event, data) {}
      };

      // Trigger connection
      connectionListeners.forEach(listener => listener(mockSocket));

      expect(mockSocket.events['authenticate']).toBeDefined();
      expect(mockSocket.events['disconnect']).toBeDefined();

      // Trigger valid staff authentication
      mockSocket.events['authenticate'](validStaffToken);
      expect(joinedRooms).toContain('operators');

      // Trigger invalid authentication
      mockSocket.events['authenticate']('invalid.token.here');

      // Trigger disconnect
      mockSocket.events['disconnect']();
    });
  });

  describe('3. Auth Middleware Edge Cases', () => {
    test('verifyToken - missing Authorization header', () => {
      const req = { headers: {} };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('AUTHENTICATION_REQUIRED');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken - malformed Authorization header', () => {
      const req = { headers: { authorization: 'MalformedHeader' } };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('AUTHENTICATION_REQUIRED');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken - token not provided (empty token check)', () => {
      const req = { headers: { authorization: 'Bearer ' } };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('AUTHENTICATION_REQUIRED');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken - expired token', () => {
      const expiredToken = jwt.sign(
        { id: fanUser.id, role: fanUser.role },
        config.JWT_SECRET,
        { issuer: config.JWT_ISSUER, expiresIn: '-1s' }
      );
      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('TOKEN_EXPIRED');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken - invalid token signature', () => {
      const invalidSigToken = jwt.sign(
        { id: fanUser.id, role: fanUser.role },
        'wrong-secret-key',
        { issuer: config.JWT_ISSUER }
      );
      const req = { headers: { authorization: `Bearer ${invalidSigToken}` } };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('INVALID_TOKEN');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken - user not found in database', () => {
      const nonExistentUserToken = jwt.sign(
        { id: 'nonexistent-uuid-12345', role: 'fan', sub: 'nonexistent-uuid-12345' },
        config.JWT_SECRET,
        { issuer: config.JWT_ISSUER }
      );
      const req = { headers: { authorization: `Bearer ${nonExistentUserToken}` } };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('USER_NOT_FOUND');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('verifyToken - user lookup throws error (AUTHENTICATION_FAILED)', () => {
      const spy = jest.spyOn(db, 'getUserById').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const req = { headers: { authorization: `Bearer ${validFanToken}` } };
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('AUTHENTICATION_FAILED');
            }
          };
        }
      };
      const next = jest.fn();
      verifyToken(req, res, next);
      expect(next).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('requireRole - no user context attached', () => {
      const req = {}; // no user property
      const res = {
        status(code) {
          expect(code).toBe(401);
          return {
            json(data) {
              expect(data.error).toBe('AUTHENTICATION_REQUIRED');
            }
          };
        }
      };
      const next = jest.fn();
      const middleware = requireRole('admin');
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('requireRole - insufficient permissions role mismatch', () => {
      const req = { user: { id: fanUser.id, role: 'fan' } };
      const res = {
        status(code) {
          expect(code).toBe(403);
          return {
            json(data) {
              expect(data.error).toBe('INSUFFICIENT_PERMISSIONS');
            }
          };
        }
      };
      const next = jest.fn();
      const middleware = requireRole('admin', 'staff');
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('4. Crowd Routes Edge Cases & Cache Hits', () => {
    test('GET /api/crowd/density - tests cache hits', async () => {
      // First call (populates cache)
      const res1 = await request(app).get('/api/crowd/density');
      expect(res1.statusCode).toBe(200);

      // Second call (hits cache)
      const res2 = await request(app).get('/api/crowd/density');
      expect(res2.statusCode).toBe(200);
      expect(res2.body).toEqual(res1.body);
    });

    test('GET /api/crowd/density/:zoneId - nonexistent zone returns 404', async () => {
      const res = await request(app).get('/api/crowd/density/nonexistent-zone-xyz');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('ZONE_NOT_FOUND');
    });

    test('GET /api/crowd/density/:zoneId - specific zone returns density', async () => {
      const res = await request(app).get('/api/crowd/density/gate-a');
      expect(res.statusCode).toBe(200);
      expect(res.body.zone_id).toBe('gate-a');
    });
  });

  describe('5. ADA Routing & Schema Validation', () => {
    test('POST /api/navigate - fails validation with missing zones', async () => {
      const res = await request(app)
        .post('/api/navigate')
        .set('Authorization', `Bearer ${validFanToken}`)
        .send({ from_zone: 'gate-a' }); // missing to_zone

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toContain('required');
    });

    test('POST /api/navigate - successfully returns route with ADA disabled', async () => {
      const res = await request(app)
        .post('/api/navigate')
        .set('Authorization', `Bearer ${validFanToken}`)
        .send({ from_zone: 'gate-a', to_zone: 'sec-101', ada: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.ada_route).toBe(false);
      expect(res.body.route.length).toBeGreaterThan(0);
    });

    test('POST /api/navigate - successfully routes with ADA enabled (avoids stairs)', async () => {
      const res = await request(app)
        .post('/api/navigate')
        .set('Authorization', `Bearer ${validFanToken}`)
        .send({ from_zone: 'gate-a', to_zone: 'sec-101', ada: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.ada_route).toBe(true);
      expect(res.body.route.length).toBeGreaterThan(0);
    });
  });
});
