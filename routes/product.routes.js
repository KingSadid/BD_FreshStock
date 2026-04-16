const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, productController.getAll);
router.get('/:id', verifyToken, productController.getOne);

module.exports = router;
