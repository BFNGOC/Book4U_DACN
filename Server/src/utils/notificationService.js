/**
 * Notification Service
 * Xử lý gửi realtime notifications cho sellers thông qua Socket.IO và lưu vào database
 */

const { Notification } = require('../models/notificationModel');

/**
 * Gửi notification đến seller khi có đơn hàng mới
 * @param {Object} io - Socket.IO instance
 * @param {string} sellerId - ID của seller
 * @param {Object} orderData - Thông tin đơn hàng
 */
const sendNewOrderNotification = async (io, sellerId, orderData) => {
    try {
        const notification = {
            type: 'NEW_ORDER',
            title: '📦 Đơn hàng mới',
            message: `Bạn có đơn hàng mới từ ${orderData.customerName}`,
            data: {
                orderId: orderData._id,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                totalAmount: orderData.totalAmount,
                items: orderData.items,
                shippingAddress: orderData.shippingAddress,
                createdAt: new Date(),
            },
            timestamp: new Date(),
        };

        // 💾 Save vào database
        const savedNotification = await Notification.create({
            sellerId: sellerId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
        });

        // 📡 Gửi realtime qua Socket.IO
        io.to(`seller:${sellerId}`).emit('notification:received', {
            ...notification,
            _id: savedNotification._id,
        });

        console.log(
            `✅ Notification saved & sent to seller ${sellerId}:`,
            notification.title
        );

        return savedNotification;
    } catch (error) {
        console.error(
            `❌ Error sending notification to seller ${sellerId}:`,
            error.message
        );
        throw error;
    }
};

/**
 * Gửi notification cập nhật đơn hàng
 * @param {Object} io - Socket.IO instance
 * @param {string} sellerId - ID của seller
 * @param {Object} orderUpdate - Thông tin cập nhật
 */
const sendOrderUpdateNotification = async (io, sellerId, orderUpdate) => {
    try {
        const notification = {
            type: 'ORDER_UPDATE',
            title: '🔄 Cập nhật đơn hàng',
            message: `Đơn hàng #${orderUpdate.orderId} được cập nhật: ${orderUpdate.status}`,
            data: {
                orderId: orderUpdate.orderId,
                status: orderUpdate.status,
                message: orderUpdate.message,
                timestamp: new Date(),
            },
            timestamp: new Date(),
        };

        // 💾 Save vào database
        const savedNotification = await Notification.create({
            sellerId: sellerId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
        });

        // 📡 Gửi realtime qua Socket.IO
        io.to(`seller:${sellerId}`).emit('notification:received', {
            ...notification,
            _id: savedNotification._id,
        });

        console.log(
            `✅ Order update notification saved & sent to seller ${sellerId}`
        );

        return savedNotification;
    } catch (error) {
        console.error(
            `❌ Error sending order update notification to seller ${sellerId}:`,
            error.message
        );
        throw error;
    }
};

/**
 * Gửi notification khi order bị cancel
 * @param {Object} io - Socket.IO instance
 * @param {string} sellerId - ID của seller
 * @param {string} orderId - ID của order
 * @param {string} reason - Lý do cancel
 */
const sendOrderCancelledNotification = async (
    io,
    sellerId,
    orderId,
    reason
) => {
    try {
        const notification = {
            type: 'ORDER_CANCELLED',
            title: '❌ Đơn hàng bị hủy',
            message: `Đơn hàng #${orderId} đã bị hủy. Lý do: ${reason}`,
            data: {
                orderId,
                reason,
                timestamp: new Date(),
            },
            timestamp: new Date(),
        };

        // 💾 Save vào database
        const savedNotification = await Notification.create({
            sellerId: sellerId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
        });

        // 📡 Gửi realtime qua Socket.IO
        io.to(`seller:${sellerId}`).emit('notification:received', {
            ...notification,
            _id: savedNotification._id,
        });

        console.log(
            `✅ Order cancelled notification saved & sent to seller ${sellerId}`
        );

        return savedNotification;
    } catch (error) {
        console.error(
            `❌ Error sending order cancelled notification to seller ${sellerId}:`,
            error.message
        );
        throw error;
    }
};

/**
 * Gửi notification batch cho nhiều sellers
 * @param {Object} io - Socket.IO instance
 * @param {Array<string>} sellerIds - Danh sách seller IDs
 * @param {Object} notificationData - Dữ liệu notification
 */
const broadcastNotificationToSellers = (io, sellerIds, notificationData) => {
    sellerIds.forEach((sellerId) => {
        io.to(`seller:${sellerId}`).emit('notification:received', {
            ...notificationData,
            timestamp: new Date(),
        });
    });

    console.log(`📬 Broadcast notification to ${sellerIds.length} sellers`);
};

module.exports = {
    sendNewOrderNotification,
    sendOrderUpdateNotification,
    sendOrderCancelledNotification,
    broadcastNotificationToSellers,
};
