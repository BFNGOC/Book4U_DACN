const DeliveryStage = require('../models/deliveryStageModel');
const Order = require('../models/orderModel');
const OrderDetail = require('../models/orderDetailModel');
const { ShipperProfile, SellerProfile } = require('../models/profileModel');
const ShipperCoverageArea = require('../models/shipperCoverageAreaModel');
const mongoose = require('mongoose');

/**
 * ============================================================
 * MULTI-STAGE DELIVERY CONTROLLER
 * ============================================================
 * Quản lý vận chuyển liên tỉnh (TPHCM → HN)
 * - Tạo delivery stages
 * - Gán shipper theo khu vực
 * - Quản lý trạng thái từng giai đoạn
 * - Tracking vị trí realtime
 */

/**
 * [POST] /api/delivery/create-stages
 * Tạo các giai đoạn vận chuyển khi order được xác nhận
 *
 * Body: {
 *   orderDetailId: ObjectId,
 *   fromWarehouse: { address, province, latitude, longitude },
 *   toCustomer: { address, province, latitude, longitude }
 * }
 */
exports.createDeliveryStages = async (req, res) => {
    try {
        const { orderDetailId } = req.body;

        // Validate input
        if (!orderDetailId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu orderDetailId',
            });
        }

        // Lấy order detail
        const orderDetail = await OrderDetail.findById(orderDetailId).populate(
            'mainOrderId sellerId'
        );
        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tồn tại',
            });
        }

        // ✅ Lấy thông tin warehouse từ seller profile
        const seller = await SellerProfile.findById(orderDetail.sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller không tồn tại',
            });
        }

        // ✅ Tìm warehouse từ warehouseId
        const warehouse = seller.warehouses.find(
            (w) => w._id.toString() === orderDetail.warehouseId.toString()
        );
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Kho hàng không tồn tại',
            });
        }

        // ✅ Xây dựng fromWarehouse object
        const fromWarehouse = {
            warehouseId: warehouse._id,
            name: warehouse.name,
            address: `${warehouse.street}, ${warehouse.ward}, ${warehouse.district}, ${warehouse.province}`,
            province: warehouse.province,
            latitude: warehouse.location?.latitude || 0,
            longitude: warehouse.location?.longitude || 0,
        };

        // ✅ Xây dựng toCustomer object từ shippingAddress
        // Helper function to extract province from address if not in province field
        const extractProvinceFromAddress = (address) => {
            if (!address) return '';
            // Format: "Số nhà, Phường, Quận, Tỉnh/Thành phố"
            const parts = address.split(',').map((p) => p.trim());
            const province = parts[parts.length - 1];
            return province;
        };

        const toCustomer = {
            address: orderDetail.shippingAddress?.address || '',
            province:
                orderDetail.shippingAddress?.province ||
                extractProvinceFromAddress(
                    orderDetail.shippingAddress?.address || ''
                ),
            latitude: 0, // TODO: Lấy từ geolocation nếu có
            longitude: 0,
            customerName: orderDetail.shippingAddress?.fullName || '',
            customerPhone: orderDetail.shippingAddress?.phone || '',
        };

        // ✅ Validate toCustomer.province
        if (!toCustomer.province || toCustomer.province.trim() === '') {
            return res.status(400).json({
                success: false,
                message:
                    'Không thể xác định tỉnh/thành phố của khách hàng từ địa chỉ giao hàng. Vui lòng cập nhật địa chỉ.',
                error: {
                    shippingAddress: orderDetail.shippingAddress,
                    extractedProvince: extractProvinceFromAddress(
                        orderDetail.shippingAddress?.address || ''
                    ),
                },
            });
        }

        // ✅ Gọi helper function tạo stages
        const stages = [];
        const isInterProvincial =
            fromWarehouse.province !== toCustomer.province;

        if (!isInterProvincial) {
            /**
             * CASE 1: GIAO HÀNG NỘI TỈNH
             * Stage 1: Warehouse → Customer (1 shipper)
             */
            console.log(`
🏘️ CREATING SINGLE-STAGE DELIVERY (NỘI TỈNH):
   From: ${fromWarehouse.province} (${fromWarehouse.name})
   To: ${toCustomer.province} (Customer)
   Address: ${toCustomer.address}
            `);

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
                    latitude: fromWarehouse.latitude,
                    longitude: fromWarehouse.longitude,
                },

                toLocation: {
                    locationType: 'customer',
                    address: toCustomer.address,
                    province: toCustomer.province,
                    latitude: toCustomer.latitude,
                    longitude: toCustomer.longitude,
                    contactName: toCustomer.customerName,
                    contactPhone: toCustomer.customerPhone,
                },

                status: 'pending',
            });

            await stage.save();
            stages.push(stage._id);

            console.log(`✅ Created 1 stage for nội tỉnh delivery:
   Stage 1 (ID: ${stage._id}): ${fromWarehouse.province} → Customer
            `);
        } else {
            /**
             * CASE 2: GIAO HÀNG LIÊN TỈNH
             * Stage 1: Warehouse (Province A) → Transfer Hub (Province A)
             * Stage 2: Transfer Hub (Province A) → Transfer Hub (Province B)
             * Stage 3: Transfer Hub (Province B) → Customer (Province B)
             */
            console.log(`
🚚 CREATING MULTI-STAGE DELIVERY:
   From: ${fromWarehouse.province} (${fromWarehouse.name})
   To: ${toCustomer.province} (Customer)
   Address: ${toCustomer.address}
            `);

            // Stage 1: Local warehouse → Transfer Hub
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
                    latitude: fromWarehouse.latitude,
                    longitude: fromWarehouse.longitude,
                },

                toLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${fromWarehouse.province}`,
                    address: `Transfer Hub Address - ${fromWarehouse.province}`,
                    province: fromWarehouse.province,
                },

                status: 'pending',
            });

            // Stage 2: Regional transfer (Province A → Province B)
            const stage2 = new DeliveryStage({
                mainOrderId: orderDetail.mainOrderId._id,
                orderDetailId: orderDetail._id,
                stageNumber: 2,
                totalStages: 3,
                isLastStage: false,

                fromLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${fromWarehouse.province}`,
                    address: `Transfer Hub Address - ${fromWarehouse.province}`,
                    province: fromWarehouse.province,
                },

                toLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${toCustomer.province}`,
                    address: `Transfer Hub Address - ${toCustomer.province}`,
                    province: toCustomer.province,
                },

                status: 'pending',
                shipperType: 'regional', // Dành cho regional carrier
            });

            // Stage 3: Local delivery (Province B)
            const stage3 = new DeliveryStage({
                mainOrderId: orderDetail.mainOrderId._id,
                orderDetailId: orderDetail._id,
                stageNumber: 3,
                totalStages: 3,
                isLastStage: true,

                fromLocation: {
                    locationType: 'transfer_hub',
                    warehouseName: `Transfer Hub ${toCustomer.province}`,
                    address: `Transfer Hub Address - ${toCustomer.province}`,
                    province: toCustomer.province,
                },

                toLocation: {
                    locationType: 'customer',
                    address: toCustomer.address,
                    province: toCustomer.province,
                    latitude: toCustomer.latitude,
                    longitude: toCustomer.longitude,
                    contactName: toCustomer.customerName,
                    contactPhone: toCustomer.customerPhone,
                },

                status: 'pending',
            });

            // Save all stages
            const savedStages = await Promise.all([
                stage1.save(),
                stage2.save(),
                stage3.save(),
            ]);
            stages.push(...savedStages.map((s) => s._id));

            console.log(`✅ Created 3 stages for liên tỉnh delivery:
   Stage 1 (ID: ${savedStages[0]._id}): ${fromWarehouse.province} → ${fromWarehouse.province}
   Stage 2 (ID: ${savedStages[1]._id}): ${fromWarehouse.province} → ${toCustomer.province}
   Stage 3 (ID: ${savedStages[2]._id}): ${toCustomer.province} → ${toCustomer.province}
            `);
        }

        // Cập nhật OrderDetail
        orderDetail.deliveryStages = stages;
        orderDetail.currentStageIndex = 0;
        orderDetail.fromProvince = fromWarehouse.province;
        orderDetail.toProvince = toCustomer.province;
        orderDetail.isInterProvincial = isInterProvincial;
        orderDetail.status = isInterProvincial
            ? 'in_delivery_stage'
            : 'shipping';
        await orderDetail.save();

        console.log(`
