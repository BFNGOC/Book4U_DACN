const express = require('express');
const router = express.Router();
const orderManagementController = require('../controllers/orderManagementController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * ORDER MANAGEMENT ROUTES
 * =======================
 *
 * Endpoints:
 * POST   /validate-stock       - Kiểm tra stock
 * POST   /create              - Tạo đơn
 * POST   /:orderId/cancel     - Hủy đơn
 * GET    /:orderId            - Lấy đơn
 * GET    /user/:profileId     - Danh sách đơn
 */

// 1️⃣ Kiểm tra stock trước tạo đơn
router.post(
    '/validate-stock',
    authMiddleware,
    orderManagementController.validateStockBeforeOrder
);

// 2️⃣ Tạo đơn hàng
router.post('/create', authMiddleware, orderManagementController.createOrder);

// 3️⃣ Hủy đơn hàng
router.post(
    '/:orderId/cancel',
    authMiddleware,
    orderManagementController.cancelOrder
);

// 4️⃣ Lấy đơn hàng
router.get('/:orderId', authMiddleware, orderManagementController.getOrder);

// 5️⃣ Danh sách đơn khách hàng
router.get(
    '/user/:profileId',
    authMiddleware,
    orderManagementController.getCustomerOrders
);

module.exports = router;
