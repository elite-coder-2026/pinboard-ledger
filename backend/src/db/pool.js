'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  options: '-c search_path=pl,public',
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 2000),
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
