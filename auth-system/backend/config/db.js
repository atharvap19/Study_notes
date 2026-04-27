const mysql = require('mysql2/promise');

const useSSL = ['1', 'true', 'yes'].includes(String(process.env.DB_SSL || '').toLowerCase());
const rejectUnauthorized = !['0', 'false', 'no'].includes(
  String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase()
);

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            Number(process.env.DB_PORT) || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'vidnotes_auth',
  ...(useSSL ? { ssl: { rejectUnauthorized } } : {}),
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

module.exports = pool;
