'use strict';

const createError = require('http-errors');
const { query } = require('../db/pool');
const { parsePagination } = require('../utils/pagination');

function requireUser(user) {
  if (!user || !user.id) {
    throw createError(401, 'Not authenticated');
  }
}

async function list(user, queryParams) {
  requireUser(user);
  const { limit, offset } = parsePagination(queryParams);
  const filters = ['user_id = $1'];
  const values = [user.id];
  let idx = 2;

  if (queryParams.status) {
    filters.push(`status = $${idx++}`);
    values.push(String(queryParams.status).trim());
  }
  if (queryParams.start_at) {
    filters.push(`remind_at >= $${idx++}`);
    values.push(queryParams.start_at);
  }
  if (queryParams.end_at) {
    filters.push(`remind_at <= $${idx++}`);
    values.push(queryParams.end_at);
  }

  values.push(limit, offset);

  const result = await query(
    `SELECT id, user_id, note_id, remind_at, status, created_at, updated_at
     FROM pl.reminders
     WHERE ${filters.join(' AND ')}
     ORDER BY remind_at ASC
     LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return { items: result.rows, limit, offset };
}

async function getById(user, id) {
  requireUser(user);
  const result = await query(
    `SELECT id, user_id, note_id, remind_at, status, created_at, updated_at
     FROM pl.reminders
     WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Reminder not found');
  }
  return result.rows[0];
}

async function create(user, payload) {
  requireUser(user);
  const remindAt = payload.remind_at ? String(payload.remind_at) : null;
  const status = payload.status ? String(payload.status).trim() : 'scheduled';
  const noteId = payload.note_id || null;

  if (!remindAt) {
    throw createError(400, 'remind_at is required');
  }

  const result = await query(
    `INSERT INTO pl.reminders (user_id, note_id, remind_at, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, note_id, remind_at, status, created_at, updated_at`,
    [user.id, noteId, remindAt, status]
  );

  return result.rows[0];
}

async function update(user, id, payload) {
  requireUser(user);
  const fields = [];
  const values = [id, user.id];
  let idx = values.length + 1;

  if (payload.remind_at !== undefined) {
    const remindAt = payload.remind_at ? String(payload.remind_at) : null;
    if (!remindAt) throw createError(400, 'remind_at cannot be empty');
    fields.push(`remind_at = $${idx++}`);
    values.push(remindAt);
  }
  if (payload.status !== undefined) {
    const status = String(payload.status || '').trim();
    if (!status) throw createError(400, 'status cannot be empty');
    fields.push(`status = $${idx++}`);
    values.push(status);
  }
  if (payload.note_id !== undefined) {
    fields.push(`note_id = $${idx++}`);
    values.push(payload.note_id || null);
  }

  if (fields.length === 0) {
    throw createError(400, 'No fields to update');
  }

  const result = await query(
    `UPDATE pl.reminders
     SET ${fields.join(', ')}, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, note_id, remind_at, status, created_at, updated_at`,
    values
  );

  if (result.rowCount === 0) {
    throw createError(404, 'Reminder not found');
  }

  return result.rows[0];
}

async function remove(user, id) {
  requireUser(user);
  const result = await query(
    'DELETE FROM pl.reminders WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Reminder not found');
  }
  return { id: result.rows[0].id, deleted: true };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
