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

module.exports = { findByEmail, emailExists, createUser };
