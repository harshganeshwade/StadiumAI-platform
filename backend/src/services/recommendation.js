/**
 * Recommendation & Navigation Service (FR-05 + FR-06)
 * Stadium zone graph with Dijkstra shortest path (congestion-aware)
 * and item recommendations sorted by relevance.
 */
'use strict';

const db = require('../db');
const crowdAnalytics = require('./crowdAnalytics');

// ---------------------------------------------------------------------------
// Stadium Zone Graph
// Nodes = zones, edges = walkways with base travel time (seconds)
// ---------------------------------------------------------------------------
const GRAPH = {
  // Gate connections to concourses
  'gate-a':       { 'concourse-n': 45, 'concourse-w': 50 },
  'gate-b':       { 'concourse-n': 45, 'concourse-e': 50 },
  'gate-c':       { 'concourse-s': 45, 'concourse-e': 50 },
  'gate-d':       { 'concourse-s': 45, 'concourse-w': 50 },

  // Concourse connections (ring-like structure)
  'concourse-n':  { 'gate-a': 45, 'gate-b': 45, 'concourse-e': 60, 'concourse-w': 60, 'sec-101': 30, 'sec-102': 35, 'sec-103': 40, 'sec-104': 40, 'food-court-1': 25, 'vip-lounge': 50 },
  'concourse-s':  { 'gate-c': 45, 'gate-d': 45, 'concourse-e': 60, 'concourse-w': 60, 'sec-105': 35, 'sec-106': 30, 'sec-107': 35, 'sec-108': 40, 'food-court-2': 25, 'medical-1': 20 },
  'concourse-e':  { 'gate-b': 50, 'gate-c': 50, 'concourse-n': 60, 'concourse-s': 60, 'sec-102': 30, 'sec-103': 30, 'sec-105': 35, 'sec-106': 35 },
  'concourse-w':  { 'gate-a': 50, 'gate-d': 50, 'concourse-n': 60, 'concourse-s': 60, 'sec-101': 30, 'sec-104': 30, 'sec-107': 35, 'sec-108': 35 },

  // Sections connect to their concourses and adjacent sections
  'sec-101':      { 'concourse-n': 30, 'concourse-w': 30, 'sec-102': 40, 'sec-108': 45 },
  'sec-102':      { 'concourse-n': 35, 'concourse-e': 30, 'sec-101': 40, 'sec-103': 40 },
  'sec-103':      { 'concourse-n': 40, 'concourse-e': 30, 'sec-102': 40, 'sec-104': 40 },
  'sec-104':      { 'concourse-n': 40, 'concourse-w': 30, 'sec-103': 40, 'sec-105': 45 },
  'sec-105':      { 'concourse-s': 35, 'concourse-e': 35, 'sec-104': 45, 'sec-106': 40 },
  'sec-106':      { 'concourse-s': 30, 'concourse-e': 35, 'sec-105': 40, 'sec-107': 40 },
  'sec-107':      { 'concourse-s': 35, 'concourse-w': 35, 'sec-106': 40, 'sec-108': 40 },
  'sec-108':      { 'concourse-s': 40, 'concourse-w': 35, 'sec-107': 40, 'sec-101': 45 },

  // Food courts
  'food-court-1': { 'concourse-n': 25, 'concourse-e': 40 },
  'food-court-2': { 'concourse-s': 25, 'concourse-w': 40 },

  // Special zones
  'vip-lounge':   { 'concourse-n': 50, 'field': 80 },
  'medical-1':    { 'concourse-s': 20, 'concourse-w': 35 },
  'field':        { 'vip-lounge': 80, 'concourse-n': 90, 'concourse-s': 90 },
};

