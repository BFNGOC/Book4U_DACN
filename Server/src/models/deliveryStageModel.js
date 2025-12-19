const mongoose = require('mongoose');

/**
 * ============================================================
 * DELIVERY STAGE MODEL - ĐẦU MỐI GIAI ĐOẠN VẬN CHUYỂN
 * ============================================================
 *
 * Mục đích: Quản lý từng giai đoạn vận chuyển trong 1 đơn hàng
 *
 * Ví dụ: Order từ TP.HCM → Hà Nội
 * - Stage 1: TP.HCM Warehouse → TP.HCM Transfer Hub (Shipper TPHCM)
 * - Stage 2: TP.HCM Transfer Hub → Hà Nội Transfer Hub (Regional Carrier)
 * - Stage 3: Hà Nội Transfer Hub → Customer (Shipper Hà Nội)
 *
 * Mỗi stage có:
 * - fromLocation (warehouse/hub)
 * - toLocation (warehouse/hub/customer)
 * - assignedShipper (shipper quản lý)
 * - status tracking
 * - location history
 */

// Location tracking for each stage
const locationHistorySchema = new mongoose.Schema(
    {
        timestamp: { type: Date, default: Date.now },
        latitude: Number,
        longitude: Number,
        address: String,
        description: String, // "Picked up at warehouse", "In transit", "Arrived at hub", etc
        status: {
            type: String,
            enum: [
                'package_picked_up',
                'in_transit',
                'at_hub',
                'out_for_delivery',
                'delivery_attempt',
                'delivery_failed',
                'delivered',
            ],
        },
    },
    { _id: true }
);

const deliveryStageSchema = new mongoose.Schema(
    {
        /**
         * LIÊN KẾT VỚI ĐƠN HÀNG
         */
        mainOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },

        orderDetailId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrderDetail',
            required: true,
            index: true,
        },

        /**
         * THÔNG TIN GIAI ĐOẠN
         */
        // Số thứ tự giai đoạn (1, 2, 3...)
        stageNumber: {
            type: Number,
            required: true,
            min: 1,
        },

        // Tổng số giai đoạn
        totalStages: {
            type: Number,
            required: true,
            min: 1,
        },

        /**
         * VỊ TRÍ BẮT ĐẦU
         */
        fromLocation: {
            locationType: {
                type: String,
                enum: ['warehouse', 'transfer_hub', 'customer'],
                required: true,
            },
            warehouseId: mongoose.Schema.Types.ObjectId,
            warehouseName: String,
            address: String,
            province: String,
            district: String,
            ward: String,
            latitude: Number,
            longitude: Number,
            contactName: String,
            contactPhone: String,
        },

        /**
         * VỊ TRÍ KẾT THÚC
         */
        toLocation: {
            locationType: {
                type: String,
                enum: ['warehouse', 'transfer_hub', 'customer'],
                required: true,
            },
            warehouseId: mongoose.Schema.Types.ObjectId,
            warehouseName: String,
            address: String,
            province: String,
            district: String,
            ward: String,
            latitude: Number,
            longitude: Number,
            contactName: String,
            contactPhone: String,
        },

        /**
         * TRÁCH NHIỆM GIAO HÀNG
         */
        assignedShipperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
        },
        shippingCompany: String, // "Giao hàng Nhanh", "BE", etc
        trackingNumber: String,
        estimatedDeliveryDate: Date,

        /**
         * TRẠNG THÁI
         */
        status: {
            type: String,
            enum: [
                'pending', // Chờ shipper nhận
                'accepted', // Shipper đã chấp nhận
                'picked_up', // Đã lấy từ vị trí cũ
                'in_transit', // Đang vận chuyển
                'in_transit_with_gps', // Vận chuyển + GPS realtime
                'at_next_hub', // Tới hub kế tiếp
                'delivered', // Hoàn tất giai đoạn
                'failed', // Không thể giao (sự cố)
                'cancelled', // Hủy giai đoạn
            ],
            default: 'pending',
            index: true,
        },

        /**
         * THEO DÕI VỊ TRÍ
         */
        currentLocation: {
            latitude: Number,
            longitude: Number,
            address: String,
            timestamp: Date,
            accuracy: Number, // meters
        },

        // Lịch sử vị trí chi tiết
        locationHistory: [locationHistorySchema],

        /**
         * TIMELINE
         */
        createdAt: { type: Date, default: Date.now },
        acceptedAt: Date,
        pickedUpAt: Date,
        inTransitAt: Date,
        deliveredAt: Date,
        failedAt: Date,
        cancelledAt: Date,

        /**
         * GHI CHÚ & LỖI
         */
        notes: String,
        failureReason: String, // "Traffic jam", "Recipient not available", etc
        deliveryAttempts: {
            count: { type: Number, default: 0 },
            maxRetries: { type: Number, default: 3 },
            lastAttemptAt: Date,
            attempts: [
                {
                    attemptNumber: Number,
                    timestamp: Date,
                    result: {
                        type: String,
                        enum: ['success', 'failed'],
                    },
                    reason: String,
                    location: {
                        latitude: Number,
                        longitude: Number,
                        address: String,
                    },
                    driverName: String,
                    driverId: mongoose.Schema.Types.ObjectId,
                },
            ],
        },

        /**
         * KHOẢNG CÁCH & THỜI GIAN ƯỚC TÍNH
         */
        estimatedDistance: Number, // km
        estimatedDuration: Number, // minutes
        actualDistance: Number, // km
        actualDuration: Number, // minutes

        /**
         * METADATA
         */
        isLastStage: {
            type: Boolean,
            default: false,
        },

        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

/**
 * INDEXES
 */
deliveryStageSchema.index({ mainOrderId: 1, stageNumber: 1 });
deliveryStageSchema.index({ mainOrderId: 1, status: 1 });
deliveryStageSchema.index({ orderDetailId: 1 });
deliveryStageSchema.index({ assignedShipperId: 1, status: 1 });
deliveryStageSchema.index({
    'toLocation.province': 1,
    status: 1,
});

/**
 * VIRTUAL FIELDS
 */

// Tính thời gian chờ
deliveryStageSchema.virtual('waitingTime').get(function () {
    if (this.acceptedAt) {
        return this.acceptedAt.getTime() - this.createdAt.getTime();
    }
    return Date.now() - this.createdAt.getTime();
});

// Tính tổng thời gian giao
deliveryStageSchema.virtual('totalTime').get(function () {
    const endTime = this.deliveredAt || Date.now();
    return endTime - this.createdAt.getTime();
});

/**
 * METHODS
 */

// Kiểm tra có thể chuyển sang giai đoạn kế tiếp không
deliveryStageSchema.methods.canTransferToNextStage = function () {
    return this.status === 'at_next_hub' && this.deliveryAttempts.count === 0;
};

// Kiểm tra có thể giao được không
deliveryStageSchema.methods.canDeliver = function () {
    return ['accepted', 'in_transit', 'in_transit_with_gps'].includes(
        this.status
    );
};

/**
 * HOOKS
 */

// Auto-update timestamps
deliveryStageSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('DeliveryStage', deliveryStageSchema);
