const request = require('supertest');
const { app, server } = require('../backend/src/index');
const config = require('../backend/src/config');
const chatbot = require('../backend/src/services/chatbot');

describe('Chatbot API and Fallback Tests', () => {


  test('POST /api/chat - Should process message and classify intent successfully', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        session_id: 'test-session-123',
        message: 'Where is my seat?',
        language: 'en',
        context: {
          zone: 'sec-102',
          seat: 'Row B, Seat 4',
          ticket_class: 'VIP'
        }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('intent');
    expect(res.body.intent).toEqual('seating');
    expect(res.body.message).toContain('SEC-102');
    expect(res.body.message).toContain('VIP');
  });

  test('POST /api/chat - Should fall back to static FAQ on unrecognized messages (low confidence)', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        session_id: 'test-session-123',
        message: 'xyz123abcfakequestionhere',
        language: 'en'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.escalate).toBe(true);
    expect(res.body.suggested_actions[0].action).toEqual('escalate_to_human');
  });

  test('POST /api/chat - Should degrade to timeout response if request hangs beyond timeout limit', async () => {
    // Set low timeout dynamically to trigger timeout fast
    const originalTimeout = config.AI_MODEL_TIMEOUT_MS;
    config.AI_MODEL_TIMEOUT_MS = 10; // 10ms timeout

    const res = await request(app)
      .post('/api/chat')
      .send({
        session_id: 'test-session-timeout',
        message: 'Where is my seat?',
        language: 'en'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.intent).toEqual('fallback_timeout');
    expect(res.body.reply).toContain('high response times');

    // Restore original timeout
    config.AI_MODEL_TIMEOUT_MS = originalTimeout;
  });

  test('chatbot.classifyIntent - Should classify keywords accurately', () => {
    const r1 = chatbot.classifyIntent('need food and drinks');
    expect(r1.intent).toEqual('food');

    const r2 = chatbot.classifyIntent('help emergency fire');
    expect(r2.intent).toEqual('emergency');
  });
});
