const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');

const uploadProduct = createUploader('products');

router.get('/', productController.getAllProducts);

router.get('/category/:slug', productController.getProductsByCategorySlug);

router.get('/:id', productController.getProductById);

router.get('/:id/related', productController.getRelatedProducts);

router.post(
    '/',
    authMiddleware,
    roleMiddleware('seller'),
    uploadProduct.array('images', 5),
    productController.createProduct
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    uploadProduct.array('images', 5),
    productController.updateProduct
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    productController.deleteProduct
);

module.exports = router;
