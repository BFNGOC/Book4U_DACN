/**
 * ============================================================
 * ORDER DETAIL SELLER CONTROLLER
 * ============================================================
 *
 * Quản lý OrderDetail từ phía Seller
 *
 * FILE: Server/src/controllers/orderDetailSellerController.js
 */

const OrderDetail = require('../models/orderDetailModel');
const Order = require('../models/orderModel');
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

/**
 * ✅ [GET] /api/orders/seller/details
 *
 * Danh sách OrderDetail của seller
 * Thay thế getSellerOrders (query Orders)
 */
exports.getSellerOrderDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;

        // Lấy seller profile
        const seller = await SellerProfile.findOne({ userId });
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập',
            });
        }

        // ✅ Query OrderDetail thay vì Order
        const query = { sellerId: seller._id };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [orderDetails, total] = await Promise.all([
            OrderDetail.find(query)
                .populate(
                    'mainOrderId',
                    'profileId totalAmount paymentStatus paymentMethod createdAt'
                )
                .populate(
                    'mainOrderId.profileId',
                    'firstName lastName primaryPhone'
                )
                .populate('items.bookId', 'title slug images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            OrderDetail.countDocuments(query),
        ]);

        // ✅ Thêm warehouse info từ seller.warehouses
        const orderDetailsWithWarehouse = orderDetails.map((orderDetail) => {
            const detail = orderDetail.toObject();
            if (detail.warehouseId) {
                const warehouse = seller.warehouses.find(
                    (w) => w._id.toString() === detail.warehouseId.toString()
                );
                if (warehouse) {
                    detail.warehouseId = {
                        _id: warehouse._id,
                        name: warehouse.name,
                        street: warehouse.street,
                        ward: warehouse.ward,
                        district: warehouse.district,
                        province: warehouse.province,
                        managerName: warehouse.managerName,
                        managerPhone: warehouse.managerPhone,
                    };
                }
            }
            return detail;
        });

        res.status(200).json({
            success: true,
            data: orderDetailsWithWarehouse,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

/**
 * ✅ [GET] /api/orders/seller/details/:orderDetailId
 *
 * Chi tiết OrderDetail
 */
exports.getSellerOrderDetailInfo = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderDetailId } = req.params;

        // Lấy seller
        const seller = await SellerProfile.findOne({ userId });
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập',
            });
        }

        // ✅ Lấy OrderDetail
        const orderDetail = await OrderDetail.findById(orderDetailId)
            .populate(
                'mainOrderId',
                'profileId totalAmount paymentStatus paymentMethod'
            )
            .populate(
                'mainOrderId.profileId',
                'firstName lastName primaryPhone email'
            )
            .populate('items.bookId', 'title slug images author')
            .populate('sellerId', 'storeName');

        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tìm thấy',
            });
        }

        // Verify ownership
        if (orderDetail.sellerId._id.toString() !== seller._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem OrderDetail này',
            });
        }

        // ✅ Thêm warehouse info từ seller.warehouses
        const detail = orderDetail.toObject();
        if (detail.warehouseId) {
            const warehouse = seller.warehouses.find(
                (w) => w._id.toString() === detail.warehouseId.toString()
            );
            if (warehouse) {
                detail.warehouseId = {
                    _id: warehouse._id,
                    name: warehouse.name,
                    street: warehouse.street,
                    ward: warehouse.ward,
                    district: warehouse.district,
                    province: warehouse.province,
                    managerName: warehouse.managerName,
                    managerPhone: warehouse.managerPhone,
                };
            }
        }

        res.json({
            success: true,
            data: detail,
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

/**
 * ✅ [POST] /api/orders/seller/details/:orderDetailId/confirm
 *
 * Seller xác nhận OrderDetail + trừ stock
 */
exports.confirmOrderDetail = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.userId;
        const { orderDetailId } = req.params;
        let { customerLocation } = req.body;

        // Verify seller
        const seller = await SellerProfile.findOne({ userId }).session(session);
        if (!seller) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'Bạn không phải là seller',
            });
        }

        // Get OrderDetail
        const orderDetail = await OrderDetail.findById(orderDetailId).session(
            session
        );
        if (!orderDetail) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tìm thấy',
            });
        }

        // Verify ownership
        if (orderDetail.sellerId.toString() !== seller._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xác nhận OrderDetail này',
            });
        }

        // Check status
        if (orderDetail.status !== 'pending') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Không thể xác nhận OrderDetail có status=${orderDetail.status}. Phải là pending`,
            });
        }

        // ✅ GEOCODING nếu cần
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

            // Tìm warehouses
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
                    message: `Sản phẩm không tìm thấy trong kho`,
                });
            }

            // Chọn warehouse gần nhất
            const warehouseSelection = selectNearestWarehouse({
                warehouseStocks,
                customerLocation,
                requiredQuantity: quantity,
            });

            const selectedWarehouse = warehouseSelection.selected;

            // ⚠️ ATOMIC: Trừ stock
            let updatedStock = await validateAndLockWarehouseStock(
                WarehouseStock,
                selectedWarehouse.warehouseId,
                seller._id,
                bookId,
                quantity,
                session
            );

            // Try fallback if primary fails
            if (!updatedStock && warehouseSelection.fallbacks.length > 0) {
                for (const fallback of warehouseSelection.fallbacks) {
                    updatedStock = await validateAndLockWarehouseStock(
                        WarehouseStock,
                        fallback.warehouseId,
                        seller._id,
                        bookId,
                        quantity,
                        session
                    );
                    if (updatedStock) {
                        item.warehouseId = fallback.warehouseId;
                        break;
                    }
                }
            } else if (updatedStock) {
                item.warehouseId = selectedWarehouse.warehouseId;
            }

            if (!updatedStock) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Stock không đủ cho sản phẩm`,
                });
            }

            // Cập nhật Book.stock
            await Book.updateOne(
                { _id: bookId },
                { $inc: { stock: -quantity } },
                { session }
            );

            // Tính quantityBefore (trước khi trừ)
            const quantityBefore = updatedStock.quantity + quantity;
            const quantityAfter = updatedStock.quantity;

            // Ghi log với đúng cấu trúc WarehouseLog
            const warehouseName =
                (
                    await SellerProfile.findById(seller._id).session(session)
                )?.warehouses?.find(
                    (w) => w._id.toString() === item.warehouseId.toString()
                )?.name || '';

            const log = new WarehouseLog({
                sellerId: seller._id,
                bookId,
                warehouseId: item.warehouseId,
                warehouseName,
                type: 'order_create', // Loại giao dịch: tạo đơn
                quantity, // Số lượng thay đổi
                quantityBefore, // Tồn kho trước
                quantityAfter, // Tồn kho sau
                orderId: orderDetail.mainOrderId,
                reason: `Order confirm ${orderDetail.mainOrderId}`,
                performedBy: userId, // Người thực hiện
                status: 'success',
            });

            await log.save({ session });
        }

        // Update OrderDetail
        orderDetail.status = 'confirmed';
        orderDetail.confirmedAt = new Date();
        orderDetail.paymentStatus = 'paid'; // Nếu payment đã done
        if (orderDetail.items.length > 0) {
            orderDetail.warehouseId = orderDetail.items[0].warehouseId;
        }
        await orderDetail.save({ session });

        // ✅ Check nếu tất cả OrderDetail của MainOrder đều confirmed
        const mainOrder = await Order.findById(orderDetail.mainOrderId).session(
            session
        );
        const allOrderDetails = await OrderDetail.find({
            mainOrderId: mainOrder._id,
        }).session(session);

        const allConfirmed = allOrderDetails.every(
            (od) => od.status === 'confirmed'
        );
        if (allConfirmed) {
            mainOrder.status = 'confirmed';
            await mainOrder.save({ session });
            console.log(
                `✅ All OrderDetails for MainOrder ${mainOrder._id} are confirmed`
            );
        }

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Xác nhận đơn hàng thành công',
            data: orderDetail,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    } finally {
        session.endSession();
    }
};

