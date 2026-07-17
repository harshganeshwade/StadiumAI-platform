/**
 * AI Chatbot Service (FR-01)
 * Intent classification with keyword matching, multi-language support (6 languages),
 * confidence scoring, and fallback escalation.
 *
 * Input:  ChatbotRequest  (spec 3.3)
 * Output: ChatbotResponse (spec 3.3)
 */
'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const TTLCache = require('../utils/cache');
const { CircuitBreaker } = require('./circuitBreaker');
const { RESPONSES, FALLBACK_RESPONSES } = require('./locales');

const chatCache = new TTLCache(10000); // 10 seconds cache
const llmBreaker = new CircuitBreaker({
  name: 'conversational-llm',
  failureThreshold: 3,
  cooldownMs: 15000,
});

const INTENT_PATTERNS = {
  navigate: {
    keywords: [
      ['direction', 'navigate', 'find', 'where', 'location', 'map'],
      ['how to get', 'way to', 'route to', 'go to', 'get to'],
      ['entrance', 'exit', 'gate', 'section', 'concourse'],
      ['path', 'walk', 'stairs', 'elevator', 'escalator'],
    ],
  },
  food: {
    keywords: [
      ['food', 'eat', 'hungry', 'restaurant', 'snack', 'meal'],
      ['drink', 'beer', 'water', 'soda', 'beverage', 'thirsty'],
      ['menu', 'order', 'pizza', 'burger', 'hot dog', 'nachos'],
      ['food court', 'concession', 'vendor', 'stand'],
      ['vegetarian', 'vegan', 'gluten', 'allergy', 'halal', 'kosher'],
    ],
  },
  emergency: {
    keywords: [
      ['emergency', 'help', 'danger', 'fire', 'evacuation'],
      ['police', 'security', 'threat', 'attack', 'bomb'],
      ['sos', 'urgent', 'crisis', 'panic'],
      ['call 911', 'need help', 'save me'],
    ],
  },
  schedule: {
    keywords: [
      ['schedule', 'time', 'when', 'start', 'begin'],
      ['match', 'game', 'kick-off', 'kickoff', 'halftime'],
      ['lineup', 'roster', 'team', 'players', 'squad'],
      ['event', 'program', 'agenda', 'timetable'],
    ],
  },
  parking: {
    keywords: [
      ['parking', 'park', 'car', 'vehicle', 'drive'],
      ['lot', 'garage', 'space', 'spot', 'valet'],
      ['where did i park', 'find my car', 'parking fee'],
    ],
  },
  restroom: {
    keywords: [
      ['restroom', 'bathroom', 'toilet', 'washroom', 'lavatory'],
      ['wc', 'loo', 'ladies room', 'mens room'],
      ['baby changing', 'diaper', 'accessible restroom'],
    ],
  },
  help: {
    keywords: [
      ['help', 'assist', 'support', 'info', 'information'],
      ['customer service', 'staff', 'question', 'ask'],
      ['what can you do', 'features', 'options', 'menu'],
    ],
  },
  weather: {
    keywords: [
      ['weather', 'rain', 'sun', 'temperature', 'forecast'],
      ['umbrella', 'cold', 'hot', 'wind', 'storm'],
      ['roof', 'covered', 'indoor', 'shelter'],
    ],
  },
  merchandise: {
    keywords: [
      ['merchandise', 'merch', 'shop', 'store', 'buy'],
      ['jersey', 'shirt', 'hat', 'cap', 'scarf', 'souvenir'],
      ['team store', 'gift', 'fan shop', 'official'],
    ],
  },
  medical: {
    keywords: [
      ['medical', 'doctor', 'nurse', 'first aid', 'medicine'],
      ['injury', 'hurt', 'sick', 'pain', 'faint', 'dizzy'],
      ['ambulance', 'health', 'defibrillator', 'aed'],
      ['allergy', 'epipen', 'inhaler', 'wheelchair'],
    ],
  },
  lost_child: {
    keywords: [
      ['lost child', 'missing child', 'lost kid', 'missing kid'],
      ['can\'t find my child', 'lost my son', 'lost my daughter'],
      ['child alone', 'unaccompanied minor', 'lost parent'],
    ],
  },
  seating: {
    keywords: [
      ['seat', 'seating', 'row', 'section', 'tier'],
      ['my seat', 'find seat', 'seat number', 'aisle'],
      ['upgrade', 'better seat', 'view', 'vip'],
    ],
  },
};

