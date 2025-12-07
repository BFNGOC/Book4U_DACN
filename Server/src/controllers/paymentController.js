/**
 * PAYMENT CONTROLLER
 * ==================
 * Xử lý thanh toán qua các gateway: VNPAY, MOMO
 */

const Order = require('../models/orderModel');
const crypto = require('crypto');
const axios = require('axios');

// [POST] /api/payment/vnpay/create-payment-url - Tạo link thanh toán VNPAY
exports.createVNPayPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Cần orderId và amount',
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // VNPAY Configuration
        const vnpayConfig = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'TESTMERCHANT',
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: `${orderId}-${Date.now()}`,
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'billpayment',
            vnp_Amount: amount * 100, // VNPAY yêu cầu * 100
            vnp_ReturnUrl: `${process.env.CLIENT_URL}/payment/vnpay/callback`,
            vnp_IpAddr:
                req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            vnp_CreateDate: new Date()
                .toISOString()
                .replace(/[-T:Z.]/g, '')
                .slice(0, 14),
        };

        // Sort parameters and create signature
        const sortedParams = Object.keys(vnpayConfig)
            .sort()
            .reduce((sorted, key) => {
                sorted[key] = vnpayConfig[key];
                return sorted;
            }, {});

        const signData = new URLSearchParams(sortedParams).toString();
        const hmac = crypto.createHmac(
            'sha512',
            process.env.VNPAY_HASH_SECRET || 'TESTSECRET'
        );
        const vnp_SecureHash = hmac.update(signData).digest('hex');

        // Build payment URL - Redirect to actual VNPAY sandbox
        const paymentUrl = new URL('https://sandbox.vnpayment.vn/paygate');
        Object.entries(sortedParams).forEach(([key, value]) => {
            paymentUrl.searchParams.append(key, value);
        });
        paymentUrl.searchParams.append('vnp_SecureHash', vnp_SecureHash);

        // Save payment info to order
        order.paymentInfo = {
            method: 'VNPAY',
            transactionRef: vnpayConfig.vnp_TxnRef,
            createdAt: new Date(),
        };
        order.paymentMethod = 'VNPAY';
        order.paymentStatus = 'unpaid'; // Will be updated to 'paid' after callback

        await order.save();

        console.log('✅ VNPAY Payment URL created:', paymentUrl.toString());

        return res.status(200).json({
            success: true,
            message: 'Link thanh toán được tạo',
            data: {
                paymentUrl: paymentUrl.toString(),
            },
        });
    } catch (err) {
        console.error('❌ Lỗi tạo VNPAY URL:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

// [POST] /api/payment/vnpay/callback - Xử lý callback từ VNPAY
exports.handleVNPayCallback = async (req, res) => {
    try {
        const { vnp_TransactionStatus, vnp_TxnRef } = req.query;

        if (vnp_TransactionStatus === '00') {
            // Payment successful
            const order = await Order.findOneAndUpdate(
                { 'paymentInfo.transactionRef': vnp_TxnRef },
                {
                    paymentStatus: 'paid',
                    'paymentInfo.status': 'success',
                    'paymentInfo.completedAt': new Date(),
                },
                { new: true }
            );

            if (order) {
                return res.status(200).json({
                    success: true,
                    message: 'Thanh toán thành công',
                    data: { orderId: order._id },
                });
            }
        }

        return res.status(400).json({
            success: false,
            message: 'Thanh toán không thành công',
        });
    } catch (err) {
        console.error('❌ Lỗi xử lý VNPAY callback:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

// [POST] /api/payment/momo/create-payment - Tạo thanh toán MOMO
exports.createMomoPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Cần orderId và amount',
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        const requestId = `${orderId}-${Date.now()}`;

        // Save payment info to order
        order.paymentInfo = {
            method: 'MOMO',
            requestId: requestId,
            amount: parseInt(amount),
            createdAt: new Date(),
        };
        order.paymentMethod = 'MOMO';
        order.paymentStatus = 'unpaid';

        await order.save();

        // Generate QR code data (static placeholder for testing)
        // Format: QRCODE|{orderId}|{amount}|{timestamp}
        const qrCodeData = `MOMO|${orderId}|${amount}|${Date.now()}`;

        // Create a simple static QR code URL using qr-server (free service)
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            qrCodeData
        )}`;

        // Return success with QR code
        return res.status(200).json({
            success: true,
            message: 'Tạo mã QR thanh toán MOMO thành công',
            data: {
                qrCodeUrl: qrCodeUrl,
                requestId: requestId,
                paymentUrl: `${process.env.CLIENT_URL}/payment/momo/test?orderId=${orderId}&requestId=${requestId}`,
                amount: amount,
                note: 'Quét mã QR hoặc nhấn "Xác nhận thanh toán" để tiếp tục',
            },
        });
    } catch (err) {
        console.error('❌ Lỗi tạo MOMO payment:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

// [POST] /api/payment/momo/callback - Xử lý callback từ MOMO
exports.handleMomoCallback = async (req, res) => {
    try {
        const { resultCode, orderId, requestId } = req.body;

        if (resultCode === 0 || resultCode === '0') {
            // Payment successful
            const order = await Order.findOneAndUpdate(
                { 'paymentInfo.requestId': requestId },
                {
                    paymentStatus: 'paid',
                    'paymentInfo.status': 'success',
                    'paymentInfo.completedAt': new Date(),
                },
                { new: true }
            );

            if (order) {
                return res.status(200).json({
                    success: true,
                    message: 'Thanh toán MOMO thành công',
                    data: { orderId: order._id },
                });
            }
        }

        return res.status(400).json({
            success: false,
            message: 'Thanh toán MOMO không thành công',
        });
    } catch (err) {
        console.error('❌ Lỗi xử lý MOMO callback:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

// [GET] /api/payment/status/:orderId - Kiểm tra trạng thái thanh toán
exports.getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                paymentInfo: order.paymentInfo,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi kiểm tra trạng thái thanh toán:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};
