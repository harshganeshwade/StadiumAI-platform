/**
 * JWT Authentication Middleware (FR-10)
 * Fail-CLOSED design – deny on any error.
 */
'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

/**
 * Middleware: verify JWT Bearer token and attach user to req.
 * Fail-CLOSED: any error results in 401.
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Token not provided.',
      });
    }

    // Verify token with issuer check
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
    });

    // Look up user in the store
    const user = db.getUserById(decoded.sub || decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Authenticated user no longer exists.',
      });
    }

    // Attach sanitised user (no password) to request
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    // Fail CLOSED – deny on ANY error
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired. Please log in again.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Token is invalid.',
      });
    }
    return res.status(401).json({
      error: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed.',
    });
  }
}

/**
 * Middleware factory: require the authenticated user to have one of the given roles.
 * Must be used AFTER verifyToken.
 * @param  {...string} roles – allowed roles (e.g. 'admin', 'staff')
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    // If no user was attached (shouldn't happen if verifyToken ran first), deny
    if (!req.user) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'No authenticated user found.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Role "${req.user.role}" is not authorised. Required: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = { verifyToken, requireRole };