/**
 * ✅ [POST] /api/orders/seller/details/:orderDetailId/ship
 *
 * Seller cập nhật vận chuyển (gọi createDeliveryStages nếu liên tỉnh)
 */
exports.shipOrderDetail = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderDetailId } = req.params;
        const {
            trackingNumber,
            shippingMethod,
            carrierName,
            estimatedDeliveryDate,
        } = req.body;

        // Verify seller
        const seller = await SellerProfile.findOne({ userId });
        if (!seller) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không phải là seller',
            });
        }

        // Get OrderDetail
        const orderDetail = await OrderDetail.findById(orderDetailId).populate(
            'mainOrderId'
        );
        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tìm thấy',
            });
        }

        // Verify ownership
        if (orderDetail.sellerId.toString() !== seller._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền ship OrderDetail này',
            });
        }

        // Check status (phải confirmed hoặc packing mới được ship)
        if (!['confirmed', 'packing'].includes(orderDetail.status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể ship OrderDetail có status=${orderDetail.status}`,
            });
        }

        // Lấy warehouse info
        const warehouse = seller.warehouses.find(
            (w) =>
                w._id.toString() === (orderDetail.warehouseId?.toString() || '')
        );

        // Lấy customer location từ MainOrder
        const mainOrder = await Order.findById(
            orderDetail.mainOrderId._id
        ).populate('profileId');

        if (!mainOrder) {
            return res.status(404).json({
                success: false,
                message: 'MainOrder không tìm thấy',
            });
        }

        // ========== MULTI-STAGE DELIVERY LOGIC ==========
        // Nếu warehouse province !== customer province → liên tỉnh
        const fromWarehouse = {
            warehouseId: orderDetail.warehouseId,
            name: warehouse?.name || 'Warehouse',
            address: warehouse?.street || '',
            province: warehouse?.province || '',
            latitude: warehouse?.location?.latitude,
            longitude: warehouse?.location?.longitude,
        };

        const toCustomer = {
            address: orderDetail.shippingAddress?.address || '',
            province: orderDetail.shippingAddress?.province || '',
            // Geocoded coordinates từ confirm endpoint
            latitude: 0, // TODO: lấy từ customer location history
            longitude: 0, // TODO: lấy từ customer location history
            customerName: orderDetail.shippingAddress?.fullName || '',
            customerPhone: orderDetail.shippingAddress?.phone || '',
        };

        // ✅ Nếu liên tỉnh → tạo delivery stages
        if (
            fromWarehouse.province &&
            toCustomer.province &&
            fromWarehouse.province !== toCustomer.province
        ) {
            const deliveryStageRes = await createDeliveryStagesHelper(
                orderDetailId,
                fromWarehouse,
                toCustomer
            );

            if (!deliveryStageRes.success) {
                return res.status(400).json(deliveryStageRes);
            }

            // Update status thành in_delivery_stage (không còn là shipping)
            orderDetail.status = 'in_delivery_stage';
            orderDetail.deliveryRouteNotes = `Liên tỉnh: ${fromWarehouse.province} → ${toCustomer.province}`;
        } else {
            // Nội tỉnh → status bình thường
            orderDetail.status = 'shipping';
        }

        orderDetail.shippedAt = new Date();
        orderDetail.trackingNumber = trackingNumber;
        orderDetail.shippingMethod = shippingMethod;
        if (carrierName) {
            orderDetail.carrierInfo = {
                carrierName,
            };
        }
        if (estimatedDeliveryDate) {
            orderDetail.estimatedDeliveryDate = estimatedDeliveryDate;
        }

        await orderDetail.save();

        res.json({
            success: true,
            message: 'Cập nhật vận chuyển thành công',
            data: {
                ...orderDetail.toObject(),
                isMultiStageDelivery:
                    fromWarehouse.province !== toCustomer.province,
            },
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

/**
 * ✅ [POST] /api/orders/seller/details/:orderDetailId/cancel
 *
 * Seller huỷ OrderDetail
 */
exports.cancelOrderDetail = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.userId;
        const { orderDetailId } = req.params;
        const { reason } = req.body;

        // Verify seller
        const seller = await SellerProfile.findOne({ userId }).session(session);
        if (!seller) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'Bạn không phải là seller',
            });
        }

        // Get OrderDetail
        const orderDetail = await OrderDetail.findById(orderDetailId).session(
            session
        );
        if (!orderDetail) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tìm thấy',
            });
        }

        // Verify ownership
        if (orderDetail.sellerId.toString() !== seller._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền huỷ OrderDetail này',
            });
        }

        // Chỉ được huỷ nếu chưa ship
        if (['shipping', 'delivered'].includes(orderDetail.status)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Không thể huỷ OrderDetail đã ${orderDetail.status}`,
            });
        }

        // Nếu đã confirmed (đã trừ stock), hoàn lại stock
        if (orderDetail.status === 'confirmed') {
            // Lấy log để biết từng item đã xuất từ kho nào
            const orderLogs = await WarehouseLog.find({
                orderId: orderDetail.mainOrderId,
                type: 'order_create',
            }).session(session);

            for (const log of orderLogs) {
                // Chỉ hoàn lại items của OrderDetail này
                const item = orderDetail.items.find(
                    (i) => i.bookId.toString() === log.bookId.toString()
                );
                if (!item) continue;

                const { warehouseId, bookId, quantity } = log;

                // Restore warehouse stock
                const warehouseStock = await WarehouseStock.findOne({
                    warehouseId,
                    bookId,
                    sellerId: seller._id,
                }).session(session);

                if (warehouseStock) {
                    const quantityBefore = warehouseStock.quantity;
                    const quantityAfter = quantityBefore + quantity;

                    warehouseStock.quantity = quantityAfter;
                    warehouseStock.lastUpdatedStock = new Date();
                    await warehouseStock.save({ session });
                }

                // Restore book stock
                await Book.updateOne(
                    { _id: bookId },
                    { $inc: { stock: quantity, soldCount: -1 } },
                    { session }
                );

                // Tạo log hoàn với đúng cấu trúc
                const cancelLog = new WarehouseLog({
                    sellerId: seller._id,
                    bookId,
                    warehouseId,
                    warehouseName: warehouseStock?.warehouseName || '',
                    type: 'order_cancel',
                    quantity,
                    quantityBefore: warehouseStock?.quantity || 0,
                    quantityAfter: (warehouseStock?.quantity || 0) + quantity,
                    orderId: orderDetail.mainOrderId,
                    reason: reason || `Cancel OrderDetail ${orderDetail._id}`,
                    performedBy: userId,
                    status: 'success',
                });

                await cancelLog.save({ session });
            }
        }

        // Update status
        orderDetail.status = 'cancelled';
        orderDetail.cancelledAt = new Date();
        orderDetail.internalNotes = reason || 'Seller cancelled';
        await orderDetail.save({ session });

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Huỷ OrderDetail thành công',
            data: orderDetail,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    } finally {
        session.endSession();
    }
};

