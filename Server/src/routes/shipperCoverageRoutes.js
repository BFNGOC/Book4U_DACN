const express = require('express');
const router = express.Router();
const shipperCoverageController = require('../controllers/shipperCoverageController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * ============================================================
 * SHIPPER COVERAGE AREA ROUTES
 * ============================================================
 */

/**
 * [POST] /api/shipper-coverage/create
 * Admin/System tạo hoặc cập nhật coverage area cho shipper
 */
router.post('/create', shipperCoverageController.createOrUpdateCoverageArea);

/**
 * [GET] /api/shipper-coverage/:shipperId
 * Lấy khu vực phục vụ của shipper
 */
router.get('/:shipperId', shipperCoverageController.getCoverageArea);

/**
 * [GET] /api/shipper-coverage/province/:province
 * Lấy danh sách shippers phục vụ tỉnh nào đó
 */
router.get(
    '/province/:province',
    shipperCoverageController.getShippersForProvince
);

/**
 * [PUT] /api/shipper-coverage/:shipperId/location
 * Cập nhật vị trí + online status
 */
router.put(
    '/:shipperId/location',
    authMiddleware,
    shipperCoverageController.updateShipperLocation
);

/**
 * [PUT] /api/shipper-coverage/:shipperId/status
 * Cập nhật status shipper
 */
router.put('/:shipperId/status', shipperCoverageController.updateShipperStatus);

/**
 * [PUT] /api/shipper-coverage/:shipperId/orders-capacity
 * Cập nhật công suất đơn hàng
 */
router.put(
    '/:shipperId/orders-capacity',
    shipperCoverageController.updateOrdersCapacity
);

/**
 * [PUT] /api/shipper-coverage/:shipperId/performance
 * Cập nhật hiệu suất
 */
router.put(
    '/:shipperId/performance',
    shipperCoverageController.updatePerformance
);

module.exports = router;
