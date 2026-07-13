/**
 * Crowd Density Routes (crowd.js)
 * Endpoints for querying crowd density levels and stadium zones (FR-03).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const crowdAnalytics = require('../services/crowdAnalytics');

/**
 * GET /api/crowd/density
 * Retrieve density metrics for all zones.
 */
router.get('/density', (req, res) => {
  try {
    const densities = crowdAnalytics.getAllDensities();
    res.json(densities);
  } catch (err) {
    console.error('[CrowdRoute] Error getting densities:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve densities.' });
  }
});

/**
 * GET /api/crowd/density/:zoneId
 * Retrieve density metrics for a specific zone.
 */
router.get('/density/:zoneId', (req, res) => {
  try {
    const density = crowdAnalytics.getZoneDensity(req.params.zoneId);
    if (!density) {
      // Return a simulated low density if there's no active sensor reading yet
      const zone = db.getZone(req.params.zoneId);
      if (!zone) {
        return res.status(404).json({ error: 'ZONE_NOT_FOUND', message: 'Zone not found.' });
      }
      return res.json({
        event_id: 'default',
        zone_id: req.params.zoneId,
        current_count: 0,
        max_capacity: zone.capacity,
        percentage: 0,
        density_level: 'low',
        confidence: 1.0,
        trend: 'stable',
        source: 'default',
        timestamp: new Date().toISOString()
      });
    }
    res.json(density);
  } catch (err) {
    console.error('[CrowdRoute] Error getting zone density:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve zone density.' });
  }
});

/**
 * GET /api/crowd/zones
 * Retrieve list of all stadium zones.
 */
router.get('/zones', (req, res) => {
  try {
    const zones = db.getZones();
    res.json(zones);
  } catch (err) {
    console.error('[CrowdRoute] Error getting zones:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve stadium zones.' });
  }
});

module.exports = router;
