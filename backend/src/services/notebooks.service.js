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
  const result = await query(
    `SELECT id, user_id, title, description, sort_order, created_at, updated_at
     FROM pl.notebooks
     WHERE user_id = $1
     ORDER BY sort_order NULLS LAST, updated_at DESC
     LIMIT $2 OFFSET $3`,
    [user.id, limit, offset]
  );
  return { items: result.rows, limit, offset };
}

async function getById(user, id) {
  requireUser(user);
  const result = await query(
    `SELECT id, user_id, title, description, sort_order, created_at, updated_at
     FROM pl.notebooks
     WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Notebook not found');
  }
  return result.rows[0];
}

async function create(user, payload) {
  requireUser(user);
  const title = String(payload.title || '').trim();
  const description = payload.description ? String(payload.description).trim() : null;
  const sortOrder = payload.sort_order !== undefined ? Number(payload.sort_order) : null;

  if (!title) {
    throw createError(400, 'Title is required');
  }

  const result = await query(
    `INSERT INTO pl.notebooks (user_id, title, description, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, title, description, sort_order, created_at, updated_at`,
    [user.id, title, description, sortOrder]
  );
  return result.rows[0];
}

async function update(user, id, payload) {
  requireUser(user);
  const fields = [];
  const values = [id, user.id];
  let idx = values.length + 1;

  if (payload.title !== undefined) {
    const title = String(payload.title || '').trim();
    if (!title) throw createError(400, 'Title cannot be empty');
    fields.push(`title = $${idx++}`);
    values.push(title);
  }
  if (payload.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(payload.description ? String(payload.description).trim() : null);
  }
  if (payload.sort_order !== undefined) {
    fields.push(`sort_order = $${idx++}`);
    values.push(Number(payload.sort_order));
  }

  if (fields.length === 0) {
    throw createError(400, 'No fields to update');
  }

  const result = await query(
    `UPDATE pl.notebooks
     SET ${fields.join(', ')}, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, title, description, sort_order, created_at, updated_at`,
    values
  );

  if (result.rowCount === 0) {
    throw createError(404, 'Notebook not found');
  }

  return result.rows[0];
}

async function remove(user, id) {
  requireUser(user);
  const result = await query(
    'DELETE FROM pl.notebooks WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Notebook not found');
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
