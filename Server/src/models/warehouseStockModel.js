const mongoose = require('mongoose');

/**
 * WAREHOUSE STOCK MODEL
 * ====================
 * Quản lý số lượng sản phẩm trong từng kho
 *
 * Ví dụ:
 * - Sản phẩm A: 100 cái ở Kho TP.HCM, 50 cái ở Kho Hà Nội
 * - Tổng stock = 150 cái (Book.stock = 150)
 *
 * Tối ưu: Khi cần tìm tồn kho, tra cứu collection này thay vì Book
 * Cân bằng tải trên hệ thống
 */
const warehouseStockSchema = new mongoose.Schema(
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

        // 🏭 Warehouse ID (từ profile.warehouses[i]._id)
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        // 📝 Tên kho (cache từ profile.warehouses.name)
        warehouseName: {
            type: String,
            required: true,
        },

        // 📊 Số lượng tồn trong kho này
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        // 📈 Số lượng đã bán (snapshot)
        soldCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // 📅 Lần cập nhật tồn kho gần nhất
        lastUpdatedStock: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// 🔑 Index composite: (sellerId, bookId, warehouseId) = duy nhất
// Không được có 2 bản ghi cùng product, warehouse, seller
warehouseStockSchema.index(
    { sellerId: 1, bookId: 1, warehouseId: 1 },
    { unique: true }
);

// 🔍 Index phụ để tìm kiếm nhanh
warehouseStockSchema.index({ sellerId: 1, bookId: 1 });
warehouseStockSchema.index({ warehouseId: 1, quantity: 1 });

module.exports = mongoose.model('WarehouseStock', warehouseStockSchema);
