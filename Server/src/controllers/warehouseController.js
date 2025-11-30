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
            detail,
            ward,
            district,
            province,
            postalCode,
            managerName,
            managerPhone,
        } = req.body;
        const street = detail;
        const userId = req.user?.userId;

        if (!userId) {
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

        // Find by userId, not by profile _id
        const profile = await SellerProfile.findOneAndUpdate(
            { userId },
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

// 2️⃣B CẬP NHẬT KHO HÀNG
exports.updateWarehouse = async (req, res) => {
    try {
        const { id: warehouseId } = req.params;
        const sellerId = req.user?.userId;
        const {
            name,
            street,
            detail,
            ward,
            district,
            province,
            managerName,
            managerPhone,
        } = req.body;

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn phải đăng nhập để cập nhật kho',
            });
        }

        // Validate input
        if (!name || !ward || !district || !province) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin kho',
            });
        }

        // Tìm profile và cập nhật kho trong array warehouses
        const profile = await SellerProfile.findOne({ userId: sellerId });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tồn tại',
            });
        }

        // Tìm warehouse trong array
        const warehouse = profile.warehouses.id(warehouseId);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Kho không tồn tại',
            });
        }

        // Cập nhật warehouse
        warehouse.name = name;
        warehouse.street = street || warehouse.street;
        warehouse.detail = detail || warehouse.detail;
        warehouse.ward = ward;
        warehouse.district = district;
        warehouse.province = province;
        warehouse.managerName = managerName || warehouse.managerName;
        warehouse.managerPhone = managerPhone || warehouse.managerPhone;

        // Lưu profile với warehouse đã cập nhật
        await profile.save();

        res.json({
            success: true,
            message: 'Cập nhật kho thành công',
            data: warehouse,
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
            sellerId: profile._id, // ← Use profile._id, not userId
        }).session(session);

        if (!book) {
            throw new Error('Sách không tồn tại hoặc không thuộc về bạn');
        }

        // Tìm hoặc tạo WarehouseStock
        let warehouseStock = await WarehouseStock.findOne({
            sellerId: profile._id, // ← Use profile._id
            bookId,
            warehouseId,
        }).session(session);

        const quantityBefore = warehouseStock?.quantity || 0;
        const quantityAfter = quantityBefore + quantity;

        if (!warehouseStock) {
            // Tạo mới
            warehouseStock = new WarehouseStock({
                sellerId: profile._id, // ← Use profile._id
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
            sellerId: profile._id, // ← Use profile._id
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
            sellerId: profile._id,
        }).session(session);

        if (!book) {
            throw new Error('Sách không tồn tại');
        }

        // ⚠️ KIỂM TRA TỒN KHO CÓ ĐỦ KHÔNG
        const warehouseStock = await WarehouseStock.findOne({
            sellerId: profile._id,
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
            sellerId: profile._id,
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
        const profile = await SellerProfile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tìm thấy',
            });
        }

        const {
            warehouseId = null,
            type = null,
            page = 1,
            limit = 20,
        } = req.query;

        const query = { sellerId: profile._id };
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
        const profile = await SellerProfile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tìm thấy',
            });
        }

        // Kiểm tra sách thuộc seller
        const book = await Book.findOne({
            _id: bookId,
            sellerId: profile._id,
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại',
            });
        }

        // Lấy tồn từ tất cả kho
        const stocks = await WarehouseStock.find({
            sellerId: profile._id,
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

// 7️⃣ LẤY DANH SÁCH SẢN PHẨM CÓ TRONG KHO
/**
 * Xem tất cả sản phẩm + tồn kho trong 1 kho cụ thể
 * GET /api/warehouses/:warehouseId/inventory
 */
exports.getWarehouseInventory = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const userId = req.user?.userId;
        const { page = 1, limit = 20, search = '' } = req.query;

        // Get seller profile
        const profile = await SellerProfile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tìm thấy',
            });
        }

        // Verify warehouse exists and belongs to seller
        const warehouse = profile.warehouses.id(warehouseId);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Kho không tồn tại hoặc không thuộc về bạn',
            });
        }

        // Build query for WarehouseStock
        const query = {
            sellerId: profile._id,
            warehouseId,
            quantity: { $gt: 0 }, // Chỉ lấy sản phẩm có tồn
        };

        // Get total count
        const total = await WarehouseStock.countDocuments(query);

        // Get inventory items with book details
        const items = await WarehouseStock.find(query)
            .populate({
                path: 'bookId',
                select: 'title author price cover categoryId isPublished',
                populate: {
                    path: 'categoryId',
                    select: 'name',
                },
            })
            .sort({ lastUpdatedStock: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Apply search filter on populated data
        const filteredItems = search
            ? items.filter((item) =>
                  item.bookId?.title
                      .toLowerCase()
                      .includes(search.toLowerCase())
              )
            : items;

        res.json({
            success: true,
            data: {
                warehouse: {
                    _id: warehouse._id,
                    name: warehouse.name,
                    address: `${warehouse.street}, ${warehouse.ward}, ${warehouse.district}, ${warehouse.province}`,
                    manager: warehouse.managerName,
                    phone: warehouse.managerPhone,
                },
                items: filteredItems.map((item) => ({
                    _id: item._id,
                    bookId: item.bookId?._id,
                    bookTitle: item.bookId?.title || 'N/A',
                    bookAuthor: item.bookId?.author || 'N/A',
                    bookPrice: item.bookId?.price || 0,
                    bookCategory: item.bookId?.categoryId?.name || 'N/A',
                    quantity: item.quantity,
                    lastUpdated: item.lastUpdatedStock,
                    isPublished: item.bookId?.isPublished || false,
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                    filtered: filteredItems.length,
                },
            },
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
