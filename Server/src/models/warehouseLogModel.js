const mongoose = require('mongoose');

/**
 * WAREHOUSE LOG MODEL
 * ===================
 * Ghi nhận TOÀN BỘ lịch sử:
 * - Nhập kho
 * - Xuất kho
 * - Trừ stock khi tạo đơn
 * - Hoàn stock khi hủy đơn
 * - Điều chỉnh tay
 * - Hư hỏng, mất mát
 *
 * Dùng để audit, kiểm toán, theo dõi biến động stock
 */
const warehouseLogSchema = new mongoose.Schema(
    {
        // 🧍 ID của seller
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },

        // 📦 ID của sách
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },

        // 🏭 ID của kho (từ profile.warehouses[i]._id)
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        // 📝 Tên kho (cache)
        warehouseName: {
            type: String,
            default: '',
        },

        // 📝 Loại giao dịch
        type: {
            type: String,
            enum: [
                'import', // Nhập kho
                'export', // Xuất kho (thủ công)
                'order_create', // Trừ khi tạo đơn
                'order_cancel', // Hoàn khi hủy đơn
                'return', // Hoàn hàng từ khách
                'damage', // Hư hỏng
                'adjustment', // Điều chỉnh tay
            ],
            required: true,
        },

        // 📊 Số lượng thay đổi (luôn dương, dấu +/- phụ thuộc type)
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        // 💭 Tồn kho TRƯỚC giao dịch
        quantityBefore: {
            type: Number,
            required: true,
            min: 0,
        },

        // ✅ Tồn kho SAU giao dịch
        quantityAfter: {
            type: Number,
            required: true,
            min: 0,
        },

        // 🔗 Tham chiếu đến đơn hàng (nếu có)
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },

        // 📝 Lý do/ghi chú
        reason: {
            type: String,
            default: '',
        },

        // 👤 Người thực hiện
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ✔️ Trạng thái ghi nhật ký
        status: {
            type: String,
            enum: ['success', 'failed', 'reversed'],
            default: 'success',
        },
    },
    { timestamps: true }
);

// 🔍 Indexes để query nhanh
warehouseLogSchema.index({ sellerId: 1, createdAt: -1 });
warehouseLogSchema.index({ bookId: 1, sellerId: 1 });
warehouseLogSchema.index({ warehouseId: 1, createdAt: -1 });
warehouseLogSchema.index({ orderId: 1 });
warehouseLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('WarehouseLog', warehouseLogSchema);
