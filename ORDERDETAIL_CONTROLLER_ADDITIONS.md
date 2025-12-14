/\*\*

-   ============================================================
-   UPDATE FOR orderManagementController.js
-   ============================================================
-
-   Các thay đổi cần thêm để tạo OrderDetail
-
-   FILE: Server/src/controllers/orderManagementController.js
    \*/

// ✅ THÊM VÀO ĐẦU FILE (imports)
const OrderDetail = require('../models/orderDetailModel');

/\*\*

-   ✅ THÊM FUNCTION MỚI: TẠO ORDER DETAIL PER SELLER
-
-   Được gọi từ createOrder() để tạo sub-orders
    _/
    exports.createOrderDetailsForMultiSeller = async (mainOrderId, items, shippingAddress, session) => {
    /\*\*
    _ Tạo OrderDetail cho mỗi seller \*
    _ Input:
    _ - mainOrderId: ID của MainOrder
    _ - items: tất cả items của order
    _ - shippingAddress: địa chỉ giao hàng
    _ - session: mongoose session (để transaction)
    _
    _ Output:
    _ - Array của OrderDetail.\_id
    \*/

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
            const subtotal = sellerItems.reduce((sum, item) =>
                sum + (item.price * item.quantity),
                0
            );

            // Tạo OrderDetail
            const orderDetail = new OrderDetail({
                mainOrderId,
                sellerId,
                items: sellerItems,
                subtotal,
                totalAmount: subtotal, // Chỉ hàng, chưa tính vận chuyển
                shippingAddress,
                status: 'pending',      // Chờ seller xác nhận
                paymentStatus: 'unpaid', // Sẽ update khi thanh toán
            });

            const savedDetail = await orderDetail.save({ session });
            orderDetailIds.push(savedDetail._id);

            console.log(`✅ Created OrderDetail for seller ${sellerId}: ${savedDetail._id}`);
        }

        return orderDetailIds;

    };

/\*\*

-   ✅ MODIFY EXISTING: createOrder()
-
-   Thêm logic tạo OrderDetail
    \*/

// CẬP NHẬT HÀM createOrder - THÊM SECTION NÀY:

// Sau khi tạo xong MainOrder (inside createOrder function):

/\*
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

\*/

/\*\*

-   ✅ THÊM FUNCTION MỚI: confirmOrderDetail (GỌI BỞI SELLER)
-
-   Khi seller xác nhận, update OrderDetail + trừ stock
-
-   API: POST /api/orders/details/:orderDetailId/confirm
    \*/
    exports.confirmOrderDetail = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

        try {
            const { orderDetailId } = req.params;
            let { customerLocation } = req.body;
            const userId = req.user?.userId;

            // Lấy seller profile
            const seller = await SellerProfile.findOne({ userId }).session(session);
            if (!seller) {
                await session.abortTransaction();
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không phải là seller'
                });
            }

            // Lấy OrderDetail
            const orderDetail = await OrderDetail.findById(orderDetailId).session(session);
            if (!orderDetail) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: 'OrderDetail không tồn tại'
                });
            }

            // Verify seller owns this OrderDetail
            if (orderDetail.sellerId.toString() !== seller._id.toString()) {
                await session.abortTransaction();
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xác nhận đơn hàng này'
                });
            }

            // Check status
            if (orderDetail.status !== 'pending') {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Không thể xác nhận OrderDetail có status=${orderDetail.status}. Phải là pending`
                });
            }

            // ✅ GEOCODE nếu cần
            if (!customerLocation?.latitude || !customerLocation?.longitude) {
                const addressToGeocode =
                    customerLocation?.address ||
                    orderDetail.shippingAddress?.address ||
                    'TP. Hồ Chí Minh';

                try {
                    const geocoded = await geocodeAddress(addressToGeocode);
                    customerLocation = {
                        latitude: geocoded.latitude,
                        longitude: geocoded.longitude,
                        address: geocoded.address,
                    };
                } catch (error) {
                    // Fallback
                    customerLocation = {
                        latitude: 10.7769,
                        longitude: 106.7009,
                        address: 'TP. Hồ Chí Minh (Default)',
                    };
                }
            }

            // ✅ TRỪ STOCK: Xử lý từng item
            for (const item of orderDetail.items) {
                const { bookId, quantity } = item;

                // Tìm warehouses có hàng (của seller này)
                const warehouseStocks = await getWarehouseStocksWithLocation({
                    WarehouseStock,
                    SellerProfile,
                    sellerId: seller._id,
                    bookId,
                    session,
                });

                if (warehouseStocks.length === 0) {
                    await session.abortTransaction();
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm ${bookId} không tìm thấy trong kho`
                    });
                }

                // Chọn warehouse gần nhất
                const warehouseSelection = selectNearestWarehouse({
                    warehouseStocks,
                    customerLocation,
                    requiredQuantity: quantity,
                });

                const selectedWarehouse = warehouseSelection.selected;

                // ATOMIC: Trừ stock
                const updatedStock = await validateAndLockWarehouseStock(
                    WarehouseStock,
                    selectedWarehouse.warehouseId,
                    seller._id,
                    bookId,
                    quantity,
                    session
                );

                if (!updatedStock) {
                    // Try fallback warehouses
                    let foundWarehouse = false;
                    for (const fallback of warehouseSelection.fallbacks) {
                        const fallbackUpdate = await validateAndLockWarehouseStock(
                            WarehouseStock,
                            fallback.warehouseId,
                            seller._id,
                            bookId,
                            quantity,
                            session
                        );
                        if (fallbackUpdate) {
                            foundWarehouse = true;
                            item.warehouseId = fallback.warehouseId;
                            break;
                        }
                    }

                    if (!foundWarehouse) {
                        await session.abortTransaction();
                        return res.status(400).json({
                            success: false,
                            message: `Stock không đủ cho sản phẩm ${bookId}`
                        });
                    }
                } else {
                    item.warehouseId = selectedWarehouse.warehouseId;
                }

                // Cập nhật Book.stock
                await Book.updateOne(
                    { _id: bookId },
                    { $inc: { stock: -quantity } },
                    { session }
                );

                // Ghi log
                await WarehouseLog.create([{
                    warehouseId: item.warehouseId,
                    bookId,
                    transactionType: 'order_confirmed',
                    quantityChange: -quantity,
                    orderId: orderDetail.mainOrderId,
                    orderDetailId: orderDetail._id,
                    sellerId: seller._id,
                }], { session });
            }

            // ✅ UPDATE STATUS
            orderDetail.status = 'confirmed';
            orderDetail.confirmedAt = new Date();
            orderDetail.warehouseId = orderDetail.items[0]?.warehouseId;
            await orderDetail.save({ session });

            // ✅ UPDATE MAIN ORDER (nếu tất cả OrderDetail đều confirmed)
            const mainOrder = await Order.findById(orderDetail.mainOrderId).session(session);
            const allOrderDetails = await OrderDetail.find(
                { mainOrderId: mainOrder._id }
            ).session(session);

            const allConfirmed = allOrderDetails.every(od => od.status === 'confirmed');
            if (allConfirmed) {
                mainOrder.status = 'confirmed';
                await mainOrder.save({ session });
            }

            await session.commitTransaction();

            res.status(200).json({
                success: true,
                message: 'Xác nhận đơn hàng thành công',
                data: orderDetail,
            });

        } catch (err) {
            await session.abortTransaction();
            console.error('Error:', err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        } finally {
            session.endSession();
        }

    };