✅ ORDER DETAIL UPDATED:
   Status: ${orderDetail.status}
   DeliveryStages: ${stages.length}
   Current Stage Index: 0
   From Province: ${fromWarehouse.province}
   To Province: ${toCustomer.province}
   Inter-Provincial: ${isInterProvincial}
        `);

        return res.status(201).json({
            success: true,
            message: isInterProvincial
                ? 'Đã tạo 3 giai đoạn vận chuyển liên tỉnh'
                : 'Đã tạo 1 giai đoạn vận chuyển nội tỉnh',
            data: {
                orderDetailId: orderDetail._id,
                stages: stages,
                isInterProvincial: isInterProvincial,
                totalStages: stages.length,
                currentStageIndex: 0,
                deliveryType: isInterProvincial ? 'liên-tỉnh' : 'nội-tỉnh',
                fromProvince: fromWarehouse.province,
                toProvince: toCustomer.province,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi tạo delivery stages:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [GET] /api/delivery/stages/:orderDetailId
 * Lấy tất cả giai đoạn vận chuyển của một order
 */
exports.getDeliveryStages = async (req, res) => {
    try {
        const { orderDetailId } = req.params;

        const orderDetail = await OrderDetail.findById(orderDetailId).populate({
            path: 'deliveryStages',
            select: 'stageNumber status fromLocation toLocation assignedShipperId currentLocation deliveryAttempts createdAt deliveredAt inTransitAt shippingCompany trackingNumber locationHistory',
            populate: {
                path: 'assignedShipperId',
                select: 'firstName lastName primaryPhone currentLocation performance',
            },
        });

        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tồn tại',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                orderDetailId: orderDetail._id,
                stages: orderDetail.deliveryStages || [],
                currentStageIndex: orderDetail.currentStageIndex,
                isInterProvincial: orderDetail.isInterProvincial,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi lấy delivery stages:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/delivery/stages/:stageId/accept
 * Shipper chấp nhận nhận đơn hàng ở giai đoạn này
 */
exports.acceptDeliveryStage = async (req, res) => {
    try {
        const { stageId } = req.params;
        const userId = req.user?.userId;

        // Tìm shipper
        const shipper = await ShipperProfile.findOne({ userId });
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper profile không tồn tại',
            });
        }

        const stage = await DeliveryStage.findById(stageId);
        if (!stage) {
            return res.status(404).json({
                success: false,
                message: 'Giai đoạn vận chuyển không tồn tại',
            });
        }

        // Kiểm tra shipper có quyền không (phải phục vụ khu vực này)
        const coverage = await ShipperCoverageArea.findOne({
            shipperId: shipper._id,
            'coverageAreas.province': stage.toLocation.province,
        });

        if (!coverage && stage.stageNumber > 1) {
            // Stage 2 (liên tỉnh) có thể không cần check
            if (coverage?.shipperType !== 'regional') {
                return res.status(403).json({
                    success: false,
                    message: 'Shipper không phục vụ khu vực này',
                });
            }
        }

        // Cập nhật stage
        stage.assignedShipperId = shipper._id;
        stage.status = 'accepted';
        stage.acceptedAt = new Date();

        await stage.save();

        return res.status(200).json({
            success: true,
            message: 'Đã chấp nhận đơn hàng',
            data: {
                stageId: stage._id,
                status: stage.status,
                acceptedAt: stage.acceptedAt,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi chấp nhận delivery stage:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/delivery/stages/:stageId/pickup
 * Shipper đã lấy hàng từ vị trí cũ
 */
exports.pickupPackage = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { latitude, longitude, address } = req.body;

        const stage = await DeliveryStage.findById(stageId);
        if (!stage) {
            return res.status(404).json({
                success: false,
                message: 'Giai đoạn không tồn tại',
            });
        }

        stage.status = 'picked_up';
        stage.pickedUpAt = new Date();
        stage.currentLocation = {
            latitude,
            longitude,
            address,
            timestamp: new Date(),
        };

        // Thêm vào location history
        stage.locationHistory.push({
            latitude,
            longitude,
            address,
            status: 'package_picked_up',
            description: 'Đã lấy hàng từ kho',
        });

        await stage.save();

        return res.status(200).json({
            success: true,
            message: 'Đã lấy hàng',
            data: {
                stageId: stage._id,
                status: stage.status,
                pickedUpAt: stage.pickedUpAt,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi pickup package:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/delivery/stages/:stageId/location
 * Cập nhật vị trí hiện tại của shipper (realtime tracking)
 */
exports.updateShipperLocation = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { latitude, longitude, address, status } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin vị trí',
            });
        }

        const stage = await DeliveryStage.findById(stageId);
        if (!stage) {
            return res.status(404).json({
                success: false,
                message: 'Giai đoạn không tồn tại',
            });
        }

        // Cập nhật vị trí hiện tại
        stage.currentLocation = {
            latitude,
            longitude,
            address: address || 'Unknown',
            timestamp: new Date(),
        };

        // Cập nhật trạng thái nếu có
        if (status && ['in_transit', 'in_transit_with_gps'].includes(status)) {
            stage.status = status;
            stage.inTransitAt = new Date();
        }

        // Thêm vào location history
        stage.locationHistory.push({
            latitude,
            longitude,
            address,
            status: status || 'in_transit',
            description: `Đang vận chuyển - Vị trí: ${address}`,
        });

        await stage.save();

        // Broadcast location update realtime (nếu dùng WebSocket/Socket.IO)
        // io.to(`order_${stage.mainOrderId}`).emit('location_update', {
        //   stageId,
        //   currentLocation: stage.currentLocation,
        // });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật vị trí thành công',
            data: {
                stageId: stage._id,
                currentLocation: stage.currentLocation,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật location:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/delivery/stages/:stageId/complete
 * Hoàn thành giai đoạn vận chuyển
 * - Nếu là stage cuối: order giao thành công
 * - Nếu không: chuyển sang stage tiếp theo
 */
exports.completeDeliveryStage = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { latitude, longitude, address, notes } = req.body;

        const stage = await DeliveryStage.findById(stageId).populate(
            'mainOrderId orderDetailId'
        );
        if (!stage) {
            return res.status(404).json({
                success: false,
                message: 'Giai đoạn không tồn tại',
            });
        }

        // Status workflow: accepted -> in_transit -> delivered
        if (stage.status === 'accepted') {
            // Lần click đầu: chuyển sang in_transit
            stage.status = 'in_transit';
            stage.inTransitAt = new Date();
        } else if (stage.status === 'in_transit') {
            // Lần click thứ 2: hoàn tất stage
            stage.status = 'delivered';
            stage.deliveredAt = new Date();
        } else {
            return res.status(400).json({
                success: false,
                message:
                    'Giai đoạn không thể chuyển trạng thái từ ' + stage.status,
            });
        }

        // Lưu vị trí nếu có
        if (latitude && longitude) {
            stage.currentLocation = {
                latitude,
                longitude,
                address: address || '',
                timestamp: new Date(),
            };

            stage.locationHistory.push({
                latitude,
                longitude,
                address: address || '',
                status: stage.status,
                description:
                    stage.status === 'in_transit'
                        ? 'Bắt đầu giao hàng'
                        : 'Hoàn tất giai đoạn',
            });
        }

        if (notes) stage.notes = notes;

        await stage.save();

        // Chỉ xử lý next stage khi stage hoàn tất (status = delivered)
        if (stage.status === 'delivered') {
            // Kiểm tra xem có phải stage cuối không
            if (stage.isLastStage) {
                // Cập nhật OrderDetail status thành delivered
                await OrderDetail.findByIdAndUpdate(
                    stage.orderDetailId._id,
                    {
                        status: 'delivered',
                        deliveredAt: new Date(),
                    },
                    { new: true }
                );

                // Kiểm tra xem main order có tất cả orderDetails đã giao không
                const mainOrder = await Order.findById(stage.mainOrderId._id);
                const orderDetails = await OrderDetail.find({
                    mainOrderId: stage.mainOrderId._id,
                });

                const allDelivered = orderDetails.every(
                    (od) => od.status === 'delivered'
                );
                if (allDelivered) {
                    await Order.findByIdAndUpdate(stage.mainOrderId._id, {
                        status: 'delivered',
                        deliveredAt: new Date(),
                    });
                }
            } else {
                // Chuyển sang stage tiếp theo
                const nextStage = await DeliveryStage.findOne({
                    orderDetailId: stage.orderDetailId._id,
                    stageNumber: stage.stageNumber + 1,
                });

                if (nextStage) {
                    // 🆕 Nếu là Stage 2 (regional transfer): AUTO-START ngay (không cần shipper nhận)
                    if (nextStage.stageNumber === 2 && !nextStage.isLastStage) {
                        const ShipperCoverageArea = require('../models/shipperCoverageAreaModel');

                        const fromProvince = nextStage.fromLocation.province;
                        const toProvince = nextStage.toLocation.province;

                        // Tìm regional carrier có cả 2 tỉnh
                        const regionalCarrier =
                            await ShipperCoverageArea.findOne({
                                shipperType: 'regional',
                                status: 'active',
                                'coverageAreas.province': {
                                    $all: [fromProvince, toProvince],
                                },
                            });

                        // ✅ Tự động gán tracking number
                        nextStage.trackingNumber = `STG2-${Date.now()}-${stage.orderDetailId._id
                            .toString()
                            .slice(-6)}`;

                        if (regionalCarrier) {
                            // ✅ Gán carrier từ database
                            nextStage.assignedShipperId =
                                regionalCarrier.shipperId;
                            nextStage.shippingCompany =
                                regionalCarrier.companyName ||
                                regionalCarrier.name;
                        } else {
                            // 🆕 DEFAULT: Nếu không tìm thấy regional → dùng J&T Express (default carrier)
                            console.log(
                                `⚠️ Không tìm thấy regional carrier cho ${fromProvince} → ${toProvince}, dùng default J&T Express`
                            );
                            nextStage.shippingCompany = 'J&T Express';
                        }

                        // ✅ Khởi động ngay (không cần carrier "nhận")
                        nextStage.status = 'in_transit';
                        nextStage.inTransitAt = new Date();
                    } else {
                        // Các stage khác chờ shipper nhận
                        nextStage.status = 'pending';
                    }

                    await nextStage.save();

                    // Cập nhật currentStageIndex
                    await OrderDetail.findByIdAndUpdate(
                        stage.orderDetailId._id,
                        {
                            currentStageIndex: stage.stageNumber, // 0-indexed
                        }
                    );
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: stage.isLastStage
                ? 'Đơn hàng đã giao thành công'
                : 'Giai đoạn hoàn tất, chuyển sang giai đoạn tiếp theo',
            data: {
                stageId: stage._id,
                status: stage.status,
                isLastStage: stage.isLastStage,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi hoàn thành delivery stage:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [GET] /api/delivery/shipper/orders
 * CẬP NHẬT: Lấy danh sách đơn hàng cho shipper (lọc theo province)
 */
exports.getShipperOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Tìm shipper profile
        const shipper = await ShipperProfile.findOne({ userId });
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper profile không tồn tại',
            });
        }

        // Tìm coverage areas của shipper
        const coverage = await ShipperCoverageArea.findOne({
            shipperId: shipper._id,
        });

        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Shipper chưa được gán khu vực phục vụ',
            });
        }

        // Lấy danh sách provinces mà shipper phục vụ
        const provinces = coverage.coverageAreas.map((area) => area.province);

        // Tìm tất cả delivery stages chưa được gán mà nằm trong khu vực của shipper
        const pendingStages = await DeliveryStage.find({
            assignedShipperId: null,
            status: 'pending',
            'toLocation.province': { $in: provinces },
        })
            .populate('orderDetailId', 'mainOrderId items sellerId')
            .populate({
                path: 'orderDetailId',
                populate: {
                    path: 'mainOrderId',
                    select: 'profileId items totalAmount',
                    populate: {
                        path: 'profileId',
                        select: 'firstName lastName primaryPhone',
                    },
                },
            })
            .lean();

        return res.status(200).json({
            success: true,
            data: {
                shipperId: shipper._id,
                provincesCovered: provinces,
                pendingOrders: pendingStages,
                count: pendingStages.length,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi lấy danh sách đơn shipper:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [GET] /api/multi-delivery/shipper/assigned
 * Lấy danh sách delivery stages đã assigned cho shipper
 */
exports.getShipperAssignedOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Tìm shipper profile
        const shipper = await ShipperProfile.findOne({ userId });
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper profile không tồn tại',
            });
        }

        // ✅ Tìm tất cả delivery stages đã assign cho shipper
        const assignedStages = await DeliveryStage.find({
            assignedShipperId: shipper._id,
        })
            .populate(
                'orderDetailId',
                'mainOrderId items sellerId shippingAddress totalAmount'
            )
            .populate({
                path: 'orderDetailId',
                populate: {
                    path: 'mainOrderId',
                    select: 'profileId items totalAmount',
                    populate: {
                        path: 'profileId',
                        select: 'firstName lastName primaryPhone',
                    },
                },
            })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: assignedStages,
            count: assignedStages.length,
        });
    } catch (err) {
        console.error('❌ Lỗi lấy danh sách assigned orders:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [GET] /api/delivery/track/:orderDetailId
 * Khách hàng theo dõi đơn hàng (xem tất cả stages + vị trí realtime)
 */
exports.trackOrderRealtime = async (req, res) => {
    try {
        const { orderDetailId } = req.params;

        const orderDetail = await OrderDetail.findById(orderDetailId)
            .populate({
                path: 'deliveryStages',
                select: 'stageNumber status fromLocation toLocation assignedShipperId currentLocation locationHistory deliveryAttempts createdAt acceptedAt pickedUpAt inTransitAt deliveredAt',
            })
            .populate('mainOrderId', 'createdAt totalAmount paymentStatus');

        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: 'OrderDetail không tồn tại',
            });
        }

        const currentStage =
            orderDetail.deliveryStages[orderDetail.currentStageIndex] ||
            orderDetail.deliveryStages[0];

        return res.status(200).json({
            success: true,
            data: {
                orderDetailId: orderDetail._id,
                status: orderDetail.status,
                isInterProvincial: orderDetail.isInterProvincial,
                currentStageIndex: orderDetail.currentStageIndex,
                totalStages: orderDetail.deliveryStages.length,

                // Stage hiện tại
                currentStage: currentStage
                    ? {
                          stageNumber: currentStage.stageNumber,
                          status: currentStage.status,
                          fromLocation: currentStage.fromLocation,
                          toLocation: currentStage.toLocation,
                          currentLocation: currentStage.currentLocation,
                          locationHistory: currentStage.locationHistory,
                          timeline: {
                              createdAt: currentStage.createdAt,
                              acceptedAt: currentStage.acceptedAt,
                              pickedUpAt: currentStage.pickedUpAt,
                              inTransitAt: currentStage.inTransitAt,
                              deliveredAt: currentStage.deliveredAt,
                          },
                      }
                    : null,

                // Tất cả stages (timeline)
                stages: orderDetail.deliveryStages.map((stage) => ({
                    stageNumber: stage.stageNumber,
                    status: stage.status,
                    fromProvince: stage.fromLocation.province,
                    toProvince: stage.toLocation.province,
                    deliveredAt: stage.deliveredAt,
                })),
            },
        });
    } catch (err) {
        console.error('❌ Lỗi tracking order realtime:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * ==========================================
 * REGIONAL CARRIER API
 * ==========================================
 */

/**
 * Regional Carrier xem pending orders (stage 2 chờ nhận)
 * GET /api/multi-delivery/regional-carrier/pending-orders
 */
exports.getRegionalCarrierOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Tìm shipper profile (regional carrier cũng là shipper)
        const carrier = await ShipperProfile.findOne({ userId });
        if (!carrier) {
            return res.status(404).json({
                success: false,
                message: 'Carrier profile không tồn tại',
            });
        }

        // Tìm coverage areas của carrier
        const coverage = await ShipperCoverageArea.findOne({
            shipperId: carrier._id,
            shipperType: 'regional',
        });

        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Regional carrier chưa được cấu hình khu vực phục vụ',
            });
        }

        // Lấy danh sách provinces mà carrier phục vụ
        const provinces = coverage.coverageAreas.map((area) => area.province);

        // Tìm tất cả delivery stages stage 2 chưa được chấp nhận
        // (status = pending, stageNumber = 2)
        const pendingStages = await DeliveryStage.find({
            assignedShipperId: carrier._id, // Đã được gán cho carrier này
            status: 'pending',
            stageNumber: 2, // Chỉ stage 2 (trung chuyển)
        })
            .populate('orderDetailId', 'mainOrderId items sellerId totalAmount')
            .populate({
                path: 'orderDetailId',
                populate: {
                    path: 'mainOrderId',
                    select: 'profileId items',
                    populate: {
                        path: 'profileId',
                        select: 'firstName lastName primaryPhone',
                    },
                },
            })
            .sort({ createdAt: -1 })
            .lean();

        // Format response
        const formattedStages = pendingStages.map((stage) => ({
            _id: stage._id,
            stageNumber: stage.stageNumber,
            status: stage.status,
            createdAt: stage.createdAt,
            route: {
                from: `${stage.fromLocation.province}`,
                to: `${stage.toLocation.province}`,
                distance: stage.distance || 'N/A',
                estimatedTime: stage.estimatedTime || 'N/A',
            },
            order: {
                orderId:
                    stage.mainOrderId?.toString() ||
                    stage.orderDetailId?.mainOrderId,
                customer: stage.orderDetailId?.mainOrderId?.profileId
                    ? {
                          name: `${stage.orderDetailId.mainOrderId.profileId.firstName} ${stage.orderDetailId.mainOrderId.profileId.lastName}`,
                          phone: stage.orderDetailId.mainOrderId.profileId
                              .primaryPhone,
                      }
                    : null,
                totalAmount: stage.orderDetailId?.totalAmount || 0,
                itemCount: stage.orderDetailId?.items?.length || 0,
            },
            locations: {
                fromLocation: {
                    address: stage.fromLocation.address,
                    province: stage.fromLocation.province,
                    district: stage.fromLocation.district,
                    contactName: stage.fromLocation.contactName,
                    contactPhone: stage.fromLocation.contactPhone,
                },
                toLocation: {
                    address: stage.toLocation.address,
                    province: stage.toLocation.province,
                    district: stage.toLocation.district,
                    contactName: stage.toLocation.contactName,
                    contactPhone: stage.toLocation.contactPhone,
                },
            },
        }));

        return res.status(200).json({
            success: true,
            count: formattedStages.length,
            data: formattedStages,
        });
    } catch (err) {
        console.error('❌ Lỗi lấy pending orders cho regional carrier:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * Regional Carrier xem assigned orders (stage 2 đã nhận)
 * GET /api/multi-delivery/regional-carrier/assigned-orders
 */
exports.getRegionalCarrierAssignedOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Tìm shipper profile
        const carrier = await ShipperProfile.findOne({ userId });
        if (!carrier) {
            return res.status(404).json({
                success: false,
                message: 'Carrier profile không tồn tại',
            });
        }

        // Tìm coverage areas
        const coverage = await ShipperCoverageArea.findOne({
            shipperId: carrier._id,
            shipperType: 'regional',
        });

        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Regional carrier không được cấu hình',
            });
        }

        // Tìm tất cả delivery stages đã được chấp nhận
        // (status = accepted hoặc in_transit, stageNumber = 2)
        const assignedStages = await DeliveryStage.find({
            assignedShipperId: carrier._id,
            status: { $in: ['accepted', 'in_transit'] },
            stageNumber: 2,
        })
            .populate('orderDetailId', 'mainOrderId items sellerId totalAmount')
            .populate({
                path: 'orderDetailId',
                populate: {
                    path: 'mainOrderId',
                    select: 'profileId items',
                    populate: {
                        path: 'profileId',
                        select: 'firstName lastName primaryPhone',
                    },
                },
            })
            .sort({ acceptedAt: -1 })
            .lean();

        // Format response
        const formattedStages = assignedStages.map((stage) => ({
            _id: stage._id,
            stageNumber: stage.stageNumber,
            status: stage.status,
            acceptedAt: stage.acceptedAt,
            route: {
                from: stage.fromLocation.province,
                to: stage.toLocation.province,
                distance: stage.distance || 'N/A',
            },
            order: {
                orderId:
                    stage.mainOrderId?.toString() ||
                    stage.orderDetailId?.mainOrderId,
                customer: stage.orderDetailId?.mainOrderId?.profileId
                    ? {
                          name: `${stage.orderDetailId.mainOrderId.profileId.firstName} ${stage.orderDetailId.mainOrderId.profileId.lastName}`,
                          phone: stage.orderDetailId.mainOrderId.profileId
                              .primaryPhone,
                      }
                    : null,
                totalAmount: stage.orderDetailId?.totalAmount || 0,
            },
            locations: {
                fromLocation: stage.fromLocation,
                toLocation: stage.toLocation,
            },
            timeline: {
                acceptedAt: stage.acceptedAt,
                inTransitAt: stage.inTransitAt,
                deliveredAt: stage.deliveredAt,
            },
        }));

        return res.status(200).json({
            success: true,
            count: formattedStages.length,
            data: formattedStages,
        });
    } catch (err) {
        console.error('❌ Lỗi lấy assigned orders cho regional carrier:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/multi-delivery/stages/:stageId/confirm-carrier-delivery
 * 🆕 Seller confirm khi dịch vụ vận chuyển báo tới hub2
 * Chỉ dùng cho Stage 2 (Regional transfer)
 *
 * Flow:
 * 1. Stage 2 đang in_transit (vận chuyển từ hub1 → hub2)
 * 2. Dịch vụ vận chuyển báo cho seller khi tới hub2
 * 3. Seller nhấn nút confirm → Stage 2 marked as delivered
 * 4. Stage 3 auto-activate với status='pending' (chờ shipper nhận)
 */
exports.confirmCarrierDelivery = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { notes } = req.body;

        // Validate
        if (!stageId) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp stageId',
            });
        }

        const DeliveryStage = require('../models/deliveryStageModel');
        const OrderDetail = require('../models/orderDetailModel');
        const Order = require('../models/orderModel');
        const ShipperCoverageArea = require('../models/shipperCoverageAreaModel');

        // Lấy stage 2
        const stage = await DeliveryStage.findById(stageId).populate(
            'mainOrderId orderDetailId'
        );

        if (!stage) {
            return res.status(404).json({
                success: false,
                message: 'Giai đoạn không tồn tại',
            });
        }

        // ✅ Chỉ dùng cho stage 2
        if (stage.stageNumber !== 2) {
            return res.status(400).json({
                success: false,
                message: 'API này chỉ dùng cho Stage 2 (regional transfer)',
            });
        }

        // ✅ Stage 2 phải đang in_transit
        if (stage.status !== 'in_transit') {
            return res.status(400).json({
                success: false,
                message: `Stage 2 phải có status 'in_transit' để confirm. Hiện tại: ${stage.status}`,
            });
        }

        // ✅ Mark Stage 2 as delivered
        stage.status = 'delivered';
        stage.deliveredAt = new Date();
        if (notes) stage.notes = notes;
        await stage.save();

        // ✅ Auto-activate Stage 3
        const stage3 = await DeliveryStage.findOne({
            orderDetailId: stage.orderDetailId._id,
            stageNumber: 3,
        });

        if (stage3) {
            // Tìm shipper tỉnh đích để giao hàng
            const toProvince = stage3.toLocation.province;

            // Tìm local shipper có phục vụ tỉnh đích
            const shipper3 = await ShipperCoverageArea.findOne({
                shipperType: 'local',
                status: 'active',
                'coverageAreas.province': toProvince,
            });

            if (shipper3) {
                // ✅ Gán shipper tùy chọn (nếu tìm thấy)
                stage3.assignedShipperId = shipper3.shipperId;
                stage3.shippingCompany = shipper3.companyName || shipper3.name;
            }
            // Nếu không tìm thấy, còn pending để admin gán thủ công

            // ✅ Stage 3 status = pending (chờ shipper nhận, không tự động gán)
            stage3.status = 'pending';
            await stage3.save();

            // ✅ Update OrderDetail currentStageIndex
            await OrderDetail.findByIdAndUpdate(
                stage.orderDetailId._id,
                { currentStageIndex: 2 } // 0-indexed: stage 3 = index 2
            );
        }

        return res.status(200).json({
            success: true,
            message:
                'Stage 2 confirmed. Stage 3 activated waiting for shipper pickup.',
            data: {
                stage2: {
                    id: stage._id,
                    status: 'delivered',
                    deliveredAt: stage.deliveredAt,
                },
                stage3: {
                    id: stage3?._id,
                    status: 'pending',
                    assignedShipperId: stage3?.assignedShipperId || null,
                    message: stage3?.assignedShipperId
                        ? 'Shipper đã được gán, chờ nhận hàng'
                        : 'Chờ admin gán shipper',
                },
            },
        });
    } catch (err) {
        console.error('❌ Lỗi confirm stage 2:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
            error: err.message,
        });
    }
};

module.exports = exports;
