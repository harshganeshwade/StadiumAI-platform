/**
 * In-Memory Data Store (db.js)
 * Replaces SQLite with JavaScript Maps/arrays for all data persistence.
 * Pre-seeded with users, recommendations, and stadium zone definitions.
 */
'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ---------------------------------------------------------------------------
// Password hashing (synchronous for seed data – 10 rounds)
// ---------------------------------------------------------------------------
const SALT_ROUNDS = 10;
const hashSync = (pw) => bcrypt.hashSync(pw, SALT_ROUNDS);

// ---------------------------------------------------------------------------
// Stadium Zones Definition
// ---------------------------------------------------------------------------
const STADIUM_ZONES = [
  { zone_id: 'gate-a', name: 'Gate A', type: 'gate', capacity: 5000, floor: 0, lat: 40.4531, lng: -3.6884 },
  { zone_id: 'gate-b', name: 'Gate B', type: 'gate', capacity: 5000, floor: 0, lat: 40.4536, lng: -3.6870 },
  { zone_id: 'gate-c', name: 'Gate C', type: 'gate', capacity: 5000, floor: 0, lat: 40.4541, lng: -3.6884 },
  { zone_id: 'gate-d', name: 'Gate D', type: 'gate', capacity: 5000, floor: 0, lat: 40.4536, lng: -3.6898 },
  { zone_id: 'sec-101', name: 'Section 101', type: 'seating', capacity: 3000, floor: 1, lat: 40.4533, lng: -3.6880 },
  { zone_id: 'sec-102', name: 'Section 102', type: 'seating', capacity: 3000, floor: 1, lat: 40.4535, lng: -3.6876 },
  { zone_id: 'sec-103', name: 'Section 103', type: 'seating', capacity: 3000, floor: 1, lat: 40.4538, lng: -3.6874 },
  { zone_id: 'sec-104', name: 'Section 104', type: 'seating', capacity: 3000, floor: 1, lat: 40.4541, lng: -3.6876 },
  { zone_id: 'sec-105', name: 'Section 105', type: 'seating', capacity: 3500, floor: 2, lat: 40.4543, lng: -3.6880 },
  { zone_id: 'sec-106', name: 'Section 106', type: 'seating', capacity: 3500, floor: 2, lat: 40.4541, lng: -3.6892 },
  { zone_id: 'sec-107', name: 'Section 107', type: 'seating', capacity: 3500, floor: 2, lat: 40.4538, lng: -3.6896 },
  { zone_id: 'sec-108', name: 'Section 108', type: 'seating', capacity: 3500, floor: 2, lat: 40.4535, lng: -3.6894 },
  { zone_id: 'concourse-n', name: 'North Concourse', type: 'concourse', capacity: 8000, floor: 1, lat: 40.4544, lng: -3.6884 },
  { zone_id: 'concourse-s', name: 'South Concourse', type: 'concourse', capacity: 8000, floor: 1, lat: 40.4528, lng: -3.6884 },
  { zone_id: 'concourse-e', name: 'East Concourse', type: 'concourse', capacity: 6000, floor: 1, lat: 40.4536, lng: -3.6868 },
  { zone_id: 'concourse-w', name: 'West Concourse', type: 'concourse', capacity: 6000, floor: 1, lat: 40.4536, lng: -3.6900 },
  { zone_id: 'food-court-1', name: 'Food Court 1', type: 'food', capacity: 2000, floor: 1, lat: 40.4540, lng: -3.6878 },
  { zone_id: 'food-court-2', name: 'Food Court 2', type: 'food', capacity: 2000, floor: 1, lat: 40.4532, lng: -3.6890 },
  { zone_id: 'vip-lounge', name: 'VIP Lounge', type: 'vip', capacity: 500, floor: 3, lat: 40.4536, lng: -3.6884 },
  { zone_id: 'medical-1', name: 'Medical Station 1', type: 'medical', capacity: 100, floor: 1, lat: 40.4530, lng: -3.6876 },
  { zone_id: 'field', name: 'Playing Field', type: 'field', capacity: 200, floor: 0, lat: 40.4536, lng: -3.6884 },
];

