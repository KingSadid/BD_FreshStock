const userDao = require('../dao/user.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const users = await userDao.getAll();
  res.json(users);
});

const getById = asyncHandler(async (req, res) => {
  const user = await userDao.getById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

const create = asyncHandler(async (req, res) => {
  const result = await userDao.create(req.body);
  res.status(201).json(result);
});

module.exports = { getAll, getById, create };
