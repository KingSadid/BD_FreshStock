const express = require('express');
const router = express.Router();
const userDao = require('../dao/user.dao');

router.get('/', userDao.getAll);
router.get('/:id', userDao.getById);
router.post('/', userDao.create);

module.exports = router;