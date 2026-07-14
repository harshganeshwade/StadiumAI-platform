/**
 * Crowd Density Routes (crowd.js)
 * Endpoints for querying crowd density levels and stadium zones (FR-03).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const crowdAnalytics = require('../services/crowdAnalytics');

const TTLCache = require('../utils/cache');
const densityCache = new TTLCache(3000); // 3 seconds cache
const zoneCache = new TTLCache(3000);

/**
 * GET /api/crowd/density
 * Retrieve density metrics for all zones.
 */
router.get('/density', (req, res) => {
  try {
    const cacheKey = 'all_densities';
    const cached = densityCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const densities = crowdAnalytics.getAllDensities();
    densityCache.set(cacheKey, densities);
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
    const { zoneId } = req.params;
    const cached = zoneCache.get(zoneId);
    if (cached) {
      return res.json(cached);
    }

    const density = crowdAnalytics.getZoneDensity(zoneId);
    if (!density) {
      // Return a simulated low density if there's no active sensor reading yet
      const zone = db.getZone(zoneId);
      if (!zone) {
        return res.status(404).json({ error: 'ZONE_NOT_FOUND', message: 'Zone not found.' });
      }
      const responseData = {
        event_id: 'default',
        zone_id: zoneId,
        current_count: 0,
        max_capacity: zone.capacity,
        percentage: 0,
        density_level: 'low',
        confidence: 1.0,
        trend: 'stable',
        source: 'default',
        timestamp: new Date().toISOString()
      };
      zoneCache.set(zoneId, responseData);
      return res.json(responseData);
    }
    zoneCache.set(zoneId, density);
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
