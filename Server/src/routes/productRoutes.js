const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.get('/', productController.getAllProducts);

router.get('/:id', productController.getProductById);

router.post(
    '/',
    authMiddleware,
    roleMiddleware('seller'),
    productController.createProduct
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    productController.updateProduct
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    productController.deleteProduct
);

module.exports = router;
