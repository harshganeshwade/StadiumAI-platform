/**
 * Crowd Analytics Service (FR-03)
 * Processes raw sensor data into CrowdDensityEvents with density classification,
 * confidence scoring, and multi-source fusion.
 */
'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// ---------------------------------------------------------------------------
// Zone capacity map – each zone has a max capacity
// ---------------------------------------------------------------------------
const ZONE_CAPACITIES = {};
for (const zone of db.STADIUM_ZONES) {
  ZONE_CAPACITIES[zone.zone_id] = zone.capacity;
}

// ---------------------------------------------------------------------------
// Density thresholds
// ---------------------------------------------------------------------------
const DENSITY_THRESHOLDS = {
  low: 0.30,       // < 30%
  medium: 0.60,    // 30-60%
  high: 0.85,      // 60-85%
  // > 85% = critical
};

/**
 * Classify density level based on occupancy percentage.
 * @param {number} percentage – 0-100
 * @returns {string} 'low' | 'medium' | 'high' | 'critical'
 */
function classifyDensity(percentage) {
  const ratio = percentage / 100;
  if (ratio < DENSITY_THRESHOLDS.low) return 'low';
  if (ratio < DENSITY_THRESHOLDS.medium) return 'medium';
  if (ratio < DENSITY_THRESHOLDS.high) return 'high';
  return 'critical';
}

// ---------------------------------------------------------------------------
// Confidence scoring based on source type
// ---------------------------------------------------------------------------
const SOURCE_CONFIDENCE = {
  camera: 0.92,
  lidar: 0.95,
  wifi_probe: 0.75,
  bluetooth_beacon: 0.78,
  turnstile: 0.98,
  manual: 0.60,
  infrared: 0.88,
  simulation: 0.70,
  unknown: 0.50,
};

/**
 * Multi-source fusion: weighted average when multiple sources report.
 * Uses an in-memory buffer that holds recent readings per zone.
 */
const recentReadings = new Map(); // zone_id -> [{ count, confidence, timestamp }]

/**
 * Process raw sensor data for a zone and produce a CrowdDensityEvent.
 * @param {string} zoneId – zone identifier
 * @param {number} count – raw people count from sensor
 * @param {string} [source='simulation'] – data source type
 * @returns {Object} CrowdDensityEvent (spec 3.1)
 */
function processRawSensorData(zoneId, count, source = 'simulation') {
  const maxCapacity = ZONE_CAPACITIES[zoneId];
  if (!maxCapacity) {
    // Unknown zone – create a default capacity
    console.warn(`[CrowdAnalytics] Unknown zone "${zoneId}", using default capacity 1000`);
  }
  const capacity = maxCapacity || 1000;
  const confidence = SOURCE_CONFIDENCE[source] || SOURCE_CONFIDENCE.unknown;

  // Clamp count to reasonable range
  const clampedCount = Math.max(0, Math.min(count, Math.round(capacity * 1.2)));

  // Store reading for fusion
  const now = Date.now();
  if (!recentReadings.has(zoneId)) {
    recentReadings.set(zoneId, []);
  }
  const readings = recentReadings.get(zoneId);

  // Add new reading
  readings.push({ count: clampedCount, confidence, timestamp: now, source });

  // Remove readings older than 30 seconds
  const cutoff = now - 30000;
  const validReadings = readings.filter((r) => r.timestamp > cutoff);
  recentReadings.set(zoneId, validReadings);

  // Fusion: weighted average based on confidence
  let fusedCount;
  let fusedConfidence;

  if (validReadings.length > 1) {
    // Multi-source fusion: confidence-weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    let maxConf = 0;

    for (const reading of validReadings) {
      weightedSum += reading.count * reading.confidence;
      totalWeight += reading.confidence;
      maxConf = Math.max(maxConf, reading.confidence);
    }

    fusedCount = Math.round(weightedSum / totalWeight);
    // Fusion improves confidence (capped at 0.99)
    fusedConfidence = Math.min(0.99, maxConf + 0.05 * (validReadings.length - 1));
  } else {
    fusedCount = clampedCount;
    fusedConfidence = confidence;
  }

  // Calculate percentage and density level
  const percentage = Math.round((fusedCount / capacity) * 100);
  const densityLevel = classifyDensity(percentage);

  // Compute trend by comparing with previous reading
  const previous = db.getCrowdDensity(zoneId);
  let trend = 'stable';
  if (previous) {
    const diff = percentage - previous.percentage;
    if (diff > 3) trend = 'increasing';
    else if (diff < -3) trend = 'decreasing';
  }

  // Build CrowdDensityEvent (spec 3.1)
  const event = {
    event_id: uuidv4(),
    zone_id: zoneId,
    current_count: fusedCount,
    max_capacity: capacity,
    percentage,
    density_level: densityLevel,
    confidence: Math.round(fusedConfidence * 100) / 100,
    trend,
    source,
    sources_count: validReadings.length,
    timestamp: new Date().toISOString(),
  };

  // Persist latest density for the zone
  db.setCrowdDensity(zoneId, event);

  return event;
}

/**
 * Get the latest density for a specific zone.
 * @param {string} zoneId
 * @returns {Object|null} CrowdDensityEvent
 */
function getZoneDensity(zoneId) {
  return db.getCrowdDensity(zoneId);
}

/**
 * Get densities for all zones.
 * @returns {Object} Map of zone_id -> CrowdDensityEvent
 */
function getAllDensities() {
  return db.getAllCrowdDensity();
}

/**
 * Get zone capacities (useful for route planning).
 * @returns {Object} zone_id -> capacity
 */
function getZoneCapacities() {
  return { ...ZONE_CAPACITIES };
}

module.exports = {
  processRawSensorData,
  getZoneDensity,
  getAllDensities,
  getZoneCapacities,
  classifyDensity,
};
