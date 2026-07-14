/**
 * Sensor Simulator (sensorSimulator.js)
 * Simulates raw IoT sensor readings (CCTV cameras and occupancy sensors)
 * for all stadium zones, generating varying levels of crowd over time.
 */
'use strict';

const db = require('../db');
const crowdAnalytics = require('../services/crowdAnalytics');

let intervalId = null;

// Simulated crowd cycle phase (0 to 2*Math.PI)
let simulationPhase = 0;

/**
 * Start simulated sensor feeds.
 * @param {Function} onNewDensityEventCallback - function called when a new fused density event is processed
 */
function start(onNewDensityEventCallback) {
  if (intervalId) return;

  // Initial generation
  generateTick(onNewDensityEventCallback);

  // Tick every 3 seconds
  intervalId = setInterval(() => {
    // Advance simulation phase to simulate a match day flow:
    // arrival -> peak concourse -> peak seats (match active) -> halftime concourse -> exit
    simulationPhase += 0.05;
    if (simulationPhase > 2 * Math.PI) {
      simulationPhase = 0;
    }
    generateTick(onNewDensityEventCallback);
  }, 3000);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function generateTick(callback) {
  const zones = db.getZones();
  
  for (const zone of zones) {
    let baseMultiplier = 0.3; // default medium-low

    // Modulate base multiplier depending on zone type and simulation phase
    const sinPhase = Math.sin(simulationPhase); // -1 to 1

    if (zone.type === 'gate') {
      // Gates peak early (fans arrival) and late (fans departure)
      baseMultiplier = 0.4 + 0.3 * Math.sin(simulationPhase * 2); // oscillates faster
    } else if (zone.type === 'seating') {
      // Seating sections peak when phase is in the middle (match active)
      baseMultiplier = 0.5 + 0.4 * sinPhase; // 0.1 to 0.9
    } else if (zone.type === 'concourse' || zone.type === 'food') {
      // Concourses peak during arrival, halftime, and departure (inverse of seating match peak)
      baseMultiplier = 0.4 - 0.25 * sinPhase; // 0.15 to 0.65
    } else if (zone.type === 'vip') {
      baseMultiplier = 0.3 + 0.15 * Math.cos(simulationPhase);
    } else if (zone.type === 'medical') {
      baseMultiplier = 0.05 + 0.05 * Math.random(); // medical stays low
    }

    // Add some random noise
    const noise = (Math.random() - 0.5) * 0.1;
    let occupancyRatio = Math.max(0.01, Math.min(1.1, baseMultiplier + noise));

    // Calculate count from occupancy ratio
    const count = Math.round(zone.capacity * occupancyRatio);

    // Simulate multi-source sensor inputs: CCTV camera and occupancy sensor
    const cameraCount = Math.round(count * (0.95 + (Math.random() - 0.5) * 0.08));
    const sensorCount = Math.round(count * (0.98 + (Math.random() - 0.5) * 0.04));

    // Process both sources in crowd analytics (which fuses them)
    crowdAnalytics.processRawSensorData(zone.zone_id, cameraCount, 'camera');
    const fusedEvent = crowdAnalytics.processRawSensorData(zone.zone_id, sensorCount, 'turnstile');

    if (callback) {
      callback(fusedEvent);
    }
  }
}

module.exports = {
  start,
  stop
};
