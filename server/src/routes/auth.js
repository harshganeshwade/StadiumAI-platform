/**
 * Auth Routes (auth.js)
 * Implements register, login, and profile retrieval.
 * Supports RBAC and fail-closed security.
 */
'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role, preferred_language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name, email, and password are required.' });
    }

    const existingUser = db.getUser(email);
    if (existingUser) {
      return res.status(400).json({ error: 'EMAIL_EXISTS', message: 'Email address already registered.' });
    }

    // Fail closed: only fans can be self-registered. Staff/admin must be pre-seeded or registered by admin.
    const requestedRole = role || 'fan';
    if (requestedRole !== 'fan') {
      return res.status(403).json({ error: 'UNAUTHORIZED_ROLE', message: 'Cannot self-register as staff or admin.' });
    }

    const user = db.createUser({
      name,
      email,
      password,
      role: requestedRole,
      preferred_language: preferred_language || 'en'
    });

    const token = jwt.sign({ id: user.id, role: user.role }, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      expiresIn: '24h'
    });

    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('[AuthRoute] Registration error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to register user.' });
  }
});

/**
 * POST /api/auth/login
 * Log in an existing user
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
    }

    const user = db.getUser(email);
    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      expiresIn: '24h'
    });

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[AuthRoute] Login error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to log in.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieve the current authenticated user's profile
 */
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/reset-password
 * Reset user password
 */
router.post('/reset-password', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and new password are required.' });
    }

    const updated = db.updateUserPassword(email, password);
    if (!updated) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User with this email does not exist.' });
    }

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('[AuthRoute] Password reset error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to reset password.' });
  }
});

module.exports = router;
