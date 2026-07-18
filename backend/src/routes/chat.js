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
const { validateBody } = require('../middleware/validator');

const chatSchema = {
  session_id: { required: false, type: 'string' },
  message: { required: true, type: 'string', minLength: 1, maxLength: 500, sanitize: true },
  language: { required: false, type: 'string' },
  context: { required: false, type: 'object' }
};

/**
 * POST /api/chat
 * Handles conversational request from fan or staff.
 */
router.post('/', verifyToken, validateBody(chatSchema), async (req, res) => {
  try {
    const { session_id, message, language, context } = req.body;
    const user_id = req.user.id;
    const role = req.user.role;

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
