/**
 * PAYMENT CONTROLLER
 * ==================
 * Xử lý thanh toán qua các gateway: VNPAY, MOMO
 */

const Order = require('../models/orderModel');
const OrderDetail = require('../models/orderDetailModel');
const crypto = require('crypto');
const axios = require('axios');
const MomoPayment = require('../utils/momoPayment');

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
                // ✅ MỚI: Cập nhật tất cả OrderDetails của order này
                await OrderDetail.updateMany(
                    { mainOrderId: order._id },
                    { paymentStatus: 'paid' }
                );
                console.log(
                    `✅ Updated payment status for all OrderDetails of order ${order._id}`
                );

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

        let order;
        try {
            order = await Order.findById(orderId);
        } catch (err) {
            console.error('❌ Invalid orderId format:', orderId);
            return res.status(400).json({
                success: false,
                message: 'ID đơn hàng không hợp lệ',
            });
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // Initialize MoMo Payment
        const momoPayment = new MomoPayment({
            accessKey: process.env.MOMO_ACCESS_KEY,
            secretKey: process.env.MOMO_SECRET_KEY,
            partnerCode: process.env.MOMO_PARTNER_CODE,
            environment: process.env.MOMO_ENVIRONMENT || 'test',
        });

        try {
            // Gọi MoMo API để tạo link thanh toán
            const momoResponse = await momoPayment.createPayment({
                orderId: orderId,
                amount: parseInt(amount),
                orderInfo: `Thanh toan don hang ${orderId}`,
                redirectUrl: `${process.env.CLIENT_URL}/payment/momo/callback`,
                ipnUrl: `${process.env.SERVER_URL}/api/payment/momo/callback`,
                extraData: orderId,
            });

            if (!momoResponse.success) {
                console.error('❌ MoMo API Error:', momoResponse);
                return res.status(400).json({
                    success: false,
                    message:
                        momoResponse.resultMessage ||
                        'Không thể tạo link thanh toán MoMo',
                    resultCode: momoResponse.resultCode,
                });
            }

            // Save payment info to order
            order.paymentInfo = {
                method: 'MOMO',
                requestId: momoResponse.requestId,
                amount: parseInt(amount),
                createdAt: new Date(),
                status: 'pending',
            };
            order.paymentMethod = 'MOMO';
            order.paymentStatus = 'unpaid';

            await order.save();

            console.log('✅ MoMo payment created:', {
                orderId,
                requestId: momoResponse.requestId,
                amount,
            });

            // Return payment URL
            return res.status(200).json({
                success: true,
                message: 'Link thanh toán MoMo được tạo thành công',
                data: {
                    paymentUrl: momoResponse.paymentUrl,
                    requestId: momoResponse.requestId,
                    qrCodeUrl: momoResponse.qrCodeUrl || null,
                    amount: amount,
                    orderId: orderId,
                },
            });
        } catch (momoError) {
            console.error('❌ MoMo API Exception:', momoError);
            return res.status(500).json({
                success: false,
                message: 'Lỗi kết nối MoMo: ' + momoError.message,
            });
        }
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
        const callbackData = req.body;
        const { resultCode, orderId, requestId } = callbackData;

        console.log('📥 MoMo Callback received:', {
            resultCode,
            orderId,
            requestId,
            resultMessage: callbackData.resultMessage,
            hasSignature: !!callbackData.signature,
            callbackKeys: Object.keys(callbackData),
        });

        // Verify signature
        const momoPayment = new MomoPayment({
            accessKey: process.env.MOMO_ACCESS_KEY,
            secretKey: process.env.MOMO_SECRET_KEY,
            partnerCode: process.env.MOMO_PARTNER_CODE,
        });

        const isSignatureValid = momoPayment.verifySignature(callbackData);

        if (!isSignatureValid) {
            console.warn('⚠️ MoMo callback signature invalid');
            return res.status(400).json({
                success: false,
                message: 'Invalid signature',
            });
        }

        // Process payment
        if (resultCode === 0 || resultCode === '0') {
            // Payment successful
            // Try to find by requestId first, then by orderId
            let order = await Order.findOne({
                'paymentInfo.requestId': requestId,
            });

            if (!order && orderId) {
                // Fallback: search by orderId directly
                order = await Order.findById(orderId);
            }

            if (order) {
                order = await Order.findByIdAndUpdate(
                    order._id,
                    {
                        paymentStatus: 'paid', // ✅ Auto-update payment status to paid
                        'paymentInfo.status': 'success',
                        'paymentInfo.completedAt': new Date(),
                        'paymentInfo.transactionId': callbackData.transactionId,
                        // ⚠️ status remains unchanged - Seller must confirm manually
                    },
                    { new: true }
                );

                // ✅ MỚI: Cập nhật tất cả OrderDetails
                await OrderDetail.updateMany(
                    { mainOrderId: order._id },
                    { paymentStatus: 'paid' }
                );

                console.log('✅ MoMo payment successful:', {
                    orderId: order._id,
                    requestId,
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.status,
                    note: 'Status remains pending - waiting for seller confirmation',
                });

                return res.status(200).json({
                    success: true,
                    message: 'Thanh toán MoMo thành công',
                    data: {
                        orderId: order._id,
                        paymentStatus: 'paid',
                        orderStatus: order.status, // Current status (not auto-confirmed)
                        note: 'Đơn hàng chờ người bán xác nhận',
                    },
                });
            }
        } else if (resultCode === 1000 || resultCode === '1000') {
            // Payment pending
            // Try to find by requestId first, then by orderId
            let order = await Order.findOne({
                'paymentInfo.requestId': requestId,
            });

            if (!order && orderId) {
                // Fallback: search by orderId directly
                order = await Order.findById(orderId);
            }

            if (order) {
                order = await Order.findByIdAndUpdate(
                    order._id,
                    {
                        paymentStatus: 'unpaid', // ✅ Keep as unpaid until confirmed
                        'paymentInfo.status': 'pending',
                        'paymentInfo.pendingAt': new Date(),
                    },
                    { new: true }
                );

                console.log('⏳ MoMo payment pending:', {
                    orderId: order._id,
                    paymentStatus: order.paymentStatus,
                });

                return res.status(200).json({
                    success: true,
                    message: 'Thanh toán MoMo đang xử lý',
                    data: {
                        orderId: order._id,
                        paymentStatus: 'unpaid',
                        note: 'Thanh toán đang chờ xác nhận từ MoMo',
                    },
                });
            }
        } else {
            // Payment failed
            // Try to find by requestId first, then by orderId
            let order = await Order.findOne({
                'paymentInfo.requestId': requestId,
            });

            if (!order && orderId) {
                // Fallback: search by orderId directly
                order = await Order.findById(orderId);
            }

            if (order) {
                order = await Order.findByIdAndUpdate(
                    order._id,
                    {
                        paymentStatus: 'unpaid', // ✅ Reset to unpaid on failure
                        'paymentInfo.status': 'failed',
                        'paymentInfo.errorCode': resultCode,
                        'paymentInfo.errorMessage': callbackData.resultMessage,
                        'paymentInfo.failedAt': new Date(),
                    },
                    { new: true }
                );

                console.error('❌ MoMo payment failed:', {
                    orderId: order._id,
                    resultCode,
                    message: callbackData.resultMessage,
                    paymentStatus: order.paymentStatus,
                });

                return res.status(200).json({
                    success: false,
                    message: `Thanh toán MoMo thất bại: ${callbackData.resultMessage}`,
                    data: {
                        orderId: order._id,
                        paymentStatus: 'failed',
                    },
                });
            }
        }

        // If no order found
        return res.status(400).json({
            success: false,
            message: 'Không tìm thấy đơn hàng',
        });
    } catch (err) {
        console.error('❌ Lỗi xử lý MoMo callback:', err);
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
