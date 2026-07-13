/**
 * StadiumAI Server Configuration
 * Reads from environment variables with sensible defaults for hackathon demo.
 */
'use strict';

const config = {
  /** Server port */
  PORT: parseInt(process.env.PORT, 10) || 3001,

  /** JWT signing secret */
  JWT_SECRET: process.env.JWT_SECRET || 'stadium-ai-secret-key-2026',

  /** JWT issuer claim */
  JWT_ISSUER: process.env.JWT_ISSUER || 'stadium-ai',

  /** JWT token expiry */
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  /** Timeout for AI model calls in milliseconds */
  AI_MODEL_TIMEOUT_MS: parseInt(process.env.AI_MODEL_TIMEOUT_MS, 10) || 2000,

  /** Maximum concurrent users the system is designed for */
  MAX_CONCURRENT_USERS: parseInt(process.env.MAX_CONCURRENT_USERS, 10) || 120000,

  /** Rate limiting defaults */
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  /** CORS allowed origins */
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(','),

  /** Circuit breaker defaults */
  CB_FAILURE_THRESHOLD: parseInt(process.env.CB_FAILURE_THRESHOLD, 10) || 5,
  CB_COOLDOWN_MS: parseInt(process.env.CB_COOLDOWN_MS, 10) || 30000,

  /** Simulator intervals */
  CROWD_SIM_INTERVAL_MS: parseInt(process.env.CROWD_SIM_INTERVAL_MS, 10) || 3000,
  ALERT_SIM_MIN_INTERVAL_MS: parseInt(process.env.ALERT_SIM_MIN_INTERVAL_MS, 10) || 15000,
  ALERT_SIM_MAX_INTERVAL_MS: parseInt(process.env.ALERT_SIM_MAX_INTERVAL_MS, 10) || 30000,
};

module.exports = config;
