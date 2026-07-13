/**
 * Notifications Routes (notify.js)
 * Endpoints for retrieving notifications and managing broadcasts (FR-07).
 */
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/notifications/:userId
 * Get all notifications for a specific user (including global broadcasts).
 */
router.get('/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = db.getNotifications(userId);
    res.json(notifications);
  } catch (err) {
    console.error('[NotifyRoute] Error getting notifications:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to retrieve notifications.' });
  }
});

/**
 * POST /api/notifications/broadcast
 * Broadcast emergency notifications (FR-07).
 * Requires admin permissions.
 */
router.post('/broadcast', verifyToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { type, message, severity } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'MISSING_MESSAGE', message: 'Message text is required.' });
    }

    const notification = db.addNotification({
      id: uuidv4(),
      user_id: '*', // broadcast
      type: type || 'emergency',
      severity: severity || 'high',
      message,
      read: false,
      timestamp: new Date().toISOString()
    });

    // Notify all connected clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Emit to all namespaces or specific room
      io.of('/fan').emit('notification:new', notification);
      io.of('/dashboard').emit('notification:new', notification);
    }

    res.status(201).json(notification);
  } catch (err) {
    console.error('[NotifyRoute] Broadcast error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to broadcast notification.' });
  }
});

/**
 * POST /api/notifications/send
 * Send notification to a specific user.
 */
router.post('/send', verifyToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { userId, type, message, severity } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'userId and message are required.' });
    }

    const notification = db.addNotification({
      id: uuidv4(),
      user_id: userId,
      type: type || 'general',
      severity: severity || 'medium',
      message,
      read: false,
      timestamp: new Date().toISOString()
    });

    // Notify specific client via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.of('/fan').to(userId).emit('notification:new', notification);
    }

    res.status(201).json(notification);
  } catch (err) {
    console.error('[NotifyRoute] Send error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to send notification.' });
  }
});

module.exports = router;