// ---------------------------------------------------------------------------
// Pre-seeded Users
// ---------------------------------------------------------------------------
const users = [
  // Fans – password: fan123
  {
    id: uuidv4(),
    name: 'Alex Fan',
    email: 'fan1@stadium.ai',
    password: hashSync('fan123'),
    role: 'fan',
    sub_role: null,
    preferred_language: 'en',
    zone_id: 'sec-101',
    seat: 'Row A, Seat 14',
    ticket_class: 'Premium Club',
    created_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Maria Fan',
    email: 'fan2@stadium.ai',
    password: hashSync('fan123'),
    role: 'fan',
    sub_role: null,
    preferred_language: 'es',
    zone_id: 'sec-103',
    seat: 'Row D, Seat 5',
    ticket_class: 'General Admission',
    created_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'James Fan',
    email: 'fan3@stadium.ai',
    password: hashSync('fan123'),
    role: 'fan',
    sub_role: null,
    preferred_language: 'en',
    zone_id: 'sec-105',
    seat: 'Row B, Seat 22',
    ticket_class: 'VIP Suite',
    created_at: new Date().toISOString(),
  },
  // Staff – password: staff123
  {
    id: uuidv4(),
    name: 'Sarah Ops',
    email: 'staff1@stadium.ai',
    password: hashSync('staff123'),
    role: 'staff',
    sub_role: 'operations_manager',
    preferred_language: 'en',
    zone_id: 'concourse-n',
    seat: 'Control Booth 1',
    ticket_class: 'Staff Credentials',
    created_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Mike Security',
    email: 'staff2@stadium.ai',
    password: hashSync('staff123'),
    role: 'staff',
    sub_role: 'security_lead',
    preferred_language: 'en',
    zone_id: 'gate-a',
    seat: 'Patrol Zone A',
    ticket_class: 'Staff Credentials',
    created_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Dr. Chen',
    email: 'staff3@stadium.ai',
    password: hashSync('staff123'),
    role: 'staff',
    sub_role: 'medical_staff',
    preferred_language: 'en',
    zone_id: 'medical-1',
    seat: 'First Aid Station 1',
    ticket_class: 'Staff Credentials',
    created_at: new Date().toISOString(),
  },
  // Admin – password: admin123
  {
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@stadium.ai',
    password: hashSync('admin123'),
    role: 'admin',
    sub_role: 'super_admin',
    preferred_language: 'en',
    zone_id: 'vip-lounge',
    seat: 'Executive Suite 5',
    ticket_class: 'Administrator VIP',
    created_at: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Pre-seeded Recommendations (FR-06)
// ---------------------------------------------------------------------------
const recommendations = [
  // Food items
  { id: uuidv4(), category: 'food', name: 'Stadium Burger', description: 'Classic beef burger with fries', price: 12.99, zone_id: 'food-court-1', rating: 4.5, wait_time_min: 5, available: true, image_url: '/img/burger.jpg' },
  { id: uuidv4(), category: 'food', name: 'Margherita Pizza', description: 'Wood-fired pizza with fresh mozzarella', price: 14.99, zone_id: 'food-court-1', rating: 4.7, wait_time_min: 8, available: true, image_url: '/img/pizza.jpg' },
  { id: uuidv4(), category: 'food', name: 'Hot Dog Combo', description: 'All-beef hot dog with drink', price: 8.99, zone_id: 'food-court-2', rating: 4.2, wait_time_min: 3, available: true, image_url: '/img/hotdog.jpg' },
  { id: uuidv4(), category: 'food', name: 'Nachos Supreme', description: 'Loaded nachos with cheese, jalapeños, and salsa', price: 10.99, zone_id: 'food-court-1', rating: 4.3, wait_time_min: 4, available: true, image_url: '/img/nachos.jpg' },
  { id: uuidv4(), category: 'food', name: 'Chicken Tenders', description: 'Crispy chicken tenders with dipping sauce', price: 11.49, zone_id: 'food-court-2', rating: 4.4, wait_time_min: 6, available: true, image_url: '/img/tenders.jpg' },
  { id: uuidv4(), category: 'food', name: 'Caesar Salad', description: 'Fresh romaine with Caesar dressing and croutons', price: 9.99, zone_id: 'food-court-1', rating: 4.1, wait_time_min: 3, available: true, image_url: '/img/salad.jpg' },
  { id: uuidv4(), category: 'food', name: 'Fish Tacos', description: 'Baja-style fish tacos with slaw', price: 13.49, zone_id: 'food-court-2', rating: 4.6, wait_time_min: 7, available: true, image_url: '/img/tacos.jpg' },
  { id: uuidv4(), category: 'food', name: 'Craft Beer', description: 'Local craft beer selection', price: 9.99, zone_id: 'food-court-1', rating: 4.5, wait_time_min: 1, available: true, image_url: '/img/beer.jpg' },
  { id: uuidv4(), category: 'food', name: 'Soft Pretzel', description: 'Warm pretzel with cheese dip', price: 7.49, zone_id: 'food-court-2', rating: 4.0, wait_time_min: 2, available: true, image_url: '/img/pretzel.jpg' },
  // Merchandise items
  { id: uuidv4(), category: 'merch', name: 'Official Team Jersey', description: '2026 season home jersey', price: 89.99, zone_id: 'concourse-n', rating: 4.8, wait_time_min: 0, available: true, image_url: '/img/jersey.jpg' },
  { id: uuidv4(), category: 'merch', name: 'Team Cap', description: 'Adjustable team baseball cap', price: 29.99, zone_id: 'concourse-n', rating: 4.5, wait_time_min: 0, available: true, image_url: '/img/cap.jpg' },
  { id: uuidv4(), category: 'merch', name: 'Scarf', description: 'Knitted supporter scarf', price: 24.99, zone_id: 'concourse-s', rating: 4.6, wait_time_min: 0, available: true, image_url: '/img/scarf.jpg' },
  { id: uuidv4(), category: 'merch', name: 'Mini Football', description: 'Signed replica mini football', price: 19.99, zone_id: 'concourse-e', rating: 4.3, wait_time_min: 0, available: true, image_url: '/img/football.jpg' },
  { id: uuidv4(), category: 'merch', name: 'Poster Pack', description: 'Set of 5 player posters', price: 14.99, zone_id: 'concourse-s', rating: 4.2, wait_time_min: 0, available: true, image_url: '/img/posters.jpg' },
  { id: uuidv4(), category: 'merch', name: 'Keychain', description: 'Metal stadium keychain', price: 9.99, zone_id: 'concourse-w', rating: 4.0, wait_time_min: 0, available: true, image_url: '/img/keychain.jpg' },
  { id: uuidv4(), category: 'merch', name: 'Water Bottle', description: 'Insulated team water bottle', price: 22.99, zone_id: 'concourse-e', rating: 4.4, wait_time_min: 0, available: true, image_url: '/img/bottle.jpg' },
  // Parking options
  { id: uuidv4(), category: 'parking', name: 'Lot A – Premium', description: 'Closest lot, covered parking near Gate A', price: 35.00, zone_id: 'gate-a', rating: 4.7, wait_time_min: 0, available: true, spaces_remaining: 120, image_url: '/img/lot-a.jpg' },
  { id: uuidv4(), category: 'parking', name: 'Lot B – Standard', description: 'Open-air lot near Gate B', price: 20.00, zone_id: 'gate-b', rating: 4.3, wait_time_min: 0, available: true, spaces_remaining: 450, image_url: '/img/lot-b.jpg' },
  { id: uuidv4(), category: 'parking', name: 'Lot C – Economy', description: 'Economy parking with shuttle service', price: 10.00, zone_id: 'gate-c', rating: 3.9, wait_time_min: 10, available: true, spaces_remaining: 800, image_url: '/img/lot-c.jpg' },
  { id: uuidv4(), category: 'parking', name: 'Lot D – VIP Valet', description: 'Full-service valet parking near VIP entrance', price: 50.00, zone_id: 'gate-d', rating: 4.9, wait_time_min: 0, available: true, spaces_remaining: 30, image_url: '/img/lot-d.jpg' },
  { id: uuidv4(), category: 'parking', name: 'Lot E – Accessible', description: 'ADA-accessible parking with elevator to concourse', price: 15.00, zone_id: 'gate-a', rating: 4.6, wait_time_min: 0, available: true, spaces_remaining: 60, image_url: '/img/lot-e.jpg' },
];

// ---------------------------------------------------------------------------
// Runtime Data Stores & Indexes
// ---------------------------------------------------------------------------
let alerts = [];
const alertsById = new Map();
const crowdDensity = new Map(); // zone_id -> CrowdDensityEvent
const chatSessions = new Map(); // session_id -> { messages[], created_at }
let notifications = [];

// Index tables for O(1) user lookups
const usersByEmail = new Map();
const usersById = new Map();

// Initialize user indexes
for (const u of users) {
  usersByEmail.set(u.email.toLowerCase(), u);
  usersById.set(u.id, u);
}

// ---------------------------------------------------------------------------
// User Functions
// ---------------------------------------------------------------------------
function getUser(email) {
  if (!email) return null;
  return usersByEmail.get(email.toLowerCase()) || null;
}

function getUserById(id) {
  if (!id) return null;
  return usersById.get(id) || null;
}

function createUser({ name, email, password, role = 'fan', preferred_language = 'en' }) {
  const existing = getUser(email);
  if (existing) return null; // duplicate
  const user = {
    id: uuidv4(),
    name,
    email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role,
    sub_role: null,
    preferred_language,
    zone_id: 'sec-101',
    seat: 'Row H, Seat 12',
    ticket_class: 'General Admission',
    created_at: new Date().toISOString(),
  };
  users.push(user);
  usersByEmail.set(user.email.toLowerCase(), user);
  usersById.set(user.id, user);
  return user;
}

function getAllUsers() {
  return users.map(({ password, ...rest }) => rest);
}

function updateUserPassword(email, newPassword) {
  const user = getUser(email);
  if (!user) return false;
  user.password = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  return true;
}

// ---------------------------------------------------------------------------
// Alert Functions
// ---------------------------------------------------------------------------
function getAlerts(filters = {}) {
  let result = [...alerts];
  if (filters.status) result = result.filter((a) => a.status === filters.status);
  if (filters.severity) result = result.filter((a) => a.severity === filters.severity);
  if (filters.type) result = result.filter((a) => a.type === filters.type);
  // Sort by timestamp descending (newest first)
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return result;
}

function getAlertById(id) {
  return alertsById.get(id) || null;
}

function addAlert(alert) {
  alerts.push(alert);
  alertsById.set(alert.alert_id, alert);
  // Keep only last 500 alerts in memory
  if (alerts.length > 500) {
    const removed = alerts.shift();
    if (removed) {
      alertsById.delete(removed.alert_id);
    }
  }
  return alert;
}

function updateAlert(id, updates) {
  const alert = alertsById.get(id);
  if (!alert) return null;
  Object.assign(alert, updates, { updated_at: new Date().toISOString() });
  return alert;
}

// ---------------------------------------------------------------------------
// Crowd Density Functions
// ---------------------------------------------------------------------------
function getCrowdDensity(zoneId) {
  return crowdDensity.get(zoneId) || null;
}

function setCrowdDensity(zoneId, event) {
  crowdDensity.set(zoneId, event);
  return event;
}

function getAllCrowdDensity() {
  const result = {};
  for (const [zoneId, event] of crowdDensity.entries()) {
    result[zoneId] = event;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Chat Session Functions
// ---------------------------------------------------------------------------
function getChatSession(sessionId) {
  return chatSessions.get(sessionId) || null;
}

function createChatSession(sessionId) {
  const session = { messages: [], created_at: new Date().toISOString() };
  chatSessions.set(sessionId, session);
  return session;
}

function addChatMessage(sessionId, message) {
  let session = chatSessions.get(sessionId);
  if (!session) {
    session = createChatSession(sessionId);
  }
  session.messages.push(message);
  // Keep sessions bounded (last 100 messages)
  if (session.messages.length > 100) {
    session.messages = session.messages.slice(-100);
  }
  return session;
}

// ---------------------------------------------------------------------------
// Notification Functions
// ---------------------------------------------------------------------------
function getNotifications(userId) {
  return notifications.filter((n) => n.user_id === userId || n.user_id === '*');
}

function addNotification(notification) {
  notifications.push(notification);
  // Keep only last 1000 notifications
  if (notifications.length > 1000) {
    notifications = notifications.slice(-1000);
  }
  return notification;
}

// ---------------------------------------------------------------------------
// Recommendation Functions
// ---------------------------------------------------------------------------
function getRecommendations(category, zoneId) {
  let result = [...recommendations];
  if (category) result = result.filter((r) => r.category === category);
  if (zoneId) result = result.filter((r) => r.zone_id === zoneId);
  return result;
}

function getRecommendationById(id) {
  return recommendations.find((r) => r.id === id) || null;
}

// ---------------------------------------------------------------------------
// Zone Functions
// ---------------------------------------------------------------------------
function getZones() {
  return [...STADIUM_ZONES];
}

function getZone(zoneId) {
  return STADIUM_ZONES.find((z) => z.zone_id === zoneId) || null;
}

function getZoneCapacity(zoneId) {
  const zone = getZone(zoneId);
  return zone ? zone.capacity : null;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  // Users
  getUser,
  getUserById,
  createUser,
  getAllUsers,
  updateUserPassword,
  // Alerts
  getAlerts,
  getAlertById,
  addAlert,
  updateAlert,
  // Crowd density
  getCrowdDensity,
  setCrowdDensity,
  getAllCrowdDensity,
  // Chat
  getChatSession,
  createChatSession,
  addChatMessage,
  // Notifications
  getNotifications,
  addNotification,
  // Recommendations
  getRecommendations,
  getRecommendationById,
  // Zones
  getZones,
  getZone,
  getZoneCapacity,
  // Direct access (for simulators)
  STADIUM_ZONES,
};
