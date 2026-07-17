/**
 * Alert Engine Service (FR-02)
 * Generates, stores, and emits alerts based on crowd events and anomalies.
 * Alert output matches AlertEvent contract (spec 3.2).
 */
'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/** Callback for emitting alerts (set via init) */
let _emitCallback = null;

/**
 * Initialise the alert engine with an emit callback.
 * @param {Function} emitCallback – called with (alert) when a new alert is created
 */
function init(emitCallback) {
  if (typeof emitCallback === 'function') {
    _emitCallback = emitCallback;
  }
}

/**
 * Build an AlertEvent conforming to spec 3.2.
 * @param {Object} params
 * @returns {Object} AlertEvent
 */
function createAlertEvent({ type, severity, zone_id, message, details = {}, source = 'system' }) {
  const alert = {
    alert_id: uuidv4(),
    type,
    severity,
    zone_id,
    message,
    details,
    source,
    status: 'open',
    assigned_to: null,
    acknowledged_at: null,
    resolved_at: null,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return alert;
}

/**
 * Process a crowd density event (FR-02).
 * If density_level is 'critical', generate a congestion alert.
 * @param {Object} crowdDensityEvent – CrowdDensityEvent (spec 3.1)
 * @returns {Object|null} AlertEvent if generated, null otherwise
 */
function processCrowdEvent(crowdDensityEvent) {
  const { zone_id, density_level, current_count, max_capacity, percentage } = crowdDensityEvent;

  if (density_level === 'critical') {
    const alert = createAlertEvent({
      type: 'congestion',
      severity: 'high',
      zone_id,
      message: `Critical crowd density in ${zone_id}: ${percentage}% capacity (${current_count}/${max_capacity})`,
      details: {
        density_level,
        current_count,
        max_capacity,
        percentage,
        trigger: 'crowd_density_critical',
      },
      source: 'crowd_analytics',
    });

    // Store and emit
    db.addAlert(alert);
    if (_emitCallback) {
      _emitCallback(alert);
    }

    return alert;
  }

  // Also generate a warning for 'high' density
  if (density_level === 'high' && percentage > 80) {
    const alert = createAlertEvent({
      type: 'congestion',
      severity: 'medium',
      zone_id,
      message: `High crowd density in ${zone_id}: ${percentage}% capacity (${current_count}/${max_capacity})`,
      details: {
        density_level,
        current_count,
        max_capacity,
        percentage,
        trigger: 'crowd_density_high',
      },
      source: 'crowd_analytics',
    });

    db.addAlert(alert);
    if (_emitCallback) {
      _emitCallback(alert);
    }

    return alert;
  }

  return null;
}

/**
 * Process an anomaly and generate an appropriate alert.
 * @param {string} zoneId – zone where anomaly was detected
 * @param {string} type – anomaly type: unauthorized_access, medical, lost_child, equipment, weather, suspicious_activity
 * @param {Object} [details={}] – additional details
 * @returns {Object} AlertEvent
 */
function processAnomaly(zoneId, type, details = {}) {
  // Map anomaly types to severity levels
  const severityMap = {
    unauthorized_access: 'high',
    medical: 'critical',
    lost_child: 'critical',
    equipment: 'low',
    weather: 'medium',
    suspicious_activity: 'high',
    fire: 'critical',
    structural: 'critical',
  };

  // Map anomaly types to human-readable messages
  const messageMap = {
    unauthorized_access: `Unauthorized access detected in ${zoneId}. Security team dispatched.`,
    medical: `Medical emergency reported in ${zoneId}. Medical team alerted.`,
    lost_child: `Lost child reported in ${zoneId}. Code Adam initiated — all exits monitored.`,
    equipment: `Equipment malfunction reported in ${zoneId}. Maintenance team notified.`,
    weather: `Weather alert affecting ${zoneId}. Please follow staff instructions.`,
    suspicious_activity: `Suspicious activity detected in ${zoneId}. Security investigating.`,
    fire: `Fire alarm triggered in ${zoneId}. Evacuation procedures initiated.`,
    structural: `Structural concern reported in ${zoneId}. Area being cordoned off.`,
  };

  const severity = severityMap[type] || 'medium';
  const message = messageMap[type] || `Alert: ${type} in ${zoneId}`;

  const alert = createAlertEvent({
    type,
    severity,
    zone_id: zoneId,
    message,
    details: {
      anomaly_type: type,
      ...details,
    },
    source: 'anomaly_detection',
  });

  db.addAlert(alert);
  if (_emitCallback) {
    _emitCallback(alert);
  }

  return alert;
}

/**
 * Get all active (non-resolved) alerts.
 * @param {Object} [filters] – optional filters { status, severity, type }
 * @returns {Array} active AlertEvents
 */
function getActiveAlerts(filters = {}) {
  const defaultFilters = { ...filters };
  if (!defaultFilters.status) {
    defaultFilters.status = 'open';
  }
  return db.getAlerts(defaultFilters);
}

/**
 * Acknowledge an alert.
 * @param {string} alertId
 * @param {string} userId – user acknowledging
 * @returns {Object|null} updated alert
 */
function acknowledgeAlert(alertId, userId) {
  const updated = db.updateAlert(alertId, {
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: userId,
  });
  if (updated && _emitCallback) {
    _emitCallback({ ...updated, event_type: 'alert_updated' });
  }
  return updated;
}

/**
 * Resolve an alert.
 * @param {string} alertId
 * @param {string} userId – user resolving
 * @param {string} [resolution] – resolution note
 * @returns {Object|null} updated alert
 */
function resolveAlert(alertId, userId, resolution = '') {
  const updated = db.updateAlert(alertId, {
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolved_by: userId,
    resolution_note: resolution,
  });
  if (updated && _emitCallback) {
    _emitCallback({ ...updated, event_type: 'alert_updated' });
  }
  return updated;
}

/**
 * Assign an alert to a staff member.
 * @param {string} alertId
 * @param {string} assigneeId
 * @returns {Object|null} updated alert
 */
function assignAlert(alertId, assigneeId) {
  const updated = db.updateAlert(alertId, {
    assigned_to: assigneeId,
  });
  if (updated && _emitCallback) {
    _emitCallback({ ...updated, event_type: 'alert_updated' });
  }
  return updated;
}

module.exports = {
  init,
  processCrowdEvent,
  processAnomaly,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  assignAlert,
};
