/**
 * Simulation Routes (simulation.js)
 * Endpoints for running scripted simulation scenarios (normal, crowd surge, fire alarm, extreme heat).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const alertEngine = require('../services/alertEngine');

/**
 * POST /api/simulate
 * Trigger a specific scripted stadium scenario.
 */
router.post('/', (req, res) => {
  try {
    const { scenario } = req.body;
    if (!['normal', 'surge', 'fire', 'heat'].includes(scenario)) {
      return res.status(400).json({ error: 'INVALID_SCENARIO', message: 'Unknown scenario.' });
    }

    db.setActiveScenario(scenario);

    const io = req.app.get('io');
    const fanNamespace = io ? io.of('/fan') : null;
    const dashboardNamespace = io ? io.of('/dashboard') : null;

    if (scenario === 'normal') {
      // Resolve/Clear active alerts
      const activeAlerts = db.getAlerts();
      for (const alert of activeAlerts) {
        if (alert.status !== 'resolved') {
          db.updateAlert(alert.alert_id, { status: 'resolved' });
          if (dashboardNamespace) {
            dashboardNamespace.to('operators').emit('alert:update', { alert_id: alert.alert_id, status: 'resolved' });
          }
        }
      }
    } else if (scenario === 'surge') {
      // Trigger Surge alert
      const alert = alertEngine.processAnomaly('gate-a', 'unauthorized_access', {
        trigger: 'simulation_surge',
        custom_message: 'Gate A crowd density exceeded 94% due to bus arrivals. Estimated queue: 14 mins.',
        recommended_action: 'Open Gate B, deploy 6 stewards to Gate A, update digital signage.'
      });
      if (alert) {
        db.updateAlert(alert.alert_id, {
          type: 'congestion',
          severity: 'high',
          message: 'Gate A crowd density exceeded 94% due to bus arrivals. Estimated queue: 14 mins.',
          recommended_action: 'Open Gate B, deploy 6 stewards to Gate A, update digital signage.'
        });
        if (dashboardNamespace) {
          const updated = db.getAlertById(alert.alert_id);
          dashboardNamespace.to('operators').emit('alert:new', updated);
        }
      }
    } else if (scenario === 'fire') {
      // Trigger Fire alert
      const alert = alertEngine.processAnomaly('sec-106', 'fire', {
        trigger: 'simulation_fire',
        custom_message: 'Fire alarm triggered in Section 106. Evacuation procedures active.',
        recommended_action: 'Evacuate via South Concourse, dispatch medical and fire services, trigger multilingual announcements.'
      });
      if (alert) {
        db.updateAlert(alert.alert_id, {
          severity: 'critical',
          message: 'Fire alarm triggered in Section 106. Evacuation procedures active.',
          recommended_action: 'Evacuate via South Concourse, dispatch medical and fire services, trigger multilingual announcements.'
        });
        if (dashboardNamespace) {
          const updated = db.getAlertById(alert.alert_id);
          dashboardNamespace.to('operators').emit('alert:new', updated);
        }
      }
    } else if (scenario === 'heat') {
      // Trigger Extreme Heat alert
      const alert = alertEngine.processAnomaly('concourse-s', 'weather', {
        trigger: 'simulation_heat',
        custom_message: 'Extreme heat index alert (35°C). Operational adjustments required.',
        recommended_action: 'Increase medical station units to 4, establish hydration checkpoints, deploy volunteers.'
      });
      if (alert) {
        db.updateAlert(alert.alert_id, {
          severity: 'medium',
          message: 'Extreme heat index alert (35°C). Operational adjustments required.',
          recommended_action: 'Increase medical station units to 4, establish hydration checkpoints, deploy volunteers.'
        });
        if (dashboardNamespace) {
          const updated = db.getAlertById(alert.alert_id);
          dashboardNamespace.to('operators').emit('alert:new', updated);
        }
      }
    }

    res.json({
      status: 'OK',
      scenario,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[SimulationRoute] Error triggering scenario:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

module.exports = router;
