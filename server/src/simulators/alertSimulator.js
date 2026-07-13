/**
 * Alert Simulator (alertSimulator.js)
 * Periodically generates mock operational alerts/anomalies (medical,
 * equipment failure, lost child, unauthorized access, suspicious activity).
 */
'use strict';

const db = require('../db');
const alertEngine = require('../services/alertEngine');

let timeoutId = null;
let running = false;

const ANOMALY_TYPES = [
  'unauthorized_access',
  'medical',
  'lost_child',
  'equipment',
  'weather',
  'suspicious_activity',
  'fire'
];

/**
 * Start alert simulator.
 */
function start() {
  if (running) return;
  running = true;
  scheduleNextAlert();
}

function stop() {
  running = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function scheduleNextAlert() {
  if (!running) return;

  // Schedule an alert every 15-35 seconds
  const delay = 15000 + Math.random() * 20000;
  timeoutId = setTimeout(() => {
    generateRandomAlert();
    scheduleNextAlert();
  }, delay);
}

function generateRandomAlert() {
  const zones = db.getZones();
  const randomZone = zones[Math.floor(Math.random() * zones.length)];
  const randomType = ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)];

  // Don't trigger code adam or fires too often
  if ((randomType === 'fire' || randomType === 'lost_child') && Math.random() > 0.3) {
    // skip or downgrade to equipment or suspicious_activity
    const fallbackTypes = ['equipment', 'suspicious_activity', 'medical'];
    const type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
    alertEngine.processAnomaly(randomZone.zone_id, type);
  } else {
    alertEngine.processAnomaly(randomZone.zone_id, randomType);
  }
}

module.exports = {
  start,
  stop
};
