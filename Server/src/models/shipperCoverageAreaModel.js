const mongoose = require('mongoose');

/**
 * ============================================================
 * SHIPPER COVERAGE AREA MODEL
 * ============================================================
 *
 * Mục đích: Quản lý khu vực phục vụ của mỗi shipper
 * - Shipper chỉ nhìn thấy đơn hàng trong khu vực mình phụ trách
 * - Dự phòng shipper (khi shipper chính không sẵn)
 * - Quản lý độ bao phủ dịch vụ
 *
 * Ví dụ:
 * - Shipper A: TP.HCM (Quận 1, 2, 3, ...)
 * - Shipper B: Hà Nội (Hoàn Kiếm, Hai Bà Trưng, ...)
 * - Regional Carrier: TP.HCM → Hà Nội
 */

const shipperCoverageAreaSchema = new mongoose.Schema(
    {
        /**
         * SHIPPER ID
         */
        shipperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShipperProfile',
            required: true,
            index: true,
        },

        /**
         * LOẠI SHIPPER
         */
        shipperType: {
            type: String,
            enum: [
                'local', // Shipper địa phương (nội tỉnh)
                'regional', // Shipper liên tỉnh
                'logistics_partner', // Đối tác logistics
            ],
            required: true,
            default: 'local',
        },

        /**
         * KHU VỰC PHỤC VỤ
         */
        // Nếu type = 'local': quản lý tỉnh, quận huyện cụ thể
        // Nếu type = 'regional': quản lý liên tỉnh
        coverageAreas: [
            {
                province: {
                    type: String,
                    required: true,
                    index: true,
                }, // "TP.HCM", "Hà Nội"
                provinceCode: String, // Code từ API địa lý
                districts: [
                    {
                        name: String, // Optional: nếu tỉnh quá lớn chỉ phục vụ một số quận
                        code: String,
                    },
                ], // []: nghĩa là phục vụ toàn tỉnh
                wards: [
                    {
                        name: String,
                        code: String,
                    },
                ], // []: nghĩa là phục vụ toàn bộ
            },
        ],

        /**
         * THÔNG TIN SHIPPER
         */
        name: String,
        phone: String,
        email: String,

        /**
         * KHO/HUB CHÍNH
         */
        // Nơi lấy và gửi hàng
        mainWarehouseId: mongoose.Schema.Types.ObjectId,
        mainWarehouseName: String,

        /**
         * TRẠNG THÁI
         */
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'on_leave'],
            default: 'active',
            index: true,
        },

        /**
         * SHIPPER DỰ PHÒNG (KHI SHIPPER CHÍNH KHÔNG SẢN CÓ)
         */
        backupShippers: [
            {
                shipperId: mongoose.Schema.Types.ObjectId,
                priority: Number, // 1 = ưu tiên cao nhất
                isActive: Boolean,
            },
        ],

        /**
         * HIỆU SUẤT
         */
        performance: {
            totalDeliveries: { type: Number, default: 0 },
            successfulDeliveries: { type: Number, default: 0 },
            failedDeliveries: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0, min: 0, max: 5 },
            onTimeDeliveryRate: { type: Number, default: 0 },
            lastUpdatedAt: Date,
        },

        /**
         * CÔNG SUẤT
         */
        capacity: {
            maxOrdersPerDay: Number,
            currentActiveOrders: { type: Number, default: 0 },
            isAvailable: {
                type: Boolean,
                default: true,
            },
        },

        /**
         * VỊ TRÍ HIỆN TẠI (REALTIME)
         */
        currentLocation: {
            latitude: Number,
            longitude: Number,
            address: String,
            timestamp: Date,
            isOnline: { type: Boolean, default: true },
        },

        /**
         * GHI CHÚ
         */
        notes: String,
        joinedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

/**
 * INDEXES
 */
shipperCoverageAreaSchema.index({ shipperId: 1 });
shipperCoverageAreaSchema.index({
    'coverageAreas.province': 1,
    status: 1,
});
shipperCoverageAreaSchema.index({ shipperType: 1, status: 1 });

/**
 * METHODS
 */

// Kiểm tra shipper có phục vụ tỉnh nào không
shipperCoverageAreaSchema.methods.servesProvince = function (province) {
    return this.coverageAreas.some((area) => area.province === province);
};

// Kiểm tra shipper có phục vụ tỉnh + quận không
shipperCoverageAreaSchema.methods.servesDistrict = function (
    province,
    district
) {
    const area = this.coverageAreas.find((a) => a.province === province);
    if (!area) return false;

    // Nếu districts array trống = phục vụ toàn tỉnh
    if (area.districts.length === 0) return true;

    return area.districts.some(
        (d) => d.name === district || d.code === district
    );
};

// Kiểm tra shipper hiện có sẵn không (active + online + dưới capacity)
shipperCoverageAreaSchema.methods.isAvailableForPickup = function () {
    return (
        this.status === 'active' &&
        this.currentLocation?.isOnline &&
        this.capacity.isAvailable &&
        this.capacity.currentActiveOrders < this.capacity.maxOrdersPerDay
    );
};

module.exports = mongoose.model(
    'ShipperCoverageArea',
    shipperCoverageAreaSchema
);
