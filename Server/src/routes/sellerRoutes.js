const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// Public routes
router.get('/:sellerId', sellerController.getSellerStore);
router.get('/:sellerId/products', sellerController.getSellerProducts);

// Private routes (seller only)
router.get(
    '/dashboard/info',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.getSellerDashboard
);
router.get(
    '/dashboard/stats',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.getSellerStats
);
router.put(
    '/profile/update',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.updateSellerProfile
);

module.exports = router;
