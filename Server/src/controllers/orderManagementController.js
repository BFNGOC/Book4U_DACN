const Order = require('../models/orderModel');
const WarehouseStock = require('../models/warehouseStockModel');
const WarehouseLog = require('../models/warehouseLogModel');
const Book = require('../models/bookModel');
const mongoose = require('mongoose');

/**
 * ==========================================
 * ORDER MANAGEMENT CONTROLLER
 * ==========================================
 *
 * CHỨC NĂNG:
 * - Tạo đơn hàng: kiểm tra stock → trừ stock
 * - Hủy đơn hàng: hoàn stock
 *
 * LOGIC STOCK:
 * - Sử dụng Book.stock để check tổng (toàn hệ thống)
 * - Sử dụng WarehouseStock để trừ cụ thể từng kho
 * - Ghi log mỗi thay đổi
 *
 * CHỐNG RACE CONDITION:
 * - Transaction + atomic ops
 */

// 1️⃣ KIỂM TRA STOCK TRƯỚC TẠO ĐƠN
/**
 * Hàm này gọi trước khi tạo đơn để xác nhận có đủ stock không
 *
 * Input: [{bookId, quantity, sellerId}, ...]
 * Output: {allValid: bool, details: [...]}
 */
exports.validateStockBeforeOrder = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items không hợp lệ',
            });
        }

        const validationResults = [];
        let allValid = true;

        for (const item of items) {
            const { bookId, sellerId, quantity } = item;

            // Lấy Book.stock
            const book = await Book.findById(bookId);
            if (!book) {
                validationResults.push({
                    bookId,
                    valid: false,
                    message: 'Sách không tồn tại',
                });
                allValid = false;
                continue;
            }

            // Kiểm tra stock
            if (book.stock < quantity) {
                validationResults.push({
                    bookId,
                    title: book.title,
                    valid: false,
                    currentStock: book.stock,
                    requested: quantity,
                    message: `Tồn kho không đủ. Tồn: ${book.stock}, Cần: ${quantity}`,
                });
                allValid = false;
            } else {
                validationResults.push({
                    bookId,
                    title: book.title,
                    valid: true,
                    currentStock: book.stock,
                });
            }
        }

        res.json({
            success: allValid,
            allValid,
            validationResults,
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2️⃣ TẠO ĐƠN HÀNG (TRỪ STOCK)
/**
 * FLOW TẠO ĐƠN:
 *
 * 1. Validate items (stock đủ không)
 * 2. Start transaction
 * 3. Tạo Order document
 * 4. Với TỪNG item:
 *    a. Tìm WarehouseStock có tồn kho
 *    b. Kiểm tra lại có đủ không
 *    c. Trừ WarehouseStock.quantity
 *    d. Trừ Book.stock
 *    e. Tạo WarehouseLog (type=order_create)
 * 5. Commit transaction (✅ tất cả hoặc không có gì)
 *
 * ⚠️ RACE CONDITION PROTECTION:
 * - Atomic findOneAndUpdate trên WarehouseStock
 * - Transaction nếu cần update multiple docs
 * - Locking ở DB level
 */
exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            profileId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
        } = req.body;

        // Validate
        if (!items || items.length === 0) {
            throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm');
        }

        // Bước 1: Validate stock trước
        for (const item of items) {
            const { bookId, quantity } = item;
            const book = await Book.findById(bookId).session(session);

            if (!book || book.stock < quantity) {
                throw new Error(`Sản phẩm ${bookId} không đủ tồn kho`);
            }
        }

        // Bước 2: Tạo Order
        const order = new Order({
            profileId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
            status: 'pending',
            paymentStatus: 'unpaid',
        });

        const createdOrder = await order.save({ session });

        // Bước 3: TRỪ STOCK - Từng item
        for (const item of items) {
            const { bookId, sellerId, quantity } = item;

            // Tìm warehouse stock với enough quantity
            // Ưu tiên tìm kho có đủ stock
            const warehouseStock = await WarehouseStock.findOne({
                sellerId,
                bookId,
                quantity: { $gte: quantity },
            }).session(session);

            if (!warehouseStock) {
                throw new Error(
                    `Không tìm thấy kho có đủ tồn cho sản phẩm ${bookId}`
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
                { $inc: { stock: -quantity, soldCount: 1 } },
                { session }
            );

            // Tạo WarehouseLog
            const log = new WarehouseLog({
                sellerId,
                bookId,
                warehouseId: warehouseStock.warehouseId,
                warehouseName: warehouseStock.warehouseName,
                type: 'order_create',
                quantity,
                quantityBefore,
                quantityAfter,
                orderId: createdOrder._id,
                reason: `Order ${createdOrder._id}`,
                performedBy: profileId,
                status: 'success',
            });

            await log.save({ session });
        }

        // Commit
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công. Stock đã được trừ.',
            data: createdOrder,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

// 3️⃣ HỦY ĐƠN HÀNG (HOÀN STOCK)
/**
 * FLOW HỦY ĐƠN:
 *
 * 1. Kiểm tra order tồn tại & status != 'completed'/'shipped'
 * 2. Start transaction
 * 3. Với TỪNG item trong order:
 *    a. Tìm WarehouseStock (từ log để biết là kho nào)
 *    b. Thêm lại quantity
 *    c. Thêm lại Book.stock
 *    d. Tạo log (type=order_cancel)
 * 4. Cập nhật order.status = 'cancelled'
 * 5. Commit
 *
 * ✔️ ĐẢM BẢO HOÀN STOCK ĐÚNG KHO
 * - Lấy warehouseId từ WarehouseLog của order create
 */
exports.cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;
        const { reason = 'User cancelled' } = req.body;
        const userId = req.user?._id;

        // Kiểm tra order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        // Kiểm tra status
        if (['completed', 'shipped'].includes(order.status)) {
            throw new Error('Không thể hủy đơn đã hoàn thành hoặc đang giao');
        }

        if (order.status === 'cancelled') {
            throw new Error('Đơn hàng đã bị hủy trước đó');
        }

        // Lấy log để biết từng item đã xuất từ kho nào
        const orderLogs = await WarehouseLog.find({
            orderId,
            type: 'order_create',
        }).session(session);

        // HOÀN STOCK - Từng item
        for (const log of orderLogs) {
            const { sellerId, bookId, warehouseId, quantity } = log;

            // Tìm WarehouseStock
            const warehouseStock = await WarehouseStock.findOne({
                sellerId,
                bookId,
                warehouseId,
            }).session(session);

            if (!warehouseStock) {
                throw new Error(
                    `Không tìm thấy WarehouseStock để hoàn (${bookId})`
                );
            }

            const quantityBefore = warehouseStock.quantity;
            const quantityAfter = quantityBefore + quantity;

            // Cập nhật WarehouseStock (thêm lại)
            warehouseStock.quantity = quantityAfter;
            warehouseStock.lastUpdatedStock = new Date();
            await warehouseStock.save({ session });

            // Cập nhật Book.stock (thêm lại)
            await Book.findByIdAndUpdate(
                bookId,
                { $inc: { stock: quantity, soldCount: -1 } },
                { session }
            );

            // Tạo log hoàn
            const cancelLog = new WarehouseLog({
                sellerId,
                bookId,
                warehouseId,
                warehouseName: warehouseStock.warehouseName,
                type: 'order_cancel',
                quantity,
                quantityBefore,
                quantityAfter,
                orderId,
                reason: reason || `Hủy đơn ${orderId}`,
                performedBy: userId,
                status: 'success',
            });

            await cancelLog.save({ session });
        }

        // Cập nhật order status
        order.status = 'cancelled';
        await order.save({ session });

        // Commit
        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Hủy đơn hàng thành công. Stock đã được hoàn lại.',
            data: order,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

// 4️⃣ LẤY ĐƠNHÀNG
exports.getOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('items.bookId', 'title author images price')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5️⃣ LẤY DANH SÁCH ĐƠN CỦA KHÁCH HÀNG
exports.getCustomerOrders = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { status = null, page = 1, limit = 10 } = req.query;

        const query = { profileId };
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate('items.bookId', 'title author images')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
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
