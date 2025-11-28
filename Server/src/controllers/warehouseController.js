const { SellerProfile, Profile } = require('../models/profileModel');
const WarehouseStock = require('../models/warehouseStockModel');
const WarehouseLog = require('../models/warehouseLogModel');
const Book = require('../models/bookModel');
const mongoose = require('mongoose');

/**
 * ================================
 * WAREHOUSE CONTROLLER
 * ================================
 *
 * QUẢN LÝ KHO:
 * - Tạo/cập nhật/xóa kho (trong Profile.warehouses array)
 * - Nhập kho (tăng tồn)
 * - Xuất kho (giảm tồn, không vượt quá)
 * - Xem lịch sử
 *
 * CHỐNG RACE CONDITION:
 * - Dùng MongoDB transactions
 * - Atomic operations: findByIdAndUpdate()
 * - Locking mechanism khi cần
 */

// 1️⃣ TẠO KHO MỚI
exports.createWarehouse = async (req, res) => {
    try {
        const {
            name,
            street,
            ward,
            district,
            province,
            postalCode,
            managerName,
            managerPhone,
        } = req.body;
        const sellerId = req.user?.userId;

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn phải đăng nhập để tạo kho',
            });
        }

        // Validate input
        if (!name || !street || !ward || !district || !province) {
            return res.status(400).json({
                success: false,
                message:
                    'Vui lòng cung cấp đầy đủ thông tin kho (tên, địa chỉ)',
            });
        }

        const newWarehouse = {
            name,
            street,
            ward,
            district,
            province,
            country: 'Vietnam',
            postalCode: postalCode || '',
            managerName,
            managerPhone,
            isDefault: false,
        };

        const profile = await SellerProfile.findByIdAndUpdate(
            sellerId,
            { $push: { warehouses: newWarehouse } },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tồn tại',
            });
        }

        res.status(201).json({
            success: true,
            message: 'Tạo kho thành công',
            data: profile.warehouses[profile.warehouses.length - 1],
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2️⃣ LẤY DANH SÁCH KHO CỦA SELLER
exports.getWarehousesBySellergetWarehousesBySeller = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn phải đăng nhập',
            });
        }
        // Query by userId, not by _id
        const profile = await SellerProfile.findOne({ userId }).select(
            'warehouses'
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tồn tại',
            });
        }

        res.json({
            success: true,
            data: profile.warehouses,
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3️⃣ NHẬP KHO
/**
 * FLOW NHẬP KHO:
 * 1. Kiểm tra kho tồn tại trong warehouses array
 * 2. Kiểm tra sách tồn tại & thuộc về seller
 * 3. Start transaction
 * 4. Cập nhật WarehouseStock (tăng quantity)
 * 5. Cập nhật Book.stock (tăng tổng tồn)
 * 6. Tạo WarehouseLog (type=import)
 * 7. Commit transaction
 */
exports.importStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { warehouseId, bookId, quantity, reason = 'Import' } = req.body;
        const sellerId = req.user?.userId;
        const userId = req.user?.userId;

        // Validate
        if (!warehouseId || !bookId || !quantity || quantity <= 0) {
            throw new Error('Dữ liệu nhập không hợp lệ');
        }

        // Kiểm tra kho tồn tại trong warehouses array
        const profile = await SellerProfile.findOne({
            userId: sellerId,
        }).session(session);

        if (!profile) {
            throw new Error('Seller profile không tồn tại');
        }

        const warehouse = profile.warehouses.id(warehouseId);
        if (!warehouse) {
            throw new Error('Kho không tồn tại hoặc không thuộc về bạn');
        }

        // Kiểm tra sách tồn tại & thuộc seller
        const book = await Book.findOne({
            _id: bookId,
            sellerId,
        }).session(session);

        if (!book) {
            throw new Error('Sách không tồn tại hoặc không thuộc về bạn');
        }

        // Tìm hoặc tạo WarehouseStock
        let warehouseStock = await WarehouseStock.findOne({
            sellerId,
            bookId,
            warehouseId,
        }).session(session);

        const quantityBefore = warehouseStock?.quantity || 0;
        const quantityAfter = quantityBefore + quantity;

        if (!warehouseStock) {
            // Tạo mới
            warehouseStock = new WarehouseStock({
                sellerId,
                bookId,
                warehouseId,
                warehouseName: warehouse.name,
                quantity: quantityAfter,
                lastUpdatedStock: new Date(),
            });
            await warehouseStock.save({ session });
        } else {
            // Cập nhật
            warehouseStock.quantity = quantityAfter;
            warehouseStock.lastUpdatedStock = new Date();
            await warehouseStock.save({ session });
        }

        // Cập nhật Book.stock (tổng tồn)
        await Book.findByIdAndUpdate(
            bookId,
            { $inc: { stock: quantity } },
            { session }
        );

        // Tạo WarehouseLog
        const log = new WarehouseLog({
            sellerId,
            bookId,
            warehouseId,
            warehouseName: warehouse.name,
            type: 'import',
            quantity,
            quantityBefore,
            quantityAfter,
            reason,
            performedBy: userId,
            status: 'success',
        });

        await log.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Nhập kho thành công',
            data: {
                warehouseStock,
                book,
                log,
            },
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

// 4️⃣ XUẤT KHO (không được vượt quá tồn)
/**
 * FLOW XUẤT KHO:
 * 1. Kiểm tra kho & sách
 * 2. Kiểm tra tồn kho có đủ không (⚠️ KHÔNG VƯỢT TỒN)
 * 3. Start transaction
 * 4. Giảm WarehouseStock.quantity
 * 5. Giảm Book.stock
 * 6. Tạo log (type=export)
 * 7. Commit
 */
exports.exportStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { warehouseId, bookId, quantity, reason = 'Export' } = req.body;
        const sellerId = req.user?.userId;
        const userId = req.user?.userId;

        // Validate
        if (!warehouseId || !bookId || !quantity || quantity <= 0) {
            throw new Error('Dữ liệu xuất không hợp lệ');
        }

        // Kiểm tra kho
        const profile = await SellerProfile.findOne({
            userId: sellerId,
        }).session(session);

        if (!profile) {
            throw new Error('Seller profile không tồn tại');
        }

        const warehouse = profile.warehouses.id(warehouseId);
        if (!warehouse) {
            throw new Error('Kho không tồn tại');
        }

        // Kiểm tra sách
        const book = await Book.findOne({
            _id: bookId,
            sellerId,
        }).session(session);

        if (!book) {
            throw new Error('Sách không tồn tại');
        }

        // ⚠️ KIỂM TRA TỒN KHO CÓ ĐỦ KHÔNG
        const warehouseStock = await WarehouseStock.findOne({
            sellerId,
            bookId,
            warehouseId,
        }).session(session);

        if (!warehouseStock || warehouseStock.quantity < quantity) {
            throw new Error(
                `Tồn kho không đủ. Tồn: ${
                    warehouseStock?.quantity || 0
                }, Cần: ${quantity}`
            );
        }

        const quantityBefore = warehouseStock.quantity;
        const quantityAfter = quantityBefore - quantity;

        // Cập nhật WarehouseStock
        warehouseStock.quantity = quantityAfter;
        warehouseStock.lastUpdatedStock = new Date();
        await warehouseStock.save({ session });

        // Cập nhật Book.stock
        await Book.findByIdAndUpdate(
            bookId,
            { $inc: { stock: -quantity } },
            { session }
        );

        // Tạo log
        const log = new WarehouseLog({
            sellerId,
            bookId,
            warehouseId,
            warehouseName: warehouse.name,
            type: 'export',
            quantity,
            quantityBefore,
            quantityAfter,
            reason,
            performedBy: userId,
            status: 'success',
        });

        await log.save({ session });

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Xuất kho thành công',
            data: {
                warehouseStock,
                book,
                log,
            },
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

// 5️⃣ LẤY LỊCH SỬ NHẬP/XUẤT
exports.getWarehouseLogs = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sellerId = userId;
        const {
            warehouseId = null,
            type = null,
            page = 1,
            limit = 20,
        } = req.query;

        const query = { sellerId };
        if (warehouseId) query.warehouseId = warehouseId;
        if (type) query.type = type;

        const logs = await WarehouseLog.find(query)
            .populate('bookId', 'title author')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await WarehouseLog.countDocuments(query);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6️⃣ LẤY TỒNG KHO CỦA SẢN PHẨM
/**
 * Tổng hợp tồn kho của 1 sản phẩm trên tất cả kho
 */
exports.getProductTotalStock = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user?.userId;
        const sellerId = userId;

        // Kiểm tra sách thuộc seller
        const book = await Book.findOne({
            _id: bookId,
            sellerId,
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại',
            });
        }

        // Lấy tồn từ tất cả kho
        const stocks = await WarehouseStock.find({
            sellerId,
            bookId,
        });

        const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);

        res.json({
            success: true,
            data: {
                book: {
                    _id: book._id,
                    title: book.title,
                    bookStock: book.stock, // Stock tổng trong Book model
                },
                stocks, // Chi tiết từng kho
                totalStock, // Tổng tính từ warehouse stocks
            },
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
