const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');

router.get('/', testController.getAll);
router.get('/:id', testController.getById);
router.post('/', testController.create);

module.exports = router;
