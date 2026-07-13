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

/**
 * POST /api/chat
 * Handles conversational request from fan or staff.
 */
router.post('/', async (req, res) => {
  let timeoutTriggered = false;

  // Set timeout fallback as specified in section 5
  const timeoutId = setTimeout(() => {
    timeoutTriggered = true;
    res.json({
      session_id: req.body.session_id || 'expired-session',
      reply: "I am experiencing high response times at the moment. Please consult our static FAQ, or contact stadium staff directly for assistance.",
      intent: 'fallback_timeout',
      actions: [{ type: 'escalate', payload: { reason: 'timeout' } }],
      confidence: 0.0
    });
  }, config.AI_MODEL_TIMEOUT_MS);

  try {
    const { session_id, user_id, role, message, language, context } = req.body;

    if (!message) {
      clearTimeout(timeoutId);
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
    
    if (!timeoutTriggered) {
      clearTimeout(timeoutId);
      res.json(response);
    }
  } catch (err) {
    console.error('[ChatRoute] Processing error:', err);
    if (!timeoutTriggered) {
      clearTimeout(timeoutId);
      res.json({
        session_id: req.body.session_id || 'error-session',
        reply: "I'm sorry, I encountered an internal error processing that request. Please try again or ask stadium staff.",
        intent: 'fallback_error',
        actions: [{ type: 'escalate', payload: { reason: 'error' } }],
        confidence: 0.0
      });
    }
  }
});

module.exports = router;
