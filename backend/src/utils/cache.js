/**
 * TTL Cache Utility (cache.js)
 * Implements standard Time-To-Live in-memory caching to avoid redundant API responses
 * and CPU path calculations (Priority 3 -- Efficiency).
 */
'use strict';

class TTLCache {
  /**
   * @param {number} ttlMs – Time-to-live in milliseconds
   */
  constructor(ttlMs = 5000) {
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  /**
   * Get an entry from cache. Returns null if expired or missing.
   * @param {string} key
   * @returns {*} cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Set an entry in cache with current TTL configuration.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = TTLCache;