// Non-ADA compliant stair pathways (sections connecting to high seating rows)
const STAIRS_EDGES = new Set([
  'concourse-n->sec-101', 'sec-101->concourse-n',
  'concourse-w->sec-101', 'sec-101->concourse-w',
  'concourse-n->sec-102', 'sec-102->concourse-n',
  'concourse-e->sec-102', 'sec-102->concourse-e',
  'concourse-n->sec-103', 'sec-103->concourse-n',
  'concourse-e->sec-103', 'sec-103->concourse-e',
  'concourse-n->sec-104', 'sec-104->concourse-n',
  'concourse-w->sec-104', 'sec-104->concourse-w',
  'concourse-s->sec-105', 'sec-105->concourse-s',
  'concourse-e->sec-105', 'sec-105->concourse-e',
  'concourse-s->sec-106', 'sec-106->concourse-s',
  'concourse-e->sec-106', 'sec-106->concourse-e',
  'concourse-s->sec-107', 'sec-107->concourse-s',
  'concourse-w->sec-107', 'sec-107->concourse-w',
  'concourse-s->sec-108', 'sec-108->concourse-s',
  'concourse-w->sec-108', 'sec-108->concourse-w',
]);

// ---------------------------------------------------------------------------
// Congestion multiplier: adjusts travel time based on crowd density
// ---------------------------------------------------------------------------

/**
 * Get a congestion multiplier for a zone based on current crowd density.
 * @param {string} zoneId
 * @returns {number} multiplier (1.0 = no congestion, up to 3.0 for critical)
 */
function getCongestionMultiplier(zoneId) {
  const density = crowdAnalytics.getZoneDensity(zoneId);
  if (!density) return 1.0; // no data → assume normal

  // Telemetry Validation: Check for null/undefined properties, NaN, or negative values
  if (
    !density.density_level ||
    (density.percentage !== undefined && density.percentage !== null && (isNaN(density.percentage) || density.percentage < 0)) ||
    (density.current_count !== undefined && density.current_count !== null && (isNaN(density.current_count) || density.current_count < 0))
  ) {
    console.warn(`[RecommendationService] Corrupt/invalid telemetry data for zone ${zoneId}, defaulting multiplier to 1.0`);
    return 1.0;
  }

  switch (density.density_level) {
    case 'low':      return 1.0;
    case 'medium':   return 1.3;
    case 'high':     return 1.8;
    case 'critical': return 3.0;
    default:         return 1.0;
  }
}

// ---------------------------------------------------------------------------
// Dijkstra Shortest Path (congestion-aware)
// ---------------------------------------------------------------------------

/**
 * Find the shortest route between two zones using Dijkstra's algorithm.
 * Travel times are adjusted by current congestion levels.
 *
 * @param {string} fromZone – starting zone ID
 * @param {string} toZone – destination zone ID
 * @param {string} fromZone – starting zone ID
 * @param {string} toZone – destination zone ID
 * @param {Object} [options={}] – extra routing options (e.g. { ada: true })
 * @returns {Object} { route, estimated_time, distance, congestion_aware, degraded, zone_details, ada_route }
 */
