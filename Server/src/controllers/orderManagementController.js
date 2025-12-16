const Order = require('../models/orderModel');
const OrderDetail = require('../models/orderDetailModel');
const WarehouseStock = require('../models/warehouseStockModel');
const WarehouseLog = require('../models/warehouseLogModel');
const Book = require('../models/bookModel');
const { SellerProfile } = require('../models/profileModel');
const mongoose = require('mongoose');
const {
    selectNearestWarehouse,
    getWarehouseStocksWithLocation,
    validateAndLockWarehouseStock,
} = require('../utils/warehouseSelection');
const { geocodeAddress } = require('../services/geocodingService');
const { sendNewOrderNotification } = require('../utils/notificationService');

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

/**
 * ✅ HELPER FUNCTION: TẠO ORDERDETAIL CHO MỖI SELLER
 *
 * Được gọi từ createOrder() để tạo sub-orders
 */

// ✅ Extract province từ address string
const extractProvinceFromAddress = (address) => {
    if (!address) return '';
    // Format: "Số nhà, Phường, Quận, Tỉnh/Thành phố"
    const parts = address.split(',').map((p) => p.trim());
    const province = parts[parts.length - 1];
    return province;
};

exports.createOrderDetailsForMultiSeller = async (
    mainOrderId,
    items,
    shippingAddress,
    session
) => {
    /**
     * Tạo OrderDetail cho mỗi seller
     *
     * Input:
     *   - mainOrderId: ID của MainOrder
     *   - items: tất cả items của order
     *   - shippingAddress: địa chỉ giao hàng
     *   - session: mongoose session (để transaction)
     *
     * Output:
     *   - Array của OrderDetail._id
     */

    // Nhóm items theo sellerId
    const sellerGroups = {};
    for (const item of items) {
        const sellerId = item.sellerId.toString();
        if (!sellerGroups[sellerId]) {
            sellerGroups[sellerId] = [];
        }
        sellerGroups[sellerId].push(item);
    }

    const orderDetailIds = [];

    // Tạo OrderDetail cho mỗi seller
    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
        // Tính subtotal chỉ cho items của seller này
        const subtotal = sellerItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Tạo OrderDetail
        const orderDetail = new OrderDetail({
            mainOrderId,
            sellerId,
            items: sellerItems,
            subtotal,
            totalAmount: subtotal, // Chỉ hàng, chưa tính vận chuyển
            shippingAddress: {
                ...shippingAddress,
                province: extractProvinceFromAddress(shippingAddress.address), // ✅ Extract province
            },
            status: 'pending', // Chờ seller xác nhận
            paymentStatus: 'unpaid', // Sẽ update khi thanh toán
        });

        const savedDetail = await orderDetail.save({ session });
        orderDetailIds.push(savedDetail._id);

        console.log(
            `✅ Created OrderDetail for seller ${sellerId}: ${savedDetail._id}`
        );
    }

    return orderDetailIds;
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
/**
 * 2️⃣ TẠO ĐƠN HÀNG (CHỈ VALIDATE, KHÔNG TRỪ STOCK)
 *
 * FLOW:
 * 1. Validate: items có tồn không
 * 2. Tạo Order với status='pending' (seller sẽ confirm sau)
 * 3. KHÔNG TRỪ STOCK tại đây (tránh race condition ngay lập tức)
 * 4. Trả OrderId để seller confirm và trừ stock sau
 *
 * ✔️ RACE CONDITION PREVENTION:
 * - Stock trừ ở endpoint riêng (confirmOrder)
 * - Đó là lúc seller nhấn confirm → khi đó mới trừ stock
 * - Dùng atomic findOneAndUpdate (không save())
 */
exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let transactionCommitted = false;

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

        // Bước 1: Validate stock trước (kiểm tra Book.stock)
        for (const item of items) {
            const { bookId, quantity } = item;
            const book = await Book.findById(bookId).session(session);

            if (!book || book.stock < quantity) {
                throw new Error(`Sản phẩm ${bookId} không đủ tồn kho`);
            }
        }

        // Bước 2: Tạo Order với status=pending
        // Stock sẽ được trừ khi seller confirm
        const order = new Order({
            profileId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
            status: 'pending', // Chưa trừ stock
            paymentStatus: 'unpaid',
        });

        const createdOrder = await order.save({ session });

        // ✅ MỚI: Tạo OrderDetail cho mỗi seller
        const orderDetailIds = await exports.createOrderDetailsForMultiSeller(
            createdOrder._id,
            items,
            shippingAddress,
            session
        );

        // ✅ MỚI: Update MainOrder với references
        createdOrder.orderDetails = orderDetailIds;
        createdOrder.detailsCreated = true;
        await createdOrder.save({ session });

        await session.commitTransaction();
        transactionCommitted = true;

        // 🔔 SEND NOTIFICATIONS TO SELLERS (AFTER transaction committed)
        // Nhóm items theo sellerId
        const sellerItems = {};
        for (const item of items) {
            const sellerId = item.sellerId?.toString() || item.sellerId;
            if (!sellerItems[sellerId]) {
                sellerItems[sellerId] = [];
            }
            sellerItems[sellerId].push(item);
        }

        // Lấy customer info
        const profile =
            await require('../models/profileModel').Profile.findById(profileId);

        // Gửi notification cho từng seller
        const io = req.app.locals.io;
        if (io) {
            for (const [sellerId, itemsOfSeller] of Object.entries(
                sellerItems
            )) {
                // Tính subtotal chỉ cho items của seller này
                const sellerSubtotal = itemsOfSeller.reduce((sum, item) => {
                    return sum + item.price * item.quantity;
                }, 0);

                await sendNewOrderNotification(io, sellerId, {
                    _id: createdOrder._id,
                    customerName: profile
                        ? `${profile.firstName} ${profile.lastName}`
                        : 'Khách hàng',
                    customerPhone: profile?.primaryPhone || 'N/A',
                    subtotal: sellerSubtotal, // ✅ Chỉ subtotal của seller này
                    totalOrderAmount: totalAmount, // Tổng toàn order (info only)
                    items: itemsOfSeller, // ✅ Chỉ items của seller này
                    shippingAddress: shippingAddress,
                });
            }
        }

        res.status(201).json({
            success: true,
            message:
                'Tạo đơn hàng thành công (chưa trừ stock). Chờ seller xác nhận.',
            data: createdOrder,
        });
    } catch (err) {
        // Chỉ abort nếu transaction chưa được commit
        if (!transactionCommitted) {
            await session.abortTransaction();
        }
        console.error('Error:', err);
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * 2B️⃣ CONFIRM ORDER & DEDUCT STOCK (GỌI BỞI SELLER)
 *
 * FLOW:
 * 1. Order phải có status='pending'
 * 2. Với TỪNG item:
 *    a. Tìm warehouse có đủ stock (dựa trên vị trí khách hàng nếu có)
 *    b. ATOMIC findOneAndUpdate: kiểm tra quantity + trừ stock cùng lúc
 *    c. Nếu trừ thất bại → throw error (stock không đủ)
 *    d. Cập nhật Book.stock
 *    e. Tạo WarehouseLog
 * 3. Update Order: status=confirmed, warehouseId, handledBy=seller
 * 4. Commit transaction
 *
 * ✔️ RACE CONDITION PROTECTION:
 * - Dùng findOneAndUpdate với $gte condition (atomic)
 * - Không dùng save() (race condition)
 * - Transaction bao quanh tất cả
 */
exports.confirmOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;
        let { customerLocation } = req.body; // {latitude, longitude, address} or just {address}
        const userId = req.user?.userId;

        // Lấy seller profile
        const seller = await SellerProfile.findOne({ userId }).session(session);
        if (!seller) {
            throw new Error('Bạn không phải là seller');
        }

        // Lấy order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        if (order.status !== 'pending') {
            throw new Error(
                `Không thể confirm đơn có status=${order.status}. Phải là pending`
            );
        }

        // 🔍 GEOCODING: Convert address → tọa độ nếu chưa có
        if (!customerLocation?.latitude || !customerLocation?.longitude) {
            const addressToGeocode =
                customerLocation?.address ||
                order.shippingAddress?.address ||
                'TP. Hồ Chí Minh';

            console.log(`📡 Geocoding customer address: "${addressToGeocode}"`);

            try {
                const geocoded = await geocodeAddress(addressToGeocode);
                customerLocation = {
                    latitude: geocoded.latitude,
                    longitude: geocoded.longitude,
                    address: geocoded.address,
                    accuracy: geocoded.accuracy,
                    source: geocoded.source,
                };
                console.log(
                    `✅ Geocoded to: ${geocoded.address} (${geocoded.latitude}, ${geocoded.longitude})`
                );
            } catch (geocodeError) {
                console.warn(
                    '⚠️ Geocoding failed, using default:',
                    geocodeError.message
                );
                // Use default HCM location as fallback
                customerLocation = {
                    latitude: 10.7769,
                    longitude: 106.7009,
                    address: 'TP. Hồ Chí Minh (Default)',
                    accuracy: 'city_default',
                };
            }
        }

        // Bước 1: Xử lý từng item - chọn warehouse + trừ stock (ATOMIC)
        const warehouseSelections = {}; // {sellerId: {bookId: selectedWarehouse}}

        for (const item of order.items) {
            const { bookId, sellerId, quantity } = item;

            // Verify seller owns this item
            if (sellerId.toString() !== seller._id.toString()) {
                throw new Error('Bạn không sở hữu sản phẩm trong đơn này');
            }

            // Tìm các warehouse stock có hàng
            const warehouseStocks = await getWarehouseStocksWithLocation({
                WarehouseStock,
                SellerProfile,
                sellerId,
                bookId,
                session,
            });

            console.log(
                `📦 Found ${warehouseStocks.length} warehouse stocks for seller ${sellerId}, book ${bookId}:`,
                warehouseStocks.map((w) => ({
                    warehouseId: w.warehouseId,
                    warehouseName: w.warehouseName,
                    quantity: w.quantity,
                    distance: w.distance,
                }))
            );

            // Chọn warehouse gần nhất có đủ stock
            const warehouseSelection = selectNearestWarehouse({
                warehouseStocks,
                customerLocation: customerLocation || {
                    latitude: null,
                    longitude: null,
                },
                requiredQuantity: quantity,
            });

            const selectedWarehouse = warehouseSelection.selected;
            console.log(warehouseSelection.message);
            console.log(
                `✅ Selected warehouse: ${selectedWarehouse.warehouseId} (${selectedWarehouse.warehouseName})`
            );

            // ⚠️ ATOMIC operation: Kiểm tra + Trừ stock cùng lúc
            // Nếu concurrent request nào khác trừ hết stock trước,
            // query này sẽ return null và ta throw error
            console.log(
                `🔒 Attempting to lock stock: warehouseId=${selectedWarehouse.warehouseId}, sellerId=${sellerId}, bookId=${bookId}, qty=${quantity}`
            );
            const updatedWarehouseStock = await validateAndLockWarehouseStock(
                WarehouseStock,
                selectedWarehouse.warehouseId,
                sellerId,
                bookId,
                quantity,
                session
            );

            if (!updatedWarehouseStock) {
                console.log(
                    `❌ Failed to deduct stock - insufficient or warehouse mismatch`
                );
            } else {
                console.log(
                    `✅ Stock deducted successfully. Remaining: ${updatedWarehouseStock.quantity}`
                );
            }

            // If first warehouse fails, try fallback warehouses
            if (
                !updatedWarehouseStock &&
                warehouseSelection.fallbacks.length > 0
            ) {
                console.log(`⚠️ Primary warehouse failed, trying fallbacks...`);
                for (const fallbackWarehouse of warehouseSelection.fallbacks) {
                    console.log(
                        `   Trying fallback: ${fallbackWarehouse.warehouseName}`
                    );
                    const fallbackStock = await validateAndLockWarehouseStock(
                        WarehouseStock,
                        fallbackWarehouse.warehouseId,
                        sellerId,
                        bookId,
                        quantity,
                        session
                    );
                    if (fallbackStock) {
                        console.log(
                            `   ✅ Fallback succeeded: ${fallbackWarehouse.warehouseName}`
                        );
                        selectedWarehouse.warehouseId =
                            fallbackWarehouse.warehouseId;
                        selectedWarehouse.warehouseName =
                            fallbackWarehouse.warehouseName;
                        selectedWarehouse.distance = fallbackWarehouse.distance;
                        updatedWarehouseStock = fallbackStock;
                        break;
                    }
                }
            }

            if (!updatedWarehouseStock) {
                throw new Error(
                    `Kho ${selectedWarehouse.warehouseName} không đủ stock cho ${bookId}. Có người khác vừa mua hàng.`
                );
            }

            const quantityBefore = updatedWarehouseStock.quantity + quantity; // quantity đã bị trừ
            const quantityAfter = updatedWarehouseStock.quantity;

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
                warehouseId: selectedWarehouse.warehouseId,
                warehouseName: selectedWarehouse.warehouseName,
                type: 'order_create',
                quantity,
                quantityBefore,
                quantityAfter,
                orderId,
                reason: `Order confirm ${orderId}`,
                performedBy: userId,
                status: 'success',
            });

            await log.save({ session });

            // Save selected warehouse for order update
            if (!warehouseSelections[sellerId]) {
                warehouseSelections[sellerId] = {};
            }
            warehouseSelections[sellerId][bookId] = selectedWarehouse;
        }

        // Bước 2: Update Order status to confirmed
        order.status = 'confirmed';

        // ✅ FIX: Get warehouse from FIRST ITEM (not just first seller)
        // If multiple items, use first item's warehouse
        const firstItem = order.items[0];
        const firstItemSellerId = firstItem.sellerId;
        const firstItemBookId = firstItem.bookId;
        const selectedWarehouseForOrder =
            warehouseSelections[firstItemSellerId]?.[firstItemBookId];

        if (selectedWarehouseForOrder) {
            order.warehouseId = selectedWarehouseForOrder.warehouseId;
            order.warehouseName = selectedWarehouseForOrder.warehouseName;
        }
        order.handledBy = {
            sellerId: seller._id,
            storeName: seller.storeName,
        };

        // Add system note
        order.notes = order.notes || [];
        order.notes.push({
            timestamp: new Date(),
            message: `Seller ${seller.storeName} đã xác nhận đơn hàng`,
            addedBy: 'system',
        });

        await order.save({ session });

        // Commit
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message:
                'Xác nhận đơn hàng thành công. Stock đã được trừ (ATOMIC).',
            data: order,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(400).json({
            success: false,
            message: err.message,
            type: err.message.includes('ATOMIC') ? 'race_condition' : 'error',
        });
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

