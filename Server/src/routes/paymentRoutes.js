const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * PAYMENT ROUTES
 * ==============
 * Xử lý thanh toán: VNPAY, MOMO, COD
 */

// VNPAY Routes
router.post(
    '/vnpay/create-payment-url',
    authMiddleware,
    paymentController.createVNPayPaymentUrl
);

router.post('/vnpay/callback', paymentController.handleVNPayCallback);

// MOMO Routes
router.post(
    '/momo/create-payment',
    authMiddleware,
    paymentController.createMomoPayment
);

router.post('/momo/callback', paymentController.handleMomoCallback);

// Check payment status
router.get(
    '/status/:orderId',
    authMiddleware,
    paymentController.getPaymentStatus
);

module.exports = router;
