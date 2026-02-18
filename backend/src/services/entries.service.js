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

  if (queryParams.start_date) {
    filters.push(`entry_date >= $${idx++}`);
    values.push(queryParams.start_date);
  }
  if (queryParams.end_date) {
    filters.push(`entry_date <= $${idx++}`);
    values.push(queryParams.end_date);
  }

  values.push(limit, offset);

  const result = await query(
    `SELECT id, user_id, note_id, entry_date, mood, created_at, updated_at
     FROM pl.entries
     WHERE ${filters.join(' AND ')}
     ORDER BY entry_date DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return { items: result.rows, limit, offset };
}

async function getById(user, id) {
  requireUser(user);
  const result = await query(
    `SELECT id, user_id, note_id, entry_date, mood, created_at, updated_at
     FROM pl.entries
     WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Entry not found');
  }
  return result.rows[0];
}

async function create(user, payload) {
  requireUser(user);
  const entryDate = payload.entry_date ? String(payload.entry_date) : null;
  const mood = payload.mood ? String(payload.mood).trim() : null;
  const noteId = payload.note_id || null;

  if (!entryDate) {
    throw createError(400, 'entry_date is required');
  }

  try {
    const result = await query(
      `INSERT INTO pl.entries (user_id, note_id, entry_date, mood)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, note_id, entry_date, mood, created_at, updated_at`,
      [user.id, noteId, entryDate, mood]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createError(409, 'Entry already exists for that date');
    }
    throw err;
  }
}

async function update(user, id, payload) {
  requireUser(user);
  const fields = [];
  const values = [id, user.id];
  let idx = values.length + 1;

  if (payload.entry_date !== undefined) {
    const entryDate = payload.entry_date ? String(payload.entry_date) : null;
    if (!entryDate) throw createError(400, 'entry_date cannot be empty');
    fields.push(`entry_date = $${idx++}`);
    values.push(entryDate);
  }
  if (payload.mood !== undefined) {
    fields.push(`mood = $${idx++}`);
    values.push(payload.mood ? String(payload.mood).trim() : null);
  }
  if (payload.note_id !== undefined) {
    fields.push(`note_id = $${idx++}`);
    values.push(payload.note_id || null);
  }

  if (fields.length === 0) {
    throw createError(400, 'No fields to update');
  }

  try {
    const result = await query(
      `UPDATE pl.entries
       SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, note_id, entry_date, mood, created_at, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      throw createError(404, 'Entry not found');
    }

    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createError(409, 'Entry already exists for that date');
    }
    throw err;
  }
}

async function remove(user, id) {
  requireUser(user);
  const result = await query(
    'DELETE FROM pl.entries WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Entry not found');
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