// ---------------------------------------------------------------------------
// Intent classification engine
// ---------------------------------------------------------------------------

/**
 * Classify user message into an intent with confidence score.
 * @param {string} message – user's raw message text
 * @returns {{ intent: string, confidence: number }}
 */
function classifyIntent(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  // Intercept greetings and direct them to help
  if (['hi', 'hello', 'hey', 'greetings', 'yo', 'hola', 'bonjour', 'start'].includes(lowerMsg)) {
    return {
      intent: 'help',
      confidence: 1.0,
    };
  }

  let bestIntent = null;
  let bestScore = 0;

  for (const [intent, { keywords }] of Object.entries(INTENT_PATTERNS)) {
    let matchCount = 0;
    let totalPatterns = 0;

    for (const patternGroup of keywords) {
      totalPatterns += patternGroup.length;
      for (const kw of patternGroup) {
        if (lowerMsg.includes(kw.toLowerCase())) {
          // Multi-word matches score higher
          const words = kw.split(' ').length;
          matchCount += words;
        }
      }
    }

    // Normalise score: ratio of matched keyword weight to total patterns
    const score = totalPatterns > 0 ? Math.min(matchCount / (totalPatterns * 0.3), 1.0) : 0;

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Round confidence to 2 decimal places
  const confidence = Math.round((bestScore || 0) * 100) / 100;

  return {
    intent: bestIntent || 'help',
    confidence: confidence > 0 ? confidence : 0.1,
  };
}

/**
 * Get the response text for a given intent and language.
 * @param {string} intent
 * @param {string} language – ISO 639-1 code
 * @returns {string}
 */
function getResponseText(intent, language) {
  const lang = RESPONSES[intent] ? language : 'en';
  const intentResponses = RESPONSES[intent];
  if (!intentResponses) {
    return FALLBACK_RESPONSES[language] || FALLBACK_RESPONSES.en;
  }
  return intentResponses[lang] || intentResponses.en;
}

/**
 * Determine suggested actions based on intent.
 * @param {string} intent
 * @returns {Array<{ label: string, action: string, payload?: object }>}
 */
function getSuggestedActions(intent) {
  const actionsMap = {
    navigate: [
      { label: 'Show Map', action: 'open_map' },
      { label: 'Find Route', action: 'navigate', payload: { prompt: true } },
    ],
    food: [
      { label: 'View Menu', action: 'view_recommendations', payload: { category: 'food' } },
      { label: 'Order Now', action: 'order_food' },
    ],
    emergency: [
      { label: 'Call Security', action: 'call_security' },
      { label: 'Medical Help', action: 'request_medical' },
    ],
    schedule: [
      { label: 'Full Schedule', action: 'view_schedule' },
      { label: 'Set Reminder', action: 'set_reminder' },
    ],
    parking: [
      { label: 'View Lots', action: 'view_recommendations', payload: { category: 'parking' } },
      { label: 'Find My Car', action: 'find_car' },
    ],
    restroom: [
      { label: 'Show on Map', action: 'open_map', payload: { filter: 'restroom' } },
    ],
    help: [
      { label: 'Navigation', action: 'chat', payload: { message: 'navigate' } },
      { label: 'Food', action: 'chat', payload: { message: 'food' } },
      { label: 'Emergency', action: 'chat', payload: { message: 'emergency' } },
    ],
    weather: [
      { label: 'Hourly Forecast', action: 'view_forecast' },
    ],
    merchandise: [
      { label: 'Browse Store', action: 'view_recommendations', payload: { category: 'merch' } },
    ],
    medical: [
      { label: 'Request Medic', action: 'request_medical' },
      { label: 'Find Station', action: 'navigate', payload: { to: 'medical-1' } },
    ],
    lost_child: [
      { label: 'Alert Security', action: 'report_lost_child' },
      { label: 'Call 222', action: 'call_security' },
    ],
    seating: [
      { label: 'Find My Seat', action: 'navigate', payload: { prompt: true } },
      { label: 'Seat Upgrade', action: 'upgrade_seat' },
    ],
  };
  return actionsMap[intent] || actionsMap.help;
}

// ---------------------------------------------------------------------------
// Main exported function (FR-01)
// ---------------------------------------------------------------------------

/**
 * Process a chatbot message request.
 * @param {Object} request – ChatbotRequest (spec 3.3)
 * @param {string} request.message – user's message text
 * @param {string} [request.session_id] – chat session ID
 * @param {string} [request.user_id] – user ID
 * @param {string} [request.language='en'] – preferred language
 * @param {string} [request.zone_id] – user's current zone
 * @returns {Promise<Object>} ChatbotResponse (spec 3.3)
 */
async function processMessage(request) {
  const {
    message,
    session_id = uuidv4(),
    user_id = null,
    language = 'en',
    zone_id = null,
    context = {}
  } = request;

  const activeZone = context.zone || zone_id || 'sec-101';
  const activeSeat = context.seat || 'Row H, Seat 12';
  const activeTicketClass = context.ticket_class || 'General Admission';

  // Check cache for duplicate AI requests
  const cacheKey = `${message.toLowerCase().trim()}_${language}_${activeZone}_${activeSeat}_${activeTicketClass}`;
  const cachedResponse = chatCache.get(cacheKey);
  if (cachedResponse) {
    return {
      ...cachedResponse,
      session_id,
      timestamp: new Date().toISOString()
    };
  }

  // Execute conversational AI reasoning through CircuitBreaker (FR-08)
  const result = await llmBreaker.execute(async () => {
    // Simulate AI processing delay (300-800ms) for realism
    const delay = 300 + Math.random() * 500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Classify intent
    const { intent, confidence } = classifyIntent(message);

    // Build response
    let responseText;
    let actions;
    let escalate = false;

    if (confidence < 0.3) {
      // Low confidence → fallback FAQ + escalation
      responseText = FALLBACK_RESPONSES[language] || FALLBACK_RESPONSES.en;
      actions = [
        { label: 'Talk to Staff', action: 'escalate_to_human' },
        { label: 'Try Again', action: 'retry' },
      ];
      escalate = true;
    } else {
      responseText = getResponseText(intent, language);
      actions = getSuggestedActions(intent);

      // Template substitution for context parameters
      responseText = responseText
        .replace(/{zone}/g, activeZone.toUpperCase())
        .replace(/{seat}/g, activeSeat)
        .replace(/{ticket_class}/g, activeTicketClass);
    }

    return { responseText, actions, escalate, delay };
  }, () => {
    // Open Circuit Breaker Fallback
    return {
      responseText: FALLBACK_RESPONSES[language] || FALLBACK_RESPONSES.en,
      actions: [
        { label: 'Talk to Staff', action: 'escalate_to_human' },
      ],
      escalate: true,
      delay: 0,
    };
  });

  const { responseText, actions, escalate, delay } = result;

  // Store in chat session
  db.addChatMessage(session_id, {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  });
  db.addChatMessage(session_id, {
    role: 'assistant',
    content: responseText,
    timestamp: new Date().toISOString(),
  });

  // Build ChatbotResponse (spec 3.3)
  const response = {
    response_id: uuidv4(),
    session_id,
    message: responseText,
    intent: result.intent || classifyIntent(message).intent,
    confidence: classifyIntent(message).confidence,
    language,
    suggested_actions: actions,
    escalate,
    timestamp: new Date().toISOString(),
    processing_time_ms: Math.round(delay),
  };

  chatCache.set(cacheKey, response);

  return response;
}

module.exports = { processMessage, classifyIntent };
