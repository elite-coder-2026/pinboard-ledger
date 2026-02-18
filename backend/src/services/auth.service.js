'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { query } = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function register(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const displayName = payload.display_name ? String(payload.display_name).trim() : null;
  const accountStatus = payload.account_status ? String(payload.account_status).trim() : 'active';

  if (!email || !password) {
    throw createError(400, 'Email and password are required');
  }

  const existing = await query('SELECT 1 FROM pl.users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw createError(409, 'Email already registered');
  }

  const passHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO pl.users (email, pass_hash, display_name, account_status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, display_name, account_status, created_at, updated_at`,
    [email, passHash, displayName, accountStatus]
  );

  const user = result.rows[0];
  const token = signToken(user);

  return { user, token };
}

async function login(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!email || !password) {
    throw createError(400, 'Email and password are required');
  }

  const result = await query(
    'SELECT id, email, pass_hash, display_name, account_status, created_at, updated_at FROM pl.users WHERE email = $1',
    [email]
  );

  if (result.rowCount === 0) {
    throw createError(401, 'Invalid credentials');
  }

  const userRow = result.rows[0];
  if (userRow.account_status && userRow.account_status !== 'active') {
    throw createError(403, 'Account inactive');
  }

  const ok = await bcrypt.compare(password, userRow.pass_hash);
  if (!ok) {
    throw createError(401, 'Invalid credentials');
  }

  const user = {
    id: userRow.id,
    email: userRow.email,
    display_name: userRow.display_name,
    account_status: userRow.account_status,
    created_at: userRow.created_at,
    updated_at: userRow.updated_at,
  };

  const token = signToken(user);

  return { user, token };
}

async function logout(user) {
  if (!user) {
    throw createError(401, 'Not authenticated');
  }

  return { message: 'Logged out' };
}

module.exports = {
  register,
  login,
  logout,
};
