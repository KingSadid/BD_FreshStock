const userDao = require('../dao/user.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  if (role === 'admin') {
    const users = await userDao.getAll();
    return res.json(users);
  }
  const user = await userDao.getById(id);
  res.json(user ? [user] : []);
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

const deactivate = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden desactivar usuarios' });
  }
  if (id == req.params.id) {
    return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
  }
  const success = await userDao.deactivate(req.params.id);
  if (!success) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Usuario desactivado correctamente' });
});

const activate = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden activar usuarios' });
  }
  const success = await userDao.activate(req.params.id);
  if (!success) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Usuario activado correctamente' });
});

const remove = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden eliminar usuarios' });
  }
  if (id == req.params.id) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }
  const success = await userDao.remove(req.params.id);
  if (!success) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Usuario eliminado permanentemente' });
});

module.exports = { getAll, getById, create, deactivate, activate, remove };
