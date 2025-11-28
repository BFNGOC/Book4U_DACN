const WarehouseStock = require('../models/warehouseStockModel');
const WarehouseLog = require('../models/warehouseLogModel');
const Book = require('../models/bookModel');
const mongoose = require('mongoose');

/**
 * STOCK MANAGEMENT SERVICE
 * ========================
 *
 * Helper functions xử lý business logic liên quan đến stock
 */

// 1️⃣ KIỂM TRA STOCK CÓ ĐỦ KHÔNG
exports.checkStockAvailability = async (bookId, quantity) => {
    try {
        const book = await Book.findById(bookId);

        if (!book) {
            return {
                available: false,
                reason: 'Sách không tồn tại',
                currentStock: 0,
            };
        }

        if (book.stock < quantity) {
            return {
                available: false,
                reason: `Tồn kho không đủ. Tồn: ${book.stock}, Cần: ${quantity}`,
                currentStock: book.stock,
            };
        }

        return {
            available: true,
            reason: 'Stock đủ',
            currentStock: book.stock,
        };
    } catch (err) {
        throw err;
    }
};

// 2️⃣ VALIDATE TRƯỚC KHI BÁN - STOCK PHẢI > 0
exports.validateStockForSale = async (bookId) => {
    try {
        const book = await Book.findById(bookId);

        if (!book) {
            return {
                valid: false,
                reason: 'Sách không tồn tại',
            };
        }

        if (book.stock === 0) {
            return {
                valid: false,
                reason: 'Không thể đăng bán sản phẩm với stock = 0. Vui lòng nhập kho trước.',
                requiresStockImport: true,
            };
        }

        return {
            valid: true,
            reason: 'OK - Có thể đăng bán',
            currentStock: book.stock,
        };
    } catch (err) {
        throw err;
    }
};

// 3️⃣ LẤY TỒNG STOCK CỦA SẢN PHẨM TỪ TẤT CẢ KHO
exports.getTotalStockByBook = async (bookId, sellerId = null) => {
    try {
        const query = { bookId };
        if (sellerId) query.sellerId = sellerId;

        const stocks = await WarehouseStock.find(query);
        const total = stocks.reduce((sum, s) => sum + s.quantity, 0);

        return {
            total,
            breakdown: stocks,
        };
    } catch (err) {
        throw err;
    }
};

// 4️⃣ LẤY TỒNG STOCK CỦA KHO
exports.getTotalStockByWarehouse = async (warehouseId) => {
    try {
        const stocks = await WarehouseStock.find({
            warehouseId,
        }).populate('bookId', 'title author');

        const total = stocks.reduce((sum, s) => sum + s.quantity, 0);

        return {
            total,
            items: stocks,
        };
    } catch (err) {
        throw err;
    }
};

// 5️⃣ KIỂM TRA CONSISTENCY - WAREHOUSE STOCK VS BOOK.STOCK
exports.checkConsistency = async (bookId, sellerId) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) return { consistent: false, reason: 'Book not found' };

        const warehouseStocks = await WarehouseStock.find({
            bookId,
            ...(sellerId && { sellerId }),
        });

        const totalWarehouseStock = warehouseStocks.reduce(
            (sum, s) => sum + s.quantity,
            0
        );

        const consistent = book.stock === totalWarehouseStock;

        return {
            consistent,
            bookStock: book.stock,
            warehouseTotal: totalWarehouseStock,
            difference: book.stock - totalWarehouseStock,
            ...(consistent || {
                inconsistency: `Book.stock=${book.stock} ≠ WarehouseTotal=${totalWarehouseStock}`,
            }),
        };
    } catch (err) {
        throw err;
    }
};

// 6️⃣ LẤY THỐNG KÊ STOCK
exports.getStockStatistics = async (sellerId) => {
    try {
        const stocks = await WarehouseStock.find({ sellerId })
            .populate('bookId', 'title price')
            .populate('warehouseId', 'name');

        const totalProducts = stocks.length;
        const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0);
        const lowStockItems = stocks.filter((s) => s.quantity < 10);

        return {
            totalProducts,
            totalQuantity,
            lowStockCount: lowStockItems.length,
            lowStockItems,
            stats: stocks,
        };
    } catch (err) {
        throw err;
    }
};

// 7️⃣ LẤY LỊCH SỬ THAY ĐỔI STOCK
exports.getStockHistory = async (
    bookId,
    sellerId = null,
    warehouseId = null,
    limit = 50
) => {
    try {
        const query = { bookId };
        if (sellerId) query.sellerId = sellerId;
        if (warehouseId) query.warehouseId = warehouseId;

        const logs = await WarehouseLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return logs;
    } catch (err) {
        throw err;
    }
};
