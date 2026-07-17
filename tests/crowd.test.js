const request = require('supertest');
const { app, server } = require('../backend/src/index');
const crowdAnalytics = require('../backend/src/services/crowdAnalytics');
const recommendation = require('../backend/src/services/recommendation');
const db = require('../backend/src/db');
const jwt = require('jsonwebtoken');
const config = require('../backend/src/config');

describe('Crowd Density and Navigation Route Tests', () => {
  let fanToken;

  beforeAll(() => {
    const fanUser = db.getUser('fan1@stadium.ai');
    fanToken = jwt.sign({ id: fanUser.id, role: fanUser.role }, config.JWT_SECRET, { issuer: config.JWT_ISSUER });
  });

  test('GET /api/crowd/zones - Should fetch list of all stadium zones', async () => {
    const res = await request(app).get('/api/crowd/zones');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/crowd/density - Should fetch crowd densities for all zones', async () => {
    const res = await request(app).get('/api/crowd/density');
    expect(res.statusCode).toEqual(200);
    expect(typeof res.body).toBe('object');
  });

  test('GET /api/crowd/density/:zoneId - Should return density for specific zone', async () => {
    const res = await request(app).get('/api/crowd/density/gate-a');
    expect(res.statusCode).toEqual(200);
    expect(res.body.zone_id).toEqual('gate-a');
  });

  test('POST /api/navigate - Should return route from gate-a to vip-lounge', async () => {
    const res = await request(app)
      .post('/api/navigate')
      .set('Authorization', `Bearer ${fanToken}`)
      .send({
        from_zone: 'gate-a',
        to_zone: 'vip-lounge'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('route');
    expect(res.body.route.length).toBeGreaterThan(0);
    expect(res.body.route[0]).toEqual('gate-a');
  });

  test('POST /api/navigate - Should fail if target zone is unknown', async () => {
    const res = await request(app)
      .post('/api/navigate')
      .set('Authorization', `Bearer ${fanToken}`)
      .send({
        from_zone: 'gate-a',
        to_zone: 'unknown-zone'
      });

    expect(res.statusCode).toEqual(400);
  });

  test('Dijkstra Routing - Should return static route if no crowd data exists (degraded: true)', () => {
    // Force clear crowd data to test static fallback (degraded: true)
    const originalDensities = crowdAnalytics.getAllDensities;
    crowdAnalytics.getAllDensities = () => ({}); // Mock empty
    crowdAnalytics.getZoneDensity = () => null;

    const routeData = recommendation.findRoute('gate-a', 'vip-lounge');
    expect(routeData.degraded).toBe(true);
    expect(routeData.congestion_aware).toBe(false);

    // Restore
    crowdAnalytics.getAllDensities = originalDensities;
  });

  test('Dijkstra Routing - Should adjust route times under critical congestion levels', () => {
    const originalGetZoneDensity = crowdAnalytics.getZoneDensity;
    const originalGetAllDensities = crowdAnalytics.getAllDensities;

    // Mock high crowd density for 'concourse-n'
    crowdAnalytics.getAllDensities = () => ({ 'concourse-n': { density_level: 'critical' } });
    crowdAnalytics.getZoneDensity = (zoneId) => {
      if (zoneId === 'concourse-n') {
        return { density_level: 'critical', percentage: 95 };
      }
      return { density_level: 'low', percentage: 10 };
    };

    const routeData = recommendation.findRoute('gate-a', 'vip-lounge');
    expect(routeData.degraded).toBe(false);
    expect(routeData.congestion_aware).toBe(true);

    // Restore
    crowdAnalytics.getZoneDensity = originalGetZoneDensity;
    crowdAnalytics.getAllDensities = originalGetAllDensities;
  });

  test('crowdAnalytics.processRawSensorData - Should process turnstile and camera readings and update density', () => {
    const event1 = crowdAnalytics.processRawSensorData('gate-a', 400, 'turnstile');
    expect(event1.zone_id).toEqual('gate-a');
    expect(event1.source).toEqual('turnstile');
    expect(event1.confidence).toEqual(0.98);

    // Multiple sources fusion
    const event2 = crowdAnalytics.processRawSensorData('gate-a', 380, 'camera');
    expect(event2.sources_count).toBeGreaterThan(1);
  });
});
