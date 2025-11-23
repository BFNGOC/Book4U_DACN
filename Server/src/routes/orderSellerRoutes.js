const express = require('express');
const router = express.Router();
const orderSellerController = require('../controllers/orderSellerController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// All routes require authentication and seller role
router.use(authMiddleware);
router.use(roleMiddleware('seller'));

// Orders management
router.get('/', orderSellerController.getSellerOrders);
router.get('/:orderId', orderSellerController.getSellerOrderDetail);
router.put('/:orderId/status', orderSellerController.updateOrderStatus);

// Statistics
router.get('/stats/revenue', orderSellerController.getRevenueStats);

module.exports = router;
