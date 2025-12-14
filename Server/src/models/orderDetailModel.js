const mongoose = require('mongoose');

/**
 * ============================================================
 * ORDER DETAIL SCHEMA (Sub-Order per Seller)
 * ============================================================
 *
 * Mục đích: Tách order thành multiple sub-orders, mỗi seller quản lý riêng
 *
 * Ví dụ:
 * - Customer đặt hàng từ SellerA + SellerB
 * - MainOrder {_id: order_123, items: [itemA, itemB]}
 * - Tạo 2 OrderDetail:
 *   - OrderDetail_A {mainOrderId: order_123, sellerId: sellerA, items: [itemA]}
 *   - OrderDetail_B {mainOrderId: order_123, sellerId: sellerB, items: [itemB]}
 *
 * Lợi ích:
 * - Query nhanh: OrderDetail.find({sellerId}) thay vì Order.find({'items.sellerId': sellerId})
 * - Status riêng: SellerA confirmed, SellerB pending
 * - Tracking riêng: Mỗi seller có tracking number
 * - Settlement riêng: Tính tiền từng seller độc lập
 */

// Item schema (tương tự Order nhưng có thêm warehouseId)
const orderDetailItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    // ✅ MỚI: Warehouse nơi lấy hàng
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
    },
});

// Shipping address (copy từ MainOrder)
const shippingSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    address: String,
});

// Delivery attempt tracking
const deliveryAttemptSchema = new mongoose.Schema({
    attemptNumber: Number,
    status: {
        type: String,
        enum: ['success', 'failed', 'retry'],
    },
    timestamp: { type: Date, default: Date.now },
    reason: String,
    driverName: String,
    driverId: mongoose.Schema.Types.ObjectId,
    location: {
        latitude: Number,
        longitude: Number,
        address: String,
    },
});

// Return information
const returnSchema = new mongoose.Schema({
    reason: String,
    initiatedAt: Date,
    approvedAt: Date,
    returnedAt: Date,
    refundAmount: Number,
    status: {
        type: String,
        enum: ['pending', 'approved', 'returned', 'refunded'],
    },
});

// Main OrderDetail Schema
const orderDetailSchema = new mongoose.Schema(
    {
        /**
         * LIÊN KẾT VỚI MAIN ORDER
         */
        mainOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },

        /**
         * SELLER QUẢ LỊ CHỈ ORDER NÀY
         */
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
            index: true,
        },

        /**
         * SẢN PHẨM (Chỉ của seller này)
         */
        items: [orderDetailItemSchema],

        /**
         * TIỀN TẬP
         */
        subtotal: {
            type: Number,
            required: true,
        },
        shippingCost: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },

        /**
         * STATUS - QUẢN LÝ RIÊNG PER SELLER
         */
        status: {
            type: String,
            enum: [
                'pending', // 0️⃣ Chờ seller xác nhận
                'confirmed', // 1️⃣ Seller xác nhận, chuẩn bị hàng
                'packing', // 2️⃣ Đang đóng gói
                'shipping', // 3️⃣ Đã giao carrier (đã ship)
                'delivered', // 4️⃣ Đã giao tới customer
                'cancelled', // ❌ Huỷ
            ],
            default: 'pending',
            index: true,
        },

        /**
         * THANH TOÁN (Cập nhật khi MainOrder được thanh toán)
         */
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },

        /**
         * VẬN CHUYỂN
         */
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
        },
        shippingMethod: {
            type: String,
            enum: ['standard', 'express', 'fast'],
            default: 'standard',
        },
        trackingNumber: String,
        estimatedDeliveryDate: Date,
        carrierInfo: {
            carrierName: String,
            carrierPhone: String,
            carrierCode: String,
        },

        /**
         * ĐỊA CHỈ GIAO (Copy từ MainOrder)
         */
        shippingAddress: shippingSchema,

        /**
         * THEO DÕI GIAO HÀNG
         */
        deliveryAttempts: [deliveryAttemptSchema],

        /**
         * HOÀN HÀNG / HOÀN TIỀN
         */
        returnInfo: returnSchema,

        /**
         * TIMELINE
         */
        createdAt: {
            type: Date,
            default: Date.now,
        },
        confirmedAt: Date,
        shippedAt: Date,
        deliveredAt: Date,
        cancelledAt: Date,

        /**
         * GHI CHÚ
         */
        sellerNotes: String,
        customerNotes: String,
        internalNotes: String,

        // Timestamps tự động
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * INDEXES - Tối ưu hóa queries
 */

// Tìm orders của seller
orderDetailSchema.index({ sellerId: 1, createdAt: -1 });

// Tìm orders theo status
orderDetailSchema.index({ sellerId: 1, status: 1 });

// Liên kết với main order
orderDetailSchema.index({ mainOrderId: 1 });

// Query combining
orderDetailSchema.index({ mainOrderId: 1, sellerId: 1 });

// Timeline queries
orderDetailSchema.index({ sellerId: 1, confirmedAt: 1 });
orderDetailSchema.index({ sellerId: 1, shippedAt: 1 });

/**
 * VIRTUAL - Tính toán thêm
 */

// Thời gian chờ xác nhận
orderDetailSchema.virtual('waitingForConfirmationTime').get(function () {
    if (this.confirmedAt) {
        return this.confirmedAt.getTime() - this.createdAt.getTime();
    }
    return Date.now() - this.createdAt.getTime();
});

// Tổng số item
orderDetailSchema.virtual('totalItems').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * METHODS
 */

// Check xem có thể xác nhận được không
orderDetailSchema.methods.canConfirm = function () {
    return this.status === 'pending' && this.paymentStatus === 'paid';
};

// Check xem có thể ship được không
orderDetailSchema.methods.canShip = function () {
    return ['confirmed', 'packing'].includes(this.status);
};

// Check xem có thể hoàn được không
orderDetailSchema.methods.canReturn = function () {
    return ['delivered'].includes(this.status) && !this.returnInfo;
};

/**
 * HOOKS
 */

// Update timestamp khi status thay đổi
orderDetailSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'confirmed' && !this.confirmedAt) {
            this.confirmedAt = new Date();
        }
        if (this.status === 'shipping' && !this.shippedAt) {
            this.shippedAt = new Date();
        }
        if (this.status === 'delivered' && !this.deliveredAt) {
            this.deliveredAt = new Date();
        }
        if (this.status === 'cancelled' && !this.cancelledAt) {
            this.cancelledAt = new Date();
        }
    }
    next();
});

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