/**
 * Helper function: Tạo delivery stages cho multi-stage delivery
 * (gọi từ shipOrderDetail)
 */
async function createDeliveryStagesHelper(
    orderDetailId,
    fromWarehouse,
    toCustomer
) {
    try {
        const DeliveryStage = require('../models/deliveryStageModel');
        const orderDetail = await OrderDetail.findById(orderDetailId).populate(
            'mainOrderId'
        );

        if (!orderDetail) {
            return {
                success: false,
                message: 'OrderDetail không tồn tại',
                statusCode: 404,
            };
        }

        const stages = [];
        const isInterProvincial =
            fromWarehouse.province !== toCustomer.province;

        if (!isInterProvincial) {
            // Nội tỉnh: 1 stage
            const stage = new DeliveryStage({
                mainOrderId: orderDetail.mainOrderId._id,
                orderDetailId: orderDetail._id,
                stageNumber: 1,
                totalStages: 1,
                isLastStage: true,

                fromLocation: {
                    locationType: 'warehouse',
                    warehouseId: fromWarehouse.warehouseId,
                    warehouseName: fromWarehouse.name,
                    address: fromWarehouse.address,
                    province: fromWarehouse.province,
                    latitude: fromWarehouse.latitude || 0,
                    longitude: fromWarehouse.longitude || 0,
                },

                toLocation: {
                    locationType: 'customer',
                    address: toCustomer.address,
                    province: toCustomer.province,
                    latitude: toCustomer.latitude || 0,
                    longitude: toCustomer.longitude || 0,
                    contactName: toCustomer.customerName,
                    contactPhone: toCustomer.customerPhone,
                },

                status: 'pending',
            });

            await stage.save();
            stages.push(stage._id);
        } else {
            // Liên tỉnh: 3 stages
            const stage1 = new DeliveryStage({
                mainOrderId: orderDetail.mainOrderId._id,
                orderDetailId: orderDetail._id,
                stageNumber: 1,
                totalStages: 3,
                isLastStage: false,

                fromLocation: {
                    locationType: 'warehouse',
                    warehouseId: fromWarehouse.warehouseId,
                    warehouseName: fromWarehouse.name,
                    address: fromWarehouse.address,
                    province: fromWarehouse.province,
                    latitude: fromWarehouse.latitude || 0,
                    longitude: fromWarehouse.longitude || 0,
                },

                toLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${fromWarehouse.province}`,
                    address: `Trung tâm chuyển tiếp - ${fromWarehouse.province}`,
                    province: fromWarehouse.province,
                },

                status: 'pending',
            });

            const stage2 = new DeliveryStage({
                mainOrderId: orderDetail.mainOrderId._id,
                orderDetailId: orderDetail._id,
                stageNumber: 2,
                totalStages: 3,
                isLastStage: false,

                fromLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${fromWarehouse.province}`,
                    address: `Trung tâm chuyển tiếp - ${fromWarehouse.province}`,
                    province: fromWarehouse.province,
                },

                toLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${toCustomer.province}`,
                    address: `Trung tâm chuyển tiếp - ${toCustomer.province}`,
                    province: toCustomer.province,
                },

                status: 'pending',
            });

            const stage3 = new DeliveryStage({
                mainOrderId: orderDetail.mainOrderId._id,
                orderDetailId: orderDetail._id,
                stageNumber: 3,
                totalStages: 3,
                isLastStage: true,

                fromLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${toCustomer.province}`,
                    address: `Trung tâm chuyển tiếp - ${toCustomer.province}`,
                    province: toCustomer.province,
                },

                toLocation: {
                    locationType: 'customer',
                    address: toCustomer.address,
                    province: toCustomer.province,
                    latitude: toCustomer.latitude || 0,
                    longitude: toCustomer.longitude || 0,
                    contactName: toCustomer.customerName,
                    contactPhone: toCustomer.customerPhone,
                },

                status: 'pending',
            });

            await Promise.all([stage1.save(), stage2.save(), stage3.save()]);
            stages.push(stage1._id, stage2._id, stage3._id);
        }

        // Update OrderDetail
        orderDetail.deliveryStages = stages;
        orderDetail.currentStageIndex = 0;
        orderDetail.fromProvince = fromWarehouse.province;
        orderDetail.toProvince = toCustomer.province;
        orderDetail.isInterProvincial = isInterProvincial;
        await orderDetail.save();

        return {
            success: true,
            data: {
                stages,
                isInterProvincial,
                totalStages: stages.length,
            },
        };
    } catch (err) {
        console.error('❌ Lỗi tạo delivery stages:', err);
        return {
            success: false,
            message: err.message,
            statusCode: 500,
        };
    }
}

module.exports = exports;