function findRoute(fromZone, toZone, options = {}) {
  const adaEnabled = !!options.ada;

  // Validate zones exist in graph
  if (!GRAPH[fromZone]) {
    return { error: `Unknown zone: ${fromZone}`, route: [], estimated_time: 0, distance: 0, congestion_aware: false, degraded: true };
  }
  if (!GRAPH[toZone]) {
    return { error: `Unknown zone: ${toZone}`, route: [], estimated_time: 0, distance: 0, congestion_aware: false, degraded: true };
  }

  // Same zone
  if (fromZone === toZone) {
    return {
      route: [fromZone],
      estimated_time: 0,
      distance: 0,
      congestion_aware: true,
      degraded: false,
      zone_details: [{ zone_id: fromZone, congestion: 'none' }],
      ada_route: adaEnabled
    };
  }

  // Check if crowd data is available
  const hasCrowdData = Object.keys(crowdAnalytics.getAllDensities()).length > 0;

  // Dijkstra implementation
  const dist = {};       // zone -> shortest distance
  const prev = {};       // zone -> previous zone in shortest path
  const visited = {};    // zone -> boolean
  const allNodes = Object.keys(GRAPH);

  // Initialise distances
  for (const node of allNodes) {
    dist[node] = Infinity;
    prev[node] = null;
    visited[node] = false;
  }
  dist[fromZone] = 0;

  for (let i = 0; i < allNodes.length; i++) {
    // Find unvisited node with minimum distance
    let minDist = Infinity;
    let current = null;
    for (const node of allNodes) {
      if (!visited[node] && dist[node] < minDist) {
        minDist = dist[node];
        current = node;
      }
    }

    if (current === null || current === toZone) break;
    visited[current] = true;

    // Relax neighbours
    const neighbours = GRAPH[current];
    if (!neighbours) continue;

    for (const [neighbour, baseTime] of Object.entries(neighbours)) {
      if (visited[neighbour]) continue;

      // Apply accessibility penalty multiplier for stairs when ADA routing is requested
      let accessibilityMultiplier = 1.0;
      if (adaEnabled) {
        const edgeKey = `${current}->${neighbour}`;
        if (STAIRS_EDGES.has(edgeKey)) {
          // Penalize stairways heavily to force routing via elevator/ramp accessible walkways
          accessibilityMultiplier = 20.0;
        }
      }

      // Apply congestion multiplier if crowd data is available
      const multiplier = hasCrowdData ? getCongestionMultiplier(neighbour) : 1.0;
      const adjustedTime = baseTime * multiplier * accessibilityMultiplier;

      const newDist = dist[current] + adjustedTime;
      if (newDist < dist[neighbour]) {
        dist[neighbour] = newDist;
        prev[neighbour] = current;
      }
    }
  }

  // Reconstruct path
  const route = [];
  let step = toZone;
  while (step !== null) {
    route.unshift(step);
    step = prev[step];
  }

  // If route doesn't start with fromZone, there's no path
  if (route[0] !== fromZone) {
    return {
      error: `No route found from ${fromZone} to ${toZone}`,
      route: [],
      estimated_time: 0,
      distance: 0,
      congestion_aware: hasCrowdData,
      degraded: !hasCrowdData,
      ada_route: adaEnabled
    };
  }

  // Build zone details with congestion info
  const zoneDetails = route.map((z) => {
    const density = crowdAnalytics.getZoneDensity(z);
    return {
      zone_id: z,
      density_level: density ? density.density_level : 'unknown',
      percentage: density ? density.percentage : null,
    };
  });

  // Calculate distance (number of zone transitions)
  const distance = route.length - 1;

  return {
    route,
    estimated_time: Math.round(dist[toZone]),
    distance,
    congestion_aware: hasCrowdData,
    degraded: !hasCrowdData,
    zone_details: zoneDetails,
    ada_route: adaEnabled
  };
}

// ---------------------------------------------------------------------------
// Recommendations (FR-06)
// ---------------------------------------------------------------------------

/**
 * Get personalised recommendations for a user.
 * Items are sorted by relevance: proximity (if zone provided), rating, and wait time.
 *
 * @param {string|null} userId – user ID (for future personalisation)
 * @param {string} [category] – 'food', 'merch', 'parking'
 * @param {string} [userZone] – user's current zone
 * @returns {Array} sorted recommendation items
 */
function getRecommendations(userId, category, userZone) {
  let items = db.getRecommendations(category);

  // Score each item for sorting
  const scored = items.map((item) => {
    let score = 0;

    // Rating contributes 0-5 points
    score += (item.rating || 0);

    // Availability bonus
    if (item.available) score += 2;

    // Lower wait time is better (max 3 bonus points)
    if (typeof item.wait_time_min === 'number') {
      score += Math.max(0, 3 - (item.wait_time_min / 5));
    }

    // Proximity bonus: if user is in the same zone, big boost
    if (userZone && item.zone_id === userZone) {
      score += 5;
    } else if (userZone) {
      // Check if the item's zone is adjacent in the graph
      const neighbours = GRAPH[userZone];
      if (neighbours && neighbours[item.zone_id]) {
        // Adjacent zone – moderate boost
        score += 3;
      }
    }

    // For parking, factor in spaces remaining
    if (item.spaces_remaining !== undefined) {
      score += Math.min(3, item.spaces_remaining / 100);
    }

    return { ...item, relevance_score: Math.round(score * 100) / 100 };
  });

  // Sort by relevance_score descending
  scored.sort((a, b) => b.relevance_score - a.relevance_score);

  return scored;
}

module.exports = {
  findRoute,
  getRecommendations,
  GRAPH,
};
