const express = require('express');
const router = express.Router();
const orderSellerController = require('../controllers/orderSellerController');
const orderDetailSellerController = require('../controllers/orderDetailSellerController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// All routes require authentication and seller role
router.use(authMiddleware);
router.use(roleMiddleware('seller'));

// Statistics (MUST be before /:orderId to avoid param matching)
router.get('/stats/revenue', orderSellerController.getRevenueStats);
router.get('/stats/top-products', orderSellerController.getTopProducts);
router.get('/stats/breakdown', orderSellerController.getRevenueBreakdown);

// Orders management
router.get('/', orderSellerController.getSellerOrders);
router.get('/:orderId', orderSellerController.getSellerOrderDetail);
router.put('/:orderId/status', orderSellerController.updateOrderStatus);

// Order workflow: picking → packed → handoff carrier
router.put('/:orderId/status/picking', orderSellerController.startPicking);
router.put('/:orderId/status/packed', orderSellerController.markAsPacked);
router.put('/:orderId/handoff-carrier', orderSellerController.handoffToCarrier);

/**
 * ORDER DETAIL ROUTES (Thay thế cho Order khi multi-seller)
 * ========================================================
 */
// Danh sách OrderDetail của seller
router.get('/details/list', orderDetailSellerController.getSellerOrderDetails);

// Chi tiết OrderDetail
router.get(
    '/details/:orderDetailId',
    orderDetailSellerController.getSellerOrderDetailInfo
);

// Confirm OrderDetail (pending → confirmed) + trừ stock
router.post(
    '/details/:orderDetailId/confirm',
    orderDetailSellerController.confirmOrderDetail
);

// Ship OrderDetail (confirmed → shipping)
router.post(
    '/details/:orderDetailId/ship',
    orderDetailSellerController.shipOrderDetail
);

// Cancel OrderDetail (pending/confirmed → cancelled) + restore stock
router.post(
    '/details/:orderDetailId/cancel',
    orderDetailSellerController.cancelOrderDetail
);

module.exports = router;
