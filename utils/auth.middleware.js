const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const JWT_SECRET = 'freshstock_secret_key_2026';

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401));
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return next(new AppError('Token inválido o expirado', 401));
  }
};

module.exports = { authenticate };
