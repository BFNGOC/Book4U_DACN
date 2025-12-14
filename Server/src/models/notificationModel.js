const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        // Người nhận notification (seller)
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Loại notification
        type: {
            type: String,
            enum: [
                'NEW_ORDER',
                'ORDER_UPDATE',
                'ORDER_CANCELLED',
                'PAYMENT_RECEIVED',
            ],
            default: 'NEW_ORDER',
        },

        // Tiêu đề notification
        title: {
            type: String,
            required: true,
        },

        // Nội dung message
        message: {
            type: String,
            required: true,
        },

        // Thông tin liên quan
        data: {
            orderId: mongoose.Schema.Types.ObjectId,
            customerName: String,
            customerPhone: String,
            subtotal: Number, // ✅ Subtotal chỉ cho seller này
            totalOrderAmount: Number, // Tổng toàn order (info)
            items: [
                {
                    _id: mongoose.Schema.Types.ObjectId,
                    title: String,
                    price: Number,
                    quantity: Number,
                    image: String,
                },
            ],
            shippingAddress: {
                fullName: String,
                phone: String,
                address: String,
            },
            status: String,
        },

        // Đã đọc hay chưa
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Thời gian tạo
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        // Thời gian đọc
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index cho query thường xuyên
notificationSchema.index({ sellerId: 1, createdAt: -1 });
notificationSchema.index({ sellerId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
