/**
 * Circuit Breaker Pattern (Section 8)
 * Wraps async functions to prevent cascading failures.
 * States: CLOSED (normal), OPEN (rejecting), HALF_OPEN (testing recovery).
 */
'use strict';

const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {number} [options.failureThreshold=5]  – consecutive failures before opening
   * @param {number} [options.cooldownMs=30000]    – time to wait before half-open test
   * @param {number} [options.successThreshold=2]  – successes in HALF_OPEN to close
   * @param {string} [options.name='default']      – identifier for logging
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 30000;
    this.successThreshold = options.successThreshold || 2;
    this.name = options.name || 'default';

    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Execute an async function through the circuit breaker.
   * @param {Function} fn        – async function to execute
   * @param {*}        fallback  – value to return when circuit is open (optional)
   * @returns {Promise<*>}
   */
  async execute(fn, fallback) {
    if (this.state === STATES.OPEN) {
      // Check if cooldown has elapsed → transition to HALF_OPEN
      if (Date.now() >= this.nextAttemptTime) {
        this.state = STATES.HALF_OPEN;
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] OPEN → HALF_OPEN`);
      } else {
        // Circuit is still open – return fallback or throw
        if (fallback !== undefined) {
          return typeof fallback === 'function' ? fallback() : fallback;
        }
        throw new Error(`Circuit breaker "${this.name}" is OPEN – request rejected`);
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      // If a fallback was provided, return it instead of throwing
      if (fallback !== undefined) {
        return typeof fallback === 'function' ? fallback() : fallback;
      }
      throw err;
    }
  }

  /** Record a successful call */
  _onSuccess() {
    if (this.state === STATES.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = STATES.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] HALF_OPEN → CLOSED`);
      }
    }
    // In CLOSED state, reset failure count on success
    if (this.state === STATES.CLOSED) {
      this.failureCount = 0;
    }
  }

  /** Record a failed call */
  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === STATES.HALF_OPEN) {
      // Any failure in HALF_OPEN reopens the circuit
      this.state = STATES.OPEN;
      this.nextAttemptTime = Date.now() + this.cooldownMs;
      console.log(`[CircuitBreaker:${this.name}] HALF_OPEN → OPEN`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = STATES.OPEN;
      this.nextAttemptTime = Date.now() + this.cooldownMs;
      console.log(`[CircuitBreaker:${this.name}] CLOSED → OPEN (failures: ${this.failureCount})`);
    }
  }

  /** Get current circuit breaker status (for health/debug endpoints) */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /** Manually reset the circuit breaker */
  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}

module.exports = { CircuitBreaker, STATES };
