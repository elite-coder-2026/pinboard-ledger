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
  const filters = ['n.user_id = $1'];
  const values = [user.id];
  let idx = 2;

  if (queryParams.notebook_id) {
    filters.push(`n.notebook_id = $${idx++}`);
    values.push(queryParams.notebook_id);
  }
  if (queryParams.pinned !== undefined) {
    filters.push(`n.pinned = $${idx++}`);
    values.push(String(queryParams.pinned) === 'true');
  }
  if (queryParams.q) {
    filters.push(`(n.title ILIKE $${idx} OR n.content ILIKE $${idx})`);
    values.push(`%${queryParams.q}%`);
    idx++;
  }

  let join = '';
  if (queryParams.tag_id) {
    join = 'JOIN pl.note_tags nt ON nt.note_id = n.id';
    filters.push(`nt.tag_id = $${idx++}`);
    values.push(queryParams.tag_id);
  }

  values.push(limit, offset);

  const result = await query(
    `SELECT n.id, n.user_id, n.notebook_id, n.title, n.content, n.content_format,
            n.pinned, n.created_at, n.updated_at
     FROM pl.notes n
     ${join}
     WHERE ${filters.join(' AND ')}
     ORDER BY n.pinned DESC, n.updated_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return { items: result.rows, limit, offset };
}

async function getById(user, id) {
  requireUser(user);
  const noteRes = await query(
    `SELECT id, user_id, notebook_id, title, content, content_format, pinned, created_at, updated_at
     FROM pl.notes
     WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  if (noteRes.rowCount === 0) {
    throw createError(404, 'Note not found');
  }

  const tagsRes = await query(
    `SELECT t.id, t.tag_name AS name
     FROM pl.tags t
     JOIN pl.note_tags nt ON nt.tag_id = t.id
     WHERE nt.note_id = $1
     ORDER BY t.tag_name`,
    [id]
  );

  const attachmentsRes = await query(
    `SELECT id, note_id, file_name, file_type, file_size, mime_type, created_at
     FROM pl.attachments
     WHERE note_id = $1
     ORDER BY created_at DESC`,
    [id]
  );

  return {
    ...noteRes.rows[0],
    tags: tagsRes.rows,
    attachments: attachmentsRes.rows,
  };
}

async function create(user, payload) {
  requireUser(user);
  const title = payload.title ? String(payload.title).trim() : null;
  const content = payload.content ? String(payload.content) : null;
  const contentFormat = payload.content_format ? String(payload.content_format).trim() : 'markdown';
  const pinned = Boolean(payload.pinned);
  const notebookId = payload.notebook_id || null;

  const result = await query(
    `INSERT INTO pl.notes (user_id, notebook_id, title, content, content_format, pinned)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, notebook_id, title, content, content_format, pinned, created_at, updated_at`,
    [user.id, notebookId, title, content, contentFormat, pinned]
  );

  return result.rows[0];
}

async function update(user, id, payload) {
  requireUser(user);
  const fields = [];
  const values = [id, user.id];
  let idx = values.length + 1;

  if (payload.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(payload.title ? String(payload.title).trim() : null);
  }
  if (payload.content !== undefined) {
    fields.push(`content = $${idx++}`);
    values.push(payload.content ? String(payload.content) : null);
  }
  if (payload.content_format !== undefined) {
    const fmt = String(payload.content_format || '').trim();
    if (!fmt) throw createError(400, 'content_format cannot be empty');
    fields.push(`content_format = $${idx++}`);
    values.push(fmt);
  }
  if (payload.pinned !== undefined) {
    fields.push(`pinned = $${idx++}`);
    values.push(Boolean(payload.pinned));
  }
  if (payload.notebook_id !== undefined) {
    fields.push(`notebook_id = $${idx++}`);
    values.push(payload.notebook_id || null);
  }

  if (fields.length === 0) {
    throw createError(400, 'No fields to update');
  }

  const result = await query(
    `UPDATE pl.notes
     SET ${fields.join(', ')}, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, notebook_id, title, content, content_format, pinned, created_at, updated_at`,
    values
  );

  if (result.rowCount === 0) {
    throw createError(404, 'Note not found');
  }

  return result.rows[0];
}

async function remove(user, id) {
  requireUser(user);
  const result = await query(
    'DELETE FROM pl.notes WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  );
  if (result.rowCount === 0) {
    throw createError(404, 'Note not found');
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
