/**
 * Navigation Routes (navigation.js)
 * Endpoints for optimal route generation considering live congestion (FR-05).
 */
'use strict';

const express = require('express');
const router = express.Router();
const recommendation = require('../services/recommendation');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/navigate
 * Calculate optimal route from one zone to another.
 */
router.post('/', verifyToken, (req, res) => {
  try {
    const { from_zone, to_zone } = req.body;

    if (!from_zone || !to_zone) {
      return res.status(400).json({ error: 'MISSING_ZONES', message: 'from_zone and to_zone are required.' });
    }

    const routeData = recommendation.findRoute(from_zone, to_zone);
    if (routeData.error) {
      return res.status(400).json({ error: 'ROUTING_FAILED', message: routeData.error });
    }

    res.json(routeData);
  } catch (err) {
    console.error('[NavigationRoute] Routing error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to calculate route.' });
  }
});

module.exports = router;
