'use strict';

const createError = require('http-errors');
const { query } = require('../db/pool');
const { parsePagination } = require('../utils/pagination');

function requireUser(user) {
  if (!user || !user.id) {
    throw createError(401, 'Not authenticated');
  }
}

async function list(user, queryParams = {}) {
  requireUser(user);
  const { limit, offset } = parsePagination(queryParams);
  const noteId = queryParams?.note_id;
  const { attachment_queries } = await import('../db/queries.mjs');
  const values = noteId
    ? [user.id, noteId, limit, offset]
    : [user.id, limit, offset];
  const text = noteId
    ? attachment_queries.listByUserAndNote
    : attachment_queries.listByUser;

  const result = await query(text, values);
  return { items: result.rows, limit, offset };
}

async function getById(user, id) {
  requireUser(user);
  const { attachment_queries } = await import('../db/queries.mjs');
  const result = await query(attachment_queries.getById, [id, user.id]);
  if (result.rowCount === 0) {
    throw createError(404, 'Attachment not found');
  }
  return result.rows[0];
}

async function create(user, payload = {}) {
  requireUser(user);
  const noteId = payload?.note_id;
  const fileName = String(payload?.file_name || '').trim();
  const fileType = String(payload?.file_type || '').trim();
  const fileSize = Number(payload?.file_size || 0);
  const mimeType = payload?.mime_type ? String(payload.mime_type).trim() : null;
  const fileData = payload?.file_data || null;

  if (!noteId || !fileName || !fileType || !fileSize) {
    throw createError(400, 'note_id, file_name, file_type, file_size are required');
  }

  const noteCheck = await query('SELECT 1 FROM pl.notes WHERE id = $1 AND user_id = $2', [noteId, user.id]);
  if (noteCheck.rowCount === 0) {
    throw createError(404, 'Note not found');
  }

  const { attachment_queries } = await import('../db/queries.mjs');
  const result = await query(
    attachment_queries.create,
    [noteId, fileName, fileType, fileSize, mimeType, fileData]
  );

  return result.rows[0];
}

async function update(user, id, payload) {
  requireUser(user);
  const { attachment_queries } = await import('../db/queries.mjs');

  const existing = await query(attachment_queries.getById, [id, user.id]);
  if (existing.rowCount === 0) {
    throw createError(404, 'Attachment not found');
  }

  const current = existing.rows[0];
  const fileName = payload?.file_name !== undefined ? String(payload.file_name || '').trim() : current.file_name;
  const fileType = payload?.file_type !== undefined ? String(payload.file_type || '').trim() : current.file_type;
  const fileSize = payload?.file_size !== undefined ? Number(payload.file_size || 0) : current.file_size;
  const mimeType = payload?.mime_type !== undefined ? String(payload.mime_type || '').trim() : current.mime_type;
  const fileData = payload?.file_data !== undefined ? payload.file_data : current.file_data;

  if (!fileName || !fileType || !fileSize) {
    throw createError(400, 'file_name, file_type, file_size are required');
  }

  const result = await query(
    attachment_queries.update,
    [id, user.id, fileName, fileType, fileSize, mimeType, fileData]
  );

  if (result.rowCount === 0) {
    throw createError(404, 'Attachment not found');
  }

  return result.rows[0];
}

async function remove(user, id) {
  requireUser(user);
  const { attachment_queries } = await import('../db/queries.mjs');
  const result = await query(attachment_queries.remove, [id, user.id]);
  if (result.rowCount === 0) {
    throw createError(404, 'Attachment not found');
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
