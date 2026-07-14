/**
 * Recommendation Routes (recommend.js)
 * Endpoints for personalized items (food, merch, parking) based on proximity (FR-06).
 */
'use strict';

const express = require('express');
const router = express.Router();
const recommendation = require('../services/recommendation');
const db = require('../db');
const TTLCache = require('../utils/cache');

const cache = new TTLCache(5000); // 5 seconds cache

/**
 * GET /api/recommendations
 * Query recommendations for a user.
 */
router.get('/', (req, res) => {
  try {
    const { category, zone_id, user_id } = req.query;
    const cacheKey = `${category || 'any'}_${zone_id || 'any'}_${user_id || 'any'}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Call recommendation service
    const items = recommendation.getRecommendations(user_id || null, category, zone_id);
    cache.set(cacheKey, items);
    res.json(items);
  } catch (err) {
    console.error('[RecommendRoute] Recommendation error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve recommendations.' });
  }
});

module.exports = router;
