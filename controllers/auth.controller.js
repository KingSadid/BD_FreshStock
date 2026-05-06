const jwt = require('jsonwebtoken');
const authDao = require('../dao/auth.dao');
const hashService = require('../services/hash.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const JWT_SECRET = 'freshstock_secret_key_2026';
const JWT_EXPIRES_IN = '8h';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.user_id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Nombre, email y contraseña son obligatorios', 400);
  }

  if (password.length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
  }

  const exists = await authDao.emailExists(email);
  if (exists) {
    throw new AppError('El correo electrónico ya está registrado', 409);
  }

  const passwordHash = await hashService.hash(password);
  const user = await authDao.createUser({ name, email, passwordHash, role });
  const token = generateToken(user);

  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email y contraseña son obligatorios', 400);
  }

  const user = await authDao.findByEmail(email);
  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }

  if (!user.is_active) {
    throw new AppError('Usuario desactivado', 403);
  }

  const valid = await hashService.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const token = generateToken(user);

  res.json({
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
});

module.exports = { register, login };
