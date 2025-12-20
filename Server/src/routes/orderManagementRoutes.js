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
 * POST   /create              - Tạo đơn (status=pending)
 * POST   /:orderId/confirm    - Confirm đơn & trừ stock (GỌI BỞI SELLER)
 * POST   /:orderId/cancel     - Hủy đơn
 * GET    /:orderId            - Lấy đơn
 * GET    /user/:profileId     - Danh sách đơn
 * GET    /detail/list         - ✅ Danh sách OrderDetail của customer
 * GET    /detail/:orderDetailId - ✅ Chi tiết 1 OrderDetail
 */

// 1️⃣ Kiểm tra stock trước tạo đơn
router.post(
    '/validate-stock',
    authMiddleware,
    orderManagementController.validateStockBeforeOrder
);

// 2️⃣ Tạo đơn hàng (CHỈ VALIDATE, status=pending)
router.post('/create', authMiddleware, orderManagementController.createOrder);

// 2B️⃣ Confirm đơn hàng & trừ stock (GỌI BỞI SELLER - sử dụng atomic operation)
router.post(
    '/:orderId/confirm',
    authMiddleware,
    orderManagementController.confirmOrder
);

// 3️⃣ Hủy đơn hàng
router.post(
    '/:orderId/cancel',
    authMiddleware,
    orderManagementController.cancelOrder
);

// 6️⃣ Duyệt/Từ chối hoàn hàng (GỌI BỞI SELLER)
router.post(
    '/:orderId/return/approve',
    authMiddleware,
    orderManagementController.approveReturn
);

// 4️⃣ Lấy đơn hàng
router.get('/:orderId', authMiddleware, orderManagementController.getOrder);

// 5️⃣ Danh sách đơn khách hàng
router.get(
    '/user/:profileId',
    authMiddleware,
    orderManagementController.getCustomerOrders
);

// ✅ Danh sách OrderDetail của khách hàng (thay thế Order cũ)
router.get(
    '/detail/list',
    authMiddleware,
    orderManagementController.getCustomerOrderDetails
);

// ✅ Chi tiết 1 OrderDetail (cho detail page)
router.get(
    '/detail/:orderDetailId',
    authMiddleware,
    orderManagementController.getCustomerOrderDetail
);

module.exports = router;
