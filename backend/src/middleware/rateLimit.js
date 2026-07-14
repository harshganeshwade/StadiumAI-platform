/**
 * Sliding-window rate limiter middleware
 * Tracks requests per IP using an in-memory Map.
 * Returns 429 Too Many Requests when the limit is exceeded.
 */
'use strict';

/**
 * Create a rate-limiting middleware.
 * @param {Object} options
 * @param {number} [options.windowMs=60000]     – sliding window duration in ms
 * @param {number} [options.maxRequests=100]     – max requests per IP per window
 * @param {string} [options.message]             – custom 429 response message
 * @returns {Function} Express middleware
 */
function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60000;
  const maxRequests = options.maxRequests || 100;
  const message = options.message || 'Too many requests. Please try again later.';

  /** Map<string, number[]> – IP → array of request timestamps */
  const requestLog = new Map();

  // Periodically prune stale entries to prevent memory leaks (every 5 minutes)
  const pruneInterval = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, timestamps] of requestLog.entries()) {
      const filtered = timestamps.filter((t) => t > cutoff);
      if (filtered.length === 0) {
        requestLog.delete(ip);
      } else {
        requestLog.set(ip, filtered);
      }
    }
  }, 5 * 60 * 1000);

  // Allow Node to exit cleanly even if this interval is running
  if (pruneInterval.unref) {
    pruneInterval.unref();
  }

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;

    // Get existing timestamps and prune old ones
    let timestamps = requestLog.get(ip) || [];
    timestamps = timestamps.filter((t) => t > cutoff);

    if (timestamps.length >= maxRequests) {
      // Calculate when the client can retry
      const oldestInWindow = timestamps[0];
      const retryAfterMs = oldestInWindow + windowMs - now;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.set('Retry-After', String(retryAfterSec));
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil((oldestInWindow + windowMs) / 1000)));

      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retry_after_seconds: retryAfterSec,
      });
    }

    // Record this request
    timestamps.push(now);
    requestLog.set(ip, timestamps);

    // Set rate limit headers on successful requests
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - timestamps.length));

    next();
  };
}

module.exports = { rateLimit };
