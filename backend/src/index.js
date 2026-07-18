/**
 * Main Application Server (index.js)
 * Mounts all Express middleware, routes, handles Socket.IO events, and
 * boots background simulations.
 */
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const config = require('./config');
const db = require('./db');
const { rateLimit } = require('./middleware/rateLimit');

// Routes
const authRouter = require('./routes/auth');
const chatRouter = require('./routes/chat');
const alertsRouter = require('./routes/alerts');
const crowdRouter = require('./routes/crowd');
const navigationRouter = require('./routes/navigation');
const recommendRouter = require('./routes/recommend');
const notifyRouter = require('./routes/notify');
const healthRouter = require('./routes/health');
const simulateRouter = require('./routes/simulation');

// Services
const alertEngine = require('./services/alertEngine');
const crowdAnalytics = require('./services/crowdAnalytics');

// Simulators
const sensorSimulator = require('./simulators/sensorSimulator');
const alertSimulator = require('./simulators/alertSimulator');

// Validate required config configurations
if (isNaN(config.PORT) || config.PORT <= 0) {
  console.error('[StartupError] Invalid PORT configuration. Exiting...');
  process.exit(1);
}
if (!config.JWT_SECRET || config.JWT_SECRET === 'stadium-ai-secret-key-2026') {
  console.warn('[StartupWarning] Running with default JWT secret. Configure JWT_SECRET in production.');
  if (process.env.NODE_ENV === 'production') {
    console.error('[StartupError] Running with default JWT secret in production mode is prohibited. Exiting...');
    process.exit(1);
  }
}

// Initialize express app
const app = express();
const server = http.createServer(app);

// Configure Cors
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Apply rate limiting (Section 3.4 max concurrent users / protection)
app.use(rateLimit({ windowMs: 60000, maxRequests: 150 }));

// Health Check Route
app.use('/api/health', healthRouter);

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/crowd', crowdRouter);
app.use('/api/navigate', navigationRouter);
app.use('/api/recommendations', recommendRouter);
app.use('/api/notifications', notifyRouter);
app.use('/api/simulate', simulateRouter);

// Set up Socket.IO
const io = socketIo(server, {
  cors: corsOptions
});
app.set('io', io);

// Namespaces
const fanNamespace = io.of('/fan');
const dashboardNamespace = io.of('/dashboard');

// Handshake authentication middleware for Socket.IO (Security Best Practice)
const verifySocketToken = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: config.JWT_ISSUER
      });
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
    } catch (err) {
      return next(new Error('Authentication failed: invalid token'));
    }
  }
  next();
};

fanNamespace.use(verifySocketToken);
dashboardNamespace.use(verifySocketToken);

// Track connected users
const connectedFans = new Map(); // socket.id -> userId
const connectedStaff = new Map(); // socket.id -> userId

fanNamespace.on('connection', (socket) => {
  console.log(`[Socket.IO] Fan connected: ${socket.id}`);

  // Automatically authenticate if token was verified in handshake
  if (socket.userId) {
    connectedFans.set(socket.id, socket.userId);
    socket.join(socket.userId);
    console.log(`[Socket.IO] Fan authenticated via handshake: ${socket.userId}`);
  }

  socket.on('authenticate', (token) => {
    // Basic decode of JWT to subscribe user to their room
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const userId = decoded.id;
      socket.userId = userId;
      connectedFans.set(socket.id, userId);
      socket.join(userId);
      console.log(`[Socket.IO] Fan authenticated: ${userId} for socket: ${socket.id}`);
    } catch (err) {
      console.error('[Socket.IO] Authentication failed:', err.message);
    }
  });

  socket.on('disconnect', () => {
    connectedFans.delete(socket.id);
    console.log(`[Socket.IO] Fan disconnected: ${socket.id}`);
  });
});

dashboardNamespace.on('connection', (socket) => {
  console.log(`[Socket.IO] Dashboard operator connected: ${socket.id}`);

  // Automatically authenticate if token was verified in handshake
  if (socket.userId && (socket.userRole === 'staff' || socket.userRole === 'admin')) {
    connectedStaff.set(socket.id, socket.userId);
    socket.join('operators');
    console.log(`[Socket.IO] Staff/Admin connected to operators room via handshake: ${socket.userId}`);
  }

  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded.role === 'staff' || decoded.role === 'admin') {
        const userId = decoded.id;
        socket.userId = userId;
        connectedStaff.set(socket.id, userId);
        socket.join('operators');
        console.log(`[Socket.IO] Staff/Admin connected to operators room: ${userId}`);
      }
    } catch (err) {
      console.error('[Socket.IO] Operator authentication failed:', err.message);
    }
  });

  socket.on('disconnect', () => {
    connectedStaff.delete(socket.id);
    console.log(`[Socket.IO] Dashboard operator disconnected: ${socket.id}`);
  });
});

// Wire up the Alert Engine callback to emit alerts to operators
alertEngine.init((alertEvent) => {
  console.log(`[AlertEngine] New Alert Published: [${alertEvent.severity.toUpperCase()}] ${alertEvent.message}`);
  
  // Publish to operators
  dashboardNamespace.to('operators').emit('alert:new', alertEvent);
  
  // If it is critical, send a notification to fans in that zone (FR-07)
  if (alertEvent.severity === 'critical' || alertEvent.severity === 'high') {
    const notification = {
      id: alertEvent.alert_id,
      user_id: '*', // Broadcast
      type: 'emergency',
      severity: alertEvent.severity,
      message: `Emergency Alert in ${alertEvent.zone_id.toUpperCase()}: ${alertEvent.message}`,
      timestamp: new Date().toISOString()
    };
    db.addNotification(notification);
    fanNamespace.emit('notification:new', notification);
  }
});

// Start simulations and wire sensor inputs to crowd analytics & alert engine
if (process.env.NODE_ENV !== 'test') {
  sensorSimulator.start((crowdEvent) => {
    // Emit to all connected clients
    fanNamespace.emit('crowd:density', crowdEvent);
    dashboardNamespace.emit('crowd:density', crowdEvent);

    // Send to alert engine to check for critical congestion thresholds (FR-02)
    alertEngine.processCrowdEvent(crowdEvent);
  });

  // Start alert generator simulator
  alertSimulator.start();

  // Start HTTP Server
  const PORT = config.PORT;
  server.listen(PORT, () => {
    console.log(`
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │   StadiumAI Operational Monolith Server                │
  │   Serving FIFA World Cup 2026 Operations               │
  │   Port: ${PORT}                                           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
    `);
  });
}

// Global error handling middleware (FR-01/FR-08)
app.use((err, req, res, next) => {
  console.error('[GlobalErrorHandler]', err.stack || err.message);
  
  if (res.headersSent) {
    return next(err);
  }

  const response = {
    error: true,
    message: err.message || 'Internal Server Error',
  };
  
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  
  res.status(err.status || 500).json(response);
});

module.exports = { app, server };
