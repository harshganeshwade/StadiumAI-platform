/**
 * Chat Routes (chat.js)
 * Implements conversational AI chatbot API (FR-01).
 * Shape matches ChatbotRequest and ChatbotResponse contracts.
 */
'use strict';

const express = require('express');
const router = express.Router();
const chatbot = require('../services/chatbot');
const config = require('../config');

const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/chat
 * Handles conversational request from fan or staff.
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { session_id, message, language, context } = req.body;
    const user_id = req.user.id;
    const role = req.user.role;

    if (!message) {
      return res.status(400).json({ error: 'MISSING_MESSAGE', message: 'Message text is required.' });
    }

    const request = {
      session_id: session_id || 'new-session',
      user_id: user_id || 'anonymous',
      role: role || 'fan',
      message,
      language: language || 'en',
      context: context || {}
    };

    const response = await chatbot.processMessage(request);
    res.json(response);
  } catch (err) {
    console.error('[ChatRoute] Processing error:', err);
    res.json({
      session_id: req.body.session_id || 'error-session',
      reply: "I'm sorry, I encountered an internal error processing that request. Please try again or ask stadium staff.",
      intent: 'fallback_error',
      actions: [{ type: 'escalate', payload: { reason: 'error' } }],
      confidence: 0.0
    });
  }
});

module.exports = router;
