const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * DELIVERY TRACKING ROUTES
 * ========================
 * Quản lý vận chuyển và giao hàng
 */

// Shipper endpoints (MUST come first - specificity rule)
router.get(
    '/shipper/orders',
    authMiddleware,
    deliveryController.getShipperOrders
);

router.post(
    '/shipper/location',
    authMiddleware,
    deliveryController.updateShipperLocation
);

router.get(
    '/shipper/stats',
    authMiddleware,
    deliveryController.getShipperStats
);

// Get tracking info (MUST come before /:orderId routes)
router.get(
    '/:orderId/tracking',
    authMiddleware,
    deliveryController.getTrackingInfo
);

// Update shipper location (real-time)
router.put(
    '/:orderId/location',
    authMiddleware,
    deliveryController.updateDeliveryLocation
);

// Record delivery attempt (success/failed)
router.post(
    '/:orderId/attempt',
    authMiddleware,
    deliveryController.recordDeliveryAttempt
);

// Update delivery status (in_transit → out_for_delivery)
router.put(
    '/:orderId/status',
    authMiddleware,
    deliveryController.updateDeliveryStatus
);

module.exports = router;
