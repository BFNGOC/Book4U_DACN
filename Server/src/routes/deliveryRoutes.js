const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * DELIVERY TRACKING ROUTES
 * ========================
 * Quản lý vận chuyển và giao hàng
 */

// Update shipper location (real-time)
router.put(
    '/:orderId/location',
    authMiddleware,
    deliveryController.updateDeliveryLocation
);

// Record delivery attempt (success/failed)
router.put(
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

// Get tracking info
router.get('/:orderId', authMiddleware, deliveryController.getTrackingInfo);

module.exports = router;
