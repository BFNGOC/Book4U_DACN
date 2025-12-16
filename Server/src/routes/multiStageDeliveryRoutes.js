const express = require('express');
const router = express.Router();
const multiStageDeliveryController = require('../controllers/multiStageDeliveryController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * ============================================================
 * MULTI-STAGE DELIVERY ROUTES
 * ============================================================
 */

/**
 * [POST] /api/multi-delivery/stages/create
 * Tạo các giai đoạn vận chuyển khi order được xác nhận
 * Required: User is Seller (tạo delivery stages cho order của mình)
 */
router.post(
    '/stages/create',
    authMiddleware,
    multiStageDeliveryController.createDeliveryStages
);

/**
 * [GET] /api/multi-delivery/stages/:orderDetailId
 * Lấy tất cả giai đoạn vận chuyển của một order
 * Required: User is Seller/Shipper/Customer (của order này)
 */
router.get(
    '/stages/:orderDetailId',
    multiStageDeliveryController.getDeliveryStages
);

/**
 * [PUT] /api/multi-delivery/stages/:stageId/accept
 * Shipper chấp nhận nhận đơn hàng ở giai đoạn này
 * Required: User is Shipper
 */
router.put(
    '/stages/:stageId/accept',
    authMiddleware,
    multiStageDeliveryController.acceptDeliveryStage
);

/**
 * [PUT] /api/multi-delivery/stages/:stageId/pickup
 * Shipper đã lấy hàng từ vị trí cũ
 * Required: User is Shipper
 *
 * Body: { latitude, longitude, address }
 */
router.put(
    '/stages/:stageId/pickup',
    authMiddleware,
    multiStageDeliveryController.pickupPackage
);

/**
 * [PUT] /api/multi-delivery/stages/:stageId/location
 * Cập nhật vị trí hiện tại của shipper (realtime tracking)
 * Required: User is Shipper
 *
 * Body: { latitude, longitude, address, status }
 */
router.put(
    '/stages/:stageId/location',
    authMiddleware,
    multiStageDeliveryController.updateShipperLocation
);

/**
 * [PUT] /api/multi-delivery/stages/:stageId/complete
 * Hoàn thành giai đoạn vận chuyển
 * Required: User is Shipper
 *
 * Body: { latitude, longitude, address, notes (optional) }
 */
router.put(
    '/stages/:stageId/complete',
    authMiddleware,
    multiStageDeliveryController.completeDeliveryStage
);

/**
 * [GET] /api/multi-delivery/shipper/orders
 * Lấy danh sách đơn hàng chờ pickup cho shipper (lọc theo province)
 * Required: User is Shipper
 */
router.get(
    '/shipper/orders',
    authMiddleware,
    multiStageDeliveryController.getShipperOrders
);

/**
 * [GET] /api/multi-delivery/shipper/assigned
 * Lấy danh sách delivery stages đã assigned cho shipper
 * Required: User is Shipper
 */
router.get(
    '/shipper/assigned',
    authMiddleware,
    multiStageDeliveryController.getShipperAssignedOrders
);

/**
 * [GET] /api/multi-delivery/regional-carrier/pending-orders
 * Regional carrier xem danh sách stage 2 chờ nhận
 * Required: User is Regional Carrier
 */
router.get(
    '/regional-carrier/pending-orders',
    authMiddleware,
    multiStageDeliveryController.getRegionalCarrierOrders
);

/**
 * [GET] /api/multi-delivery/regional-carrier/assigned-orders
 * Regional carrier xem danh sách stage 2 đã nhận
 * Required: User is Regional Carrier
 */
router.get(
    '/regional-carrier/assigned-orders',
    authMiddleware,
    multiStageDeliveryController.getRegionalCarrierAssignedOrders
);

/**
 * [GET] /api/multi-delivery/track/:orderDetailId
 * Khách hàng theo dõi đơn hàng realtime (xem tất cả stages + vị trí)
 * Public endpoint (không cần auth, hoặc verify customer)
 */
router.get(
    '/track/:orderDetailId',
    multiStageDeliveryController.trackOrderRealtime
);

module.exports = router;
