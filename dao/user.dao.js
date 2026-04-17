const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, email, role, is_active, created_at FROM user');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, role, is_active, created_at FROM user WHERE user_id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, password_hash, role = 'seller' } = req.body;
    if (!name || !email || !password_hash) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const [result] = await db.query(
      'INSERT INTO user (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    res.status(201).json({ user_id: result.insertId, name, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create };