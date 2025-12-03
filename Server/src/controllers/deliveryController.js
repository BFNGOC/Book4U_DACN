/**
 * DELIVERY TRACKING CONTROLLER
 * ============================
 * Quản lý vận chuyển từ shipper đến khách hàng
 * - Update vị trí shipper
 * - Ghi nhận delivery attempts
 * - Xử lý failed delivery → retry
 * - Xử lý return requests
 */

const Order = require('../models/orderModel');
const mongoose = require('mongoose');

// [PUT] /api/delivery/:orderId/location - Update vị trí shipper (real-time)
exports.updateDeliveryLocation = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { latitude, longitude, address } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Cần latitude và longitude.',
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        if (!['in_transit', 'out_for_delivery'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Chỉ cập nhật vị trí cho đơn đang vận chuyển. Status hiện tại: ${order.status}`,
            });
        }

        // Cập nhật vị trí hiện tại
        order.currentLocation = {
            latitude,
            longitude,
            address: address || 'Unknown',
            lastUpdated: new Date(),
        };

        order.notes = order.notes || [];
        order.notes.push({
            timestamp: new Date(),
            message: `Shipper cập nhật vị trí: ${
                address || `${latitude}, ${longitude}`
            }`,
            addedBy: 'carrier',
        });

        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Vị trí được cập nhật thành công.',
            data: {
                orderId,
                currentLocation: order.currentLocation,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật vị trí:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/delivery/:orderId/attempt - Ghi nhận delivery attempt (thành công/thất bại)
exports.recordDeliveryAttempt = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, reason, driverName, driverId } = req.body; // status: 'success' | 'failed'

        if (!['success', 'failed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status phải là success hoặc failed.',
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new Error('Đơn hàng không tồn tại.');
            }

            if (!['in_transit', 'out_for_delivery'].includes(order.status)) {
                throw new Error(
                    `Chỉ ghi nhận delivery cho đơn đang vận chuyển. Status: ${order.status}`
                );
            }

            const attemptNumber = (order.deliveryAttempts?.length || 0) + 1;

            // Tạo attempt record
            const attempt = {
                attemptNumber,
                status,
                timestamp: new Date(),
                reason: reason || null,
                driverName: driverName || null,
                driverId: driverId || null,
                location: order.currentLocation || null,
            };

            order.deliveryAttempts = order.deliveryAttempts || [];
            order.deliveryAttempts.push(attempt);

            if (status === 'success') {
                // Giao hàng thành công
                order.status = 'completed';
                order.paymentStatus =
                    order.paymentMethod === 'COD'
                        ? 'paid'
                        : order.paymentStatus;
                order.notes = order.notes || [];
                order.notes.push({
                    timestamp: new Date(),
                    message: `Shipper ${driverName} đã giao hàng thành công`,
                    addedBy: 'carrier',
                });
            } else if (status === 'failed') {
                // Giao hàng thất bại
                if (attemptNumber < order.maxDeliveryAttempts) {
                    // Còn lần giao hàng, đặt status về out_for_delivery
                    order.status = 'out_for_delivery';
                    order.notes = order.notes || [];
                    order.notes.push({
                        timestamp: new Date(),
                        message: `Lần giao hàng ${attemptNumber} thất bại. Lý do: ${
                            reason || 'Không rõ'
                        }. Sẽ giao lại lần ${attemptNumber + 1}.`,
                        addedBy: 'carrier',
                    });
                } else {
                    // Hết số lần giao hàng
                    order.status = 'return_initiated';
                    order.return = {
                        reason: `Giao hàng thất bại sau ${attemptNumber} lần. Lý do lần cuối: ${reason}`,
                        initiatedAt: new Date(),
                        status: 'pending',
                    };
                    order.notes = order.notes || [];
                    order.notes.push({
                        timestamp: new Date(),
                        message: `Giao hàng thất bại sau ${attemptNumber} lần. Đơn hàng sẽ được hoàn trả.`,
                        addedBy: 'system',
                    });
                }
            }

            await order.save({ session });
            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                message: `Ghi nhận delivery attempt ${attemptNumber} thành công.`,
                data: {
                    orderId,
                    status: order.status,
                    attemptNumber,
                    totalAttempts: order.deliveryAttempts.length,
                    maxAttempts: order.maxDeliveryAttempts,
                },
            });
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    } catch (err) {
        console.error('❌ Lỗi ghi nhận delivery attempt:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/delivery/:orderId/update-status - Update status (in_transit → out_for_delivery)
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // 'out_for_delivery' | 'return_initiated'

        if (!['out_for_delivery', 'return_initiated'].includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    'Status phải là out_for_delivery hoặc return_initiated.',
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        const validStatuses = [
            'in_transit',
            'out_for_delivery',
            'return_initiated',
        ];
        if (!validStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể cập nhật status từ ${order.status}`,
            });
        }

        order.status = status;

        if (status === 'return_initiated') {
            order.return = {
                reason: req.body.returnReason || 'Khách hàng yêu cầu hoàn',
                initiatedAt: new Date(),
                status: 'pending',
            };
        }

        order.notes = order.notes || [];
        order.notes.push({
            timestamp: new Date(),
            message: `Status cập nhật thành: ${status}`,
            addedBy: 'carrier',
        });

        await order.save();

        return res.status(200).json({
            success: true,
            message: `Status cập nhật thành ${status}`,
            data: order,
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật delivery status:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/delivery/:orderId/tracking - Lấy tracking info
exports.getTrackingInfo = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('profileId', 'firstName lastName primaryPhone')
            .populate('items.bookId', 'title images')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        // Return tracking info
        return res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                status: order.status,
                trackingNumber: order.trackingNumber,
                carrier: order.carrier,
                currentLocation: order.currentLocation,
                deliveryAttempts: order.deliveryAttempts || [],
                createdAt: order.createdAt,
                customer: {
                    name: `${order.profileId?.firstName} ${order.profileId?.lastName}`,
                    phone: order.profileId?.primaryPhone,
                },
                items: order.items,
                notes: order.notes || [],
            },
        });
    } catch (err) {
        console.error('❌ Lỗi lấy tracking info:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

module.exports = exports;
