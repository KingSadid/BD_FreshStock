const db = require('../services/mysql.service');
const AppError = require('../utils/AppError');

const getAll = async () => {
  const [rows] = await db.query(`
    SELECT user.user_id, user.name, user.email, user.role, user.is_active, user.created_at,
           CASE WHEN active_session.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_online
    FROM user
    LEFT JOIN (
      SELECT DISTINCT audit_session.user_id FROM audit_session WHERE audit_session.is_active = TRUE
    ) active_session ON user.user_id = active_session.user_id
  `);
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query(
    'SELECT user_id, name, email, role, is_active, created_at FROM user WHERE user_id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const { name, email, password_hash, role = 'seller' } = data;
  if (!name || !email || !password_hash) {
    throw new AppError('Faltan campos requeridos', 400);
  }
  const [result] = await db.query(
    'INSERT INTO user (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, role]
  );
  return { user_id: result.insertId, name, email, role };
};

const deactivate = async (id) => {
  const [result] = await db.query('UPDATE user SET is_active = FALSE WHERE user_id = ?', [id]);
  return result.affectedRows > 0;
};

const activate = async (id) => {
  const [result] = await db.query('UPDATE user SET is_active = TRUE WHERE user_id = ?', [id]);
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM user WHERE user_id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { getAll, getById, create, deactivate, activate, remove };
