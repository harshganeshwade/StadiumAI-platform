/**
 * Health Diagnostics Route (health.js)
 * Diagnostic checks for system uptime, memory usage, and database records.
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/health
 * Returns health checking status diagnostics.
 */
router.get('/', (req, res) => {
  try {
    const memory = process.memoryUsage();
    
    // Fetch statistics safely from in-memory DB arrays and maps
    const activeAlerts = db.getAlerts().length;
    const totalUsers = db.getAllUsers().length;
    
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memory.rss / (1024 * 1024)) + ' MB',
        heapTotal: Math.round(memory.heapTotal / (1024 * 1024)) + ' MB',
        heapUsed: Math.round(memory.heapUsed / (1024 * 1024)) + ' MB'
      },
      stats: {
        active_alerts: activeAlerts,
        total_registered_users: totalUsers
      }
    });
  } catch (err) {
    console.error('[HealthRoute] Diagnostic error:', err);
    res.status(500).json({ status: 'DEGRADED', error: err.message });
  }
});

module.exports = router;