// 6️⃣ HỈ DUYỆT / TỪ CHỐI HOÀN HÀNG (GỌI BỞI SELLER)
/**
 * Xử lý return request từ khách hàng
 * - Nếu duyệt: return status → approved, hoàn stock, xác nhận hoàn tiền
 * - Nếu từ chối: return status → rejected
 */
exports.approveReturn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;
        const { approved = true, reason } = req.body; // approved: true/false
        const userId = req.user?.userId;

        const seller = await SellerProfile.findOne({ userId }).session(session);
        if (!seller) {
            throw new Error('Bạn không phải là seller');
        }

        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        if (order.status !== 'return_initiated') {
            throw new Error(
                `Không thể xử lý return từ status=${order.status}. Phải là return_initiated`
            );
        }

        if (approved) {
            // DUYỆT HOÀN HÀNG: hoàn stock + xác nhận hoàn tiền

            // Bước 1: Hoàn stock - từng item
            const orderLogs = await WarehouseLog.find({
                orderId,
                type: 'order_create',
            }).session(session);

            for (const log of orderLogs) {
                const { sellerId, bookId, warehouseId, quantity } = log;

                // Tìm WarehouseStock để hoàn
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
                const returnLog = new WarehouseLog({
                    sellerId,
                    bookId,
                    warehouseId,
                    warehouseName: warehouseStock.warehouseName,
                    type: 'return_refund',
                    quantity,
                    quantityBefore,
                    quantityAfter,
                    orderId,
                    reason: `Hoàn hàng từ ${orderId}`,
                    performedBy: userId,
                    status: 'success',
                });

                await returnLog.save({ session });
            }

            // Bước 2: Update Order
            order.status = 'returned';
            order.return.status = 'approved';
            order.return.approvedAt = new Date();
            order.paymentStatus = 'refunded';
            order.return.refundAmount = order.totalAmount;

            order.notes = order.notes || [];
            order.notes.push({
                timestamp: new Date(),
                message: `Seller ${seller.storeName} đã duyệt hoàn hàng. Hoàn tiền: ${order.totalAmount}₫`,
                addedBy: 'seller',
            });
        } else {
            // TỪ CHỐI HOÀN HÀNG
            order.return.status = 'rejected';
            order.notes = order.notes || [];
            order.notes.push({
                timestamp: new Date(),
                message: `Seller ${
                    seller.storeName
                } từ chối hoàn hàng. Lý do: ${reason || 'Không rõ'}`,
                addedBy: 'seller',
            });
        }

        await order.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: approved
                ? 'Duyệt hoàn hàng thành công. Stock đã được hoàn lại.'
                : 'Từ chối hoàn hàng thành công.',
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

module.exports = exports;
