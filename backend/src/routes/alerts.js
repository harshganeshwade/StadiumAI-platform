/**
 * Alerts Routes (alerts.js)
 * Endpoints for querying alerts and performing actions like acknowledging,
 * resolving, or assigning to staff (FR-02).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const alertEngine = require('../services/alertEngine');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/alerts
 * Retrieve list of alerts with optional filters.
 */
router.get('/', verifyToken, (req, res) => {
  try {
    const { status, severity, type, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (type) filters.type = type;

    const alerts = db.getAlerts(filters);
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAlerts = alerts.slice(startIndex, endIndex);

    res.json(paginatedAlerts);
  } catch (err) {
    console.error('[AlertsRoute] Error fetching alerts:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve alerts.' });
  }
});

/**
 * GET /api/alerts/:id
 * Retrieve a specific alert by ID.
 */
router.get('/:id', verifyToken, (req, res) => {
  try {
    const alert = db.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'ALERT_NOT_FOUND', message: 'Alert not found.' });
    }
    res.json(alert);
  } catch (err) {
    console.error('[AlertsRoute] Error fetching alert details:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve alert.' });
  }
});

/**
 * PATCH /api/alerts/:id
 * Update an alert status (Acknowledge, Resolve, Assign).
 * Requires staff or admin permissions.
 */
router.patch('/:id', verifyToken, requireRole('staff', 'admin'), (req, res) => {
  try {
    const { action, assignee_id, resolution_note } = req.body;
    const alertId = req.params.id;
    const userId = req.user.id;

    const alert = db.getAlertById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'ALERT_NOT_FOUND', message: 'Alert not found.' });
    }

    let updated = null;

    if (action === 'acknowledge') {
      updated = alertEngine.acknowledgeAlert(alertId, userId);
    } else if (action === 'resolve') {
      updated = alertEngine.resolveAlert(alertId, userId, resolution_note);
    } else if (action === 'assign') {
      if (!assignee_id) {
        return res.status(400).json({ error: 'MISSING_ASSIGNEE', message: 'assignee_id is required to assign alert.' });
      }
      updated = alertEngine.assignAlert(alertId, assignee_id);
    } else {
      // Direct raw patch update
      updated = db.updateAlert(alertId, req.body);
    }

    if (!updated) {
      return res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update alert.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[AlertsRoute] Error updating alert:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update alert.' });
  }
});

module.exports = router;
