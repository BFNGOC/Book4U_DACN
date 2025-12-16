const ShipperCoverageArea = require('../models/shipperCoverageAreaModel');
const { ShipperProfile } = require('../models/profileModel');
const mongoose = require('mongoose');

/**
 * ============================================================
 * SHIPPER COVERAGE AREA CONTROLLER
 * ============================================================
 * Quản lý khu vực phục vụ của shipper
 */

/**
 * [POST] /api/shipper-coverage/create
 * Admin/System tạo hoặc cập nhật coverage area cho shipper
 */
exports.createOrUpdateCoverageArea = async (req, res) => {
    try {
        const {
            shipperId,
            shipperType,
            coverageAreas,
            mainWarehouseId,
            mainWarehouseName,
        } = req.body;

        // Validate input
        if (!shipperId || !coverageAreas || coverageAreas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: shipperId, coverageAreas (array)',
            });
        }

        // Kiểm tra shipper tồn tại
        const shipper = await ShipperProfile.findById(shipperId);
        if (!shipper) {
            return res.status(404).json({
                success: false,
                message: 'Shipper không tồn tại',
            });
        }

        // Tìm hoặc tạo coverage area
        let coverage = await ShipperCoverageArea.findOne({ shipperId });

        if (coverage) {
            // Cập nhật
            coverage.shipperType = shipperType || coverage.shipperType;
            coverage.coverageAreas = coverageAreas;
            if (mainWarehouseId) {
                coverage.mainWarehouseId = mainWarehouseId;
                coverage.mainWarehouseName = mainWarehouseName;
            }
            coverage.updatedAt = new Date();
        } else {
            // Tạo mới
            coverage = new ShipperCoverageArea({
                shipperId,
                shipperType: shipperType || 'local',
                coverageAreas,
                mainWarehouseId,
                mainWarehouseName,
                name: shipper.firstName + ' ' + shipper.lastName,
                phone: shipper.primaryPhone,
                email: shipper.email,
            });
        }

        await coverage.save();

        return res.status(201).json({
            success: true,
            message: coverage._id
                ? 'Cập nhật khu vực phục vụ thành công'
                : 'Tạo khu vực phục vụ thành công',
            data: coverage,
        });
    } catch (err) {
        console.error('❌ Lỗi tạo coverage area:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [GET] /api/shipper-coverage/:shipperId
 * Lấy khu vực phục vụ của shipper
 */
exports.getCoverageArea = async (req, res) => {
    try {
        const { shipperId } = req.params;

        const coverage = await ShipperCoverageArea.findOne({
            shipperId,
        });

        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Shipper chưa được gán khu vực phục vụ',
            });
        }

        return res.status(200).json({
            success: true,
            data: coverage,
        });
    } catch (err) {
        console.error('❌ Lỗi lấy coverage area:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [GET] /api/shipper-coverage/province/:province
 * Lấy danh sách shippers phục vụ tỉnh nào đó
 */
exports.getShippersForProvince = async (req, res) => {
    try {
        const { province } = req.params;

        const shippers = await ShipperCoverageArea.find({
            'coverageAreas.province': province,
            status: 'active',
        }).lean();

        return res.status(200).json({
            success: true,
            province,
            count: shippers.length,
            data: shippers,
        });
    } catch (err) {
        console.error('❌ Lỗi lấy shippers:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/shipper-coverage/:shipperId/location
 * Cập nhật vị trí hiện tại + online status của shipper
 */
exports.updateShipperLocation = async (req, res) => {
    try {
        const { shipperId } = req.params;
        const { latitude, longitude, address, isOnline } = req.body;

        const coverage = await ShipperCoverageArea.findOne({ shipperId });
        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Shipper không tồn tại',
            });
        }

        coverage.currentLocation = {
            latitude,
            longitude,
            address: address || 'Unknown',
            timestamp: new Date(),
            isOnline: isOnline !== undefined ? isOnline : true,
        };

        await coverage.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật vị trí thành công',
            data: {
                shipperId,
                currentLocation: coverage.currentLocation,
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
 * [PUT] /api/shipper-coverage/:shipperId/status
 * Cập nhật status của shipper
 */
exports.updateShipperStatus = async (req, res) => {
    try {
        const { shipperId } = req.params;
        const { status } = req.body; // 'active', 'inactive', 'on_leave'

        const coverage = await ShipperCoverageArea.findOne({ shipperId });
        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Shipper không tồn tại',
            });
        }

        coverage.status = status;
        coverage.updatedAt = new Date();
        await coverage.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: {
                shipperId,
                status: coverage.status,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật status:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/shipper-coverage/:shipperId/orders-capacity
 * Cập nhật số lượng orders hiện tại / max capacity
 */
exports.updateOrdersCapacity = async (req, res) => {
    try {
        const { shipperId } = req.params;
        const { currentActiveOrders, maxOrdersPerDay } = req.body;

        const coverage = await ShipperCoverageArea.findOne({ shipperId });
        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Shipper không tồn tại',
            });
        }

        if (currentActiveOrders !== undefined) {
            coverage.capacity.currentActiveOrders = currentActiveOrders;
        }
        if (maxOrdersPerDay !== undefined) {
            coverage.capacity.maxOrdersPerDay = maxOrdersPerDay;
        }

        // Kiểm tra xem shipper còn sẵn không
        coverage.capacity.isAvailable =
            coverage.capacity.currentActiveOrders <
            coverage.capacity.maxOrdersPerDay;

        coverage.updatedAt = new Date();
        await coverage.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật công suất thành công',
            data: {
                shipperId,
                capacity: coverage.capacity,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật capacity:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

/**
 * [PUT] /api/shipper-coverage/:shipperId/performance
 * Cập nhật hiệu suất của shipper (sau khi giao xong)
 */
exports.updatePerformance = async (req, res) => {
    try {
        const { shipperId } = req.params;
        const { isSuccessful, rating } = req.body;

        const coverage = await ShipperCoverageArea.findOne({ shipperId });
        if (!coverage) {
            return res.status(404).json({
                success: false,
                message: 'Shipper không tồn tại',
            });
        }

        coverage.performance.totalDeliveries += 1;
        if (isSuccessful) {
            coverage.performance.successfulDeliveries += 1;
        } else {
            coverage.performance.failedDeliveries += 1;
        }

        if (rating) {
            const avgRating =
                (coverage.performance.averageRating *
                    (coverage.performance.totalDeliveries - 1) +
                    rating) /
                coverage.performance.totalDeliveries;
            coverage.performance.averageRating =
                Math.round(avgRating * 10) / 10;
        }

        coverage.performance.onTimeDeliveryRate =
            (coverage.performance.successfulDeliveries /
                coverage.performance.totalDeliveries) *
            100;
        coverage.performance.lastUpdatedAt = new Date();

        coverage.updatedAt = new Date();
        await coverage.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật hiệu suất thành công',
            data: {
                shipperId,
                performance: coverage.performance,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật performance:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ',
        });
    }
};

module.exports = exports;
