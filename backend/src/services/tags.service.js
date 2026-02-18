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
    `SELECT id, user_id, tag_name, note_id
     FROM pl.tags
     WHERE user_id = $1
     ORDER BY tag_name
     LIMIT $2 OFFSET $3`,
    [user.id, limit, offset]
  );
  return { items: result.rows, limit, offset };
}

async function getById(user, id) {
  requireUser(user);
  const result = await query(
    `SELECT id, user_id, tag_name, note_id
     FROM pl.tags
     WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Tag not found');
  }
  return result.rows[0];
}

async function create(user, payload) {
  requireUser(user);
  const tag_name = String(payload.tag_name || '').trim();
  const note_id = payload.note_id ? String(payload.note_id).trim() : null;

  if (!tag_name) {
    throw createError(400, 'Name is required');
  }

  try {
    const result = await query(
      `INSERT INTO pl.tags (user_id, tag_name, note_id)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, tag_name, note_id`,
      [user.id, tag_name, note_id]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createError(409, 'Tag already exists');
    }
    throw err;
  }
}

async function update(user, id, payload) {
  requireUser(user);
  const fields = [];
  const values = [id, user.id];
  let idx = values.length + 1;

  if (payload.tag_name !== undefined) {
    const tag_name = String(payload.tag_name || '').trim();
    if (!tag_name) throw createError(400, 'Name cannot be empty');
    fields.push(`tag_name = $${idx++}`);
    values.push(tag_name);
  }
  if (payload.note_id !== undefined) {
    fields.push(`note_id = $${idx++}`);
    values.push(payload.note_id ? String(payload.note_id).trim() : null);
  }

  if (fields.length === 0) {
    throw createError(400, 'No fields to update');
  }

  try {
    const result = await query(
      `UPDATE pl.tags
       SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, tag_name, note_id`,
      values
    );

    if (result.rowCount === 0) {
      throw createError(404, 'Tag not found');
    }

    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createError(409, 'Tag already exists');
    }
    throw err;
  }
}

async function remove(user, id) {
  requireUser(user);
  const result = await query(
    'DELETE FROM pl.tags WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Tag not found');
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
