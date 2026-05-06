const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const hash = async (plainText) => {
  return bcrypt.hash(plainText, SALT_ROUNDS);
};

const compare = async (plainText, hashedValue) => {
  return bcrypt.compare(plainText, hashedValue);
};

module.exports = { hash, compare };
