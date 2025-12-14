const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
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
});

const shippingSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
});

// 📍 Delivery attempt tracking subdocument
const deliveryAttemptSchema = new mongoose.Schema(
    {
        attemptNumber: { type: Number, required: true },
        status: {
            type: String,
            enum: ['success', 'failed', 'retry'],
            required: true,
        },
        timestamp: { type: Date, default: Date.now },
        reason: String, // "Customer not available", "Wrong address", etc
        driverName: String,
        driverId: mongoose.Schema.Types.ObjectId,
        location: {
            latitude: Number,
            longitude: Number,
            address: String,
        },
    },
    { _id: true }
);

// 🔙 Return information subdocument
const returnSchema = new mongoose.Schema({
    reason: String, // "Customer refused", "Damaged", "Wrong item"
    initiatedAt: Date,
    approvedAt: Date,
    returnedAt: Date,
    refundAmount: Number,
    status: {
        type: String,
        enum: ['pending', 'approved', 'returned', 'refunded'],
    },
});

// 📋 Order note subdocument
const noteSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    message: String,
    addedBy: String, // 'seller', 'carrier', 'customer', 'system'
});

const orderSchema = new mongoose.Schema(
    {
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'VNPAY', 'MOMO'],
            default: 'COD',
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        // 💳 Payment Info - Thông tin chi tiết thanh toán
        paymentInfo: {
            method: String, // 'VNPAY', 'MOMO', 'COD'
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
            },
            transactionRef: String, // VNPAY transaction reference
            requestId: String, // MoMo request ID
            transactionId: String, // MoMo transaction ID
            errorCode: String,
            errorMessage: String,
            createdAt: Date,
            completedAt: Date,
            pendingAt: Date,
            failedAt: Date,
        },
        // 🔄 Enhanced status workflow:
        // pending → confirmed → picking → packed → in_transit → out_for_delivery → completed
        //                                                      → return_initiated → returned
        status: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'picking',
                'packed',
                'in_transit',
                'out_for_delivery',
                'completed',
                'return_initiated',
                'returned',
                'cancelled',
            ],
            default: 'pending',
        },
        shippingAddress: shippingSchema,

        // 🏭 Warehouse từ đó đơn được lấy hàng
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null, // Null cho đến khi seller confirm
        },
        warehouseName: String,

        // 🚚 Shipping/Carrier thông tin
        carrier: {
            name: String, // "Giao Hàng Nhanh", "Viettel Post", etc
            id: mongoose.Schema.Types.ObjectId,
        },
        trackingNumber: {
            type: String,
            default: null, // Được gán khi carrier nhận hàng
        },

        // 📍 Delivery attempt tracking
        deliveryAttempts: [deliveryAttemptSchema],
        maxDeliveryAttempts: {
            type: Number,
            default: 3,
        },

        // 📍 Real-time location (từ carrier)
        currentLocation: {
            latitude: Number,
            longitude: Number,
            address: String,
            lastUpdated: Date,
        },

        // 🔙 Return thông tin
        return: returnSchema,

        // 🧑‍💼 Seller info
        handledBy: {
            sellerId: mongoose.Schema.Types.ObjectId,
            storeName: String,
        },

        // 📋 Notes từ seller/carrier/system
        notes: [noteSchema],

        // ✅ MỚI: References tới các OrderDetail (sub-orders)
        orderDetails: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'OrderDetail',
            },
        ],

        // Flag để biết OrderDetails đã được tạo chưa
        detailsCreated: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index cho orderDetails
orderSchema.index({ orderDetails: 1 });

module.exports = mongoose.model('Order', orderSchema);
