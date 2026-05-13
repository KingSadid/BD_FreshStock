const db = require('../services/mysql.service');

const findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT user_id, name, email, password_hash, role, is_active FROM user WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

const emailExists = async (email) => {
  const [rows] = await db.query(
    'SELECT 1 FROM user WHERE email = ?',
    [email]
  );
  return rows.length > 0;
};

const createUser = async ({ name, email, passwordHash, role = 'seller' }) => {
  const [result] = await db.query(
    'INSERT INTO user (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return { user_id: result.insertId, name, email, role };
};

const createSession = async (userId, tokenHash, ipAddress, userAgent) => {
  await db.query(
    'INSERT INTO audit_session (user_id, token_hash, ip_address, user_agent) VALUES (?, ?, ?, ?)',
    [userId, tokenHash, ipAddress, userAgent]
  );
};

const endSession = async (userId) => {
  await db.query(
    'UPDATE audit_session SET is_active = FALSE, end_time = NOW() WHERE user_id = ? AND is_active = TRUE',
    [userId]
  );
};

const getActiveSessionUserIds = async () => {
  const [rows] = await db.query(
    'SELECT DISTINCT user_id FROM audit_session WHERE is_active = TRUE'
  );
  return rows.map(r => r.user_id);
};

module.exports = { findByEmail, emailExists, createUser, createSession, endSession, getActiveSessionUserIds };
