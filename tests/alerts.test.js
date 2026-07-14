const request = require('supertest');
const { app, server } = require('../backend/src/index');
const db = require('../backend/src/db');
const jwt = require('jsonwebtoken');
const config = require('../backend/src/config');
const alertEngine = require('../backend/src/services/alertEngine');

describe('Alerts API Endpoint and Engine Tests', () => {
  let fanToken;
  let staffToken;
  let alertId;
  let fanUser;
  let staffUser;

  beforeAll(() => {
    // Fetch pre-seeded users to ensure they exist in the DB
    fanUser = db.getUser('fan1@stadium.ai');
    staffUser = db.getUser('staff1@stadium.ai');

    fanToken = jwt.sign({ id: fanUser.id, role: fanUser.role }, config.JWT_SECRET, { issuer: config.JWT_ISSUER });
    staffToken = jwt.sign({ id: staffUser.id, role: staffUser.role }, config.JWT_SECRET, { issuer: config.JWT_ISSUER });

    // Seed an alert in database
    const { v4: uuidv4 } = require('uuid');
    const alert = db.addAlert({
      alert_id: uuidv4(),
      type: 'congestion',
      severity: 'medium',
      zone_id: 'zone_a',
      message: 'Congestion detected at Gate A',
      status: 'open',
      timestamp: new Date().toISOString()
    });
    alertId = alert.alert_id;
  });



  test('GET /api/alerts - Should fetch list of alerts for authenticated fan', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${fanToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/alerts/:id - Should fetch details of a specific alert', async () => {
    const res = await request(app)
      .get(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${fanToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.alert_id).toEqual(alertId);
  });

  test('PATCH /api/alerts/:id (Acknowledge) - Should fail for a fan (RBAC check)', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${fanToken}`)
      .send({ action: 'acknowledge' });

    expect(res.statusCode).toEqual(403);
  });

  test('PATCH /api/alerts/:id (Acknowledge) - Should succeed for staff/admin', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'acknowledge' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('acknowledged');
    expect(res.body.acknowledged_by).toEqual(staffUser.id);
  });

  test('PATCH /api/alerts/:id (Resolve) - Should succeed for staff/admin', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'resolve', resolution_note: 'Resolved by path clear.' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('resolved');
  });

  test('AlertEngine - processCrowdEvent should raise alert on critical density', () => {
    let triggered = false;
    alertEngine.init((alertEvent) => {
      if (alertEvent.type === 'congestion' && alertEvent.severity === 'high') {
        triggered = true;
      }
    });

    alertEngine.processCrowdEvent({
      zone_id: 'gate-a',
      max_capacity: 1000,
      current_count: 950,
      percentage: 95,
      density_level: 'critical',
      timestamp: new Date().toISOString()
    });

    expect(triggered).toBe(true);
  });

  test('AlertEngine - processAnomaly should create appropriate alert based on anomaly type', () => {
    const alert = alertEngine.processAnomaly('sec-101', 'medical', { description: 'Fan feeling dizzy' });
    expect(alert.type).toEqual('medical');
    expect(alert.severity).toEqual('critical');
    expect(alert.message).toContain('Medical emergency reported');

    const active = alertEngine.getActiveAlerts({ severity: 'critical' });
    expect(active.length).toBeGreaterThan(0);
  });

  test('AlertEngine - processCrowdEvent should raise alert on high density (medium alert)', () => {
    let triggered = false;
    alertEngine.init((alertEvent) => {
      if (alertEvent.type === 'congestion' && alertEvent.severity === 'medium') {
        triggered = true;
      }
    });

    alertEngine.processCrowdEvent({
      zone_id: 'gate-a',
      max_capacity: 1000,
      current_count: 820,
      percentage: 82,
      density_level: 'high',
      timestamp: new Date().toISOString()
    });

    expect(triggered).toBe(true);
  });

  test('GET /api/alerts/:id - Should return 404 for nonexistent alert ID', async () => {
    const res = await request(app)
      .get('/api/alerts/nonexistent-id')
      .set('Authorization', `Bearer ${fanToken}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('ALERT_NOT_FOUND');
  });

  test('PATCH /api/alerts/:id (Assign) - Should succeed when assigning alert to staff', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'assign', assignee_id: 'staff-assignee-123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.assigned_to).toEqual('staff-assignee-123');
  });

  test('PATCH /api/alerts/:id (Assign) - Should fail if assignee_id is missing', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'assign' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('MISSING_ASSIGNEE');
  });

  test('PATCH /api/alerts/:id - Should fail if alert ID does not exist', async () => {
    const res = await request(app)
      .patch('/api/alerts/nonexistent-id')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'acknowledge' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('ALERT_NOT_FOUND');
  });
});
