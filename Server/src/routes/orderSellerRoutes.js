const express = require('express');
const router = express.Router();
const orderSellerController = require('../controllers/orderSellerController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// All routes require authentication and seller role
router.use(authMiddleware);
router.use(roleMiddleware('seller'));

// Statistics (MUST be before /:orderId to avoid param matching)
router.get('/stats/revenue', orderSellerController.getRevenueStats);

// Orders management
router.get('/', orderSellerController.getSellerOrders);
router.get('/:orderId', orderSellerController.getSellerOrderDetail);
router.put('/:orderId/status', orderSellerController.updateOrderStatus);

// Order workflow: picking → packed → handoff carrier
router.put('/:orderId/status/picking', orderSellerController.startPicking);
router.put('/:orderId/status/packed', orderSellerController.markAsPacked);
router.put('/:orderId/handoff-carrier', orderSellerController.handoffToCarrier);

module.exports = router;
