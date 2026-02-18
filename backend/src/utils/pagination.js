'use strict';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parsePagination(query = {}) {
  const limitRaw = Number(query.limit || DEFAULT_LIMIT);
  const offsetRaw = Number(query.offset || 0);

  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

  return { limit, offset };
}

module.exports = {
  parsePagination,
};
