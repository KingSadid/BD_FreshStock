const db = require('../services/mysql.service');
const AppError = require('../utils/AppError');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM test');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM test WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const { name, birthdate } = data;
  if(!name || !birthdate){
    throw new AppError('Bad Request', 400);
  }
  const [result] = await db.query(
    'INSERT INTO test (name, birthdate) VALUES (?, ?)',
    [name, birthdate]
  );
  return { id: result.insertId, name, birthdate };
};

module.exports = { getAll, getById, create };
