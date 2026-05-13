const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../utils/auth.middleware');

router.get('/', authenticate, userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.patch('/:id/deactivate', authenticate, userController.deactivate);
router.patch('/:id/activate', authenticate, userController.activate);
router.delete('/:id', authenticate, userController.remove);

module.exports = router;