/\*\*

-   ✅ THÊM FUNCTION MỚI: shipOrderDetail (GỌI BỞI SELLER)
-
-   Khi seller ship hàng
-
-   API: POST /api/orders/details/:orderDetailId/ship
    \*/
    exports.shipOrderDetail = async (req, res) => {
    try {
    const { orderDetailId } = req.params;
    const { trackingNumber, shippingMethod, carrierName, estimatedDeliveryDate } = req.body;
    const userId = req.user?.userId;

            // Verify seller
            const seller = await SellerProfile.findOne({ userId });
            if (!seller) {
                return res.status(403).json({
                    success: false,
                    message: 'Không phải seller'
                });
            }

            // Get OrderDetail
            const orderDetail = await OrderDetail.findById(orderDetailId);
            if (!orderDetail) {
                return res.status(404).json({
                    success: false,
                    message: 'OrderDetail không tìm thấy'
                });
            }

            // Verify ownership
            if (orderDetail.sellerId.toString() !== seller._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền ship đơn hàng này'
                });
            }

            // Must be confirmed
            if (!['confirmed', 'packing'].includes(orderDetail.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể ship OrderDetail có status=${orderDetail.status}`
                });
            }

            // Update
            orderDetail.status = 'shipping';
            orderDetail.shippedAt = new Date();
            orderDetail.trackingNumber = trackingNumber;
            orderDetail.shippingMethod = shippingMethod;
            orderDetail.carrierInfo = {
                carrierName,
            };
            orderDetail.estimatedDeliveryDate = estimatedDeliveryDate;

            await orderDetail.save();

            res.json({
                success: true,
                message: 'Cập nhật vận chuyển thành công',
                data: orderDetail,
            });

        } catch (err) {
            console.error('Error:', err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }

    };

/\*\*

-   ✅ MODIFY EXISTING: Payment callbacks
-
-   Khi thanh toán thành công, update cả MainOrder + tất cả OrderDetails
    \*/

// CẬP NHẬT HÀM handleVNPayCallback hoặc handleMomoCallback:

/\*
// Cập nhật MainOrder
mainOrder.paymentStatus = 'paid';
await mainOrder.save();

    // ✅ MỚI: Cập nhật tất cả OrderDetails
    await OrderDetail.updateMany(
        { mainOrderId: mainOrder._id },
        { paymentStatus: 'paid' }
    );

\*/
