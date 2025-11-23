const { SellerProfile } = require('../models/profileModel');
const Book = require('../models/bookModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

// [GET] /api/sellers/:sellerId - Xem thông tin cửa hàng (public)
exports.getSellerStore = async (req, res) => {
    try {
        const { sellerId } = req.params;

        const seller = await SellerProfile.findById(sellerId)
            .select(
                '-bankDetails -identificationImages -identificationNumber -businessRegistration -businessLicenseImages'
            )
            .populate('userId', 'email');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cửa hàng.',
            });
        }

        return res.status(200).json({
            success: true,
            data: seller,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy thông tin cửa hàng:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/sellers/:sellerId/products - Danh sách sản phẩm của cửa hàng
exports.getSellerProducts = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 12, sort = '-createdAt' } = req.query;

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Book.find({ sellerId })
                .populate('categoryId', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Book.countDocuments({ sellerId }),
        ]);

        return res.status(200).json({
            success: true,
            data: products,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy danh sách sản phẩm:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/sellers/dashboard - Dashboard seller (private, chỉ owner)
exports.getSellerDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('User ID in getSellerDashboard:', userId);
        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập dashboard.',
            });
        }

        // Lấy thống kê
        const [totalProducts, totalOrders, totalRevenue, totalSales] =
            await Promise.all([
                Book.countDocuments({ sellerId: seller._id }),
                Order.countDocuments({
                    'items.bookId': {
                        $in: await Book.find({ sellerId: seller._id }).select(
                            '_id'
                        ),
                    },
                }),
                Order.aggregate([
                    {
                        $match: {
                            'items.bookId': {
                                $in: await Book.find({
                                    sellerId: seller._id,
                                }).select('_id'),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$totalAmount' },
                        },
                    },
                ]),
                Book.aggregate([
                    { $match: { sellerId: seller._id } },
                    { $group: { _id: null, total: { $sum: '$soldCount' } } },
                ]),
            ]);

        return res.status(200).json({
            success: true,
            data: {
                seller,
                stats: {
                    totalProducts,
                    totalOrders,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalSales: totalSales[0]?.total || 0,
                },
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy dashboard:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/sellers/profile - Cập nhật thông tin cửa hàng (owner)
exports.updateSellerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            storeName,
            storeDescription,
            storeLogoUrl,
            businessAddress,
            warehouses,
        } = req.body;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền cập nhật profile.',
            });
        }

        // Cập nhật các trường
        if (storeName) seller.storeName = storeName;
        if (storeDescription) seller.storeDescription = storeDescription;
        if (storeLogoUrl) seller.storeLogo = storeLogoUrl;
        if (businessAddress) seller.businessAddress = businessAddress;
        if (warehouses) seller.warehouses = warehouses;

        await seller.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin cửa hàng thành công.',
            data: seller,
        });
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật profile:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/sellers/dashboard/stats - Thống kê chi tiết
exports.getSellerStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = 'month' } = req.query; // day, week, month, year

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        const sellerBooks = await Book.find({ sellerId: seller._id }).select(
            '_id'
        );
        const bookIds = sellerBooks.map((b) => b._id);

        // Tính ngày bắt đầu dựa trên period
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const orders = await Order.find({
            'items.bookId': { $in: bookIds },
            createdAt: { $gte: startDate },
        }).populate('items.bookId');

        const revenue = orders.reduce(
            (sum, order) => sum + order.totalAmount,
            0
        );
        const totalOrders = orders.length;

        // Tính số sản phẩm bán được
        const soldCount = orders.reduce((sum, order) => {
            return (
                sum +
                order.items
                    .filter((item) =>
                        bookIds.includes(item.bookId._id.toString())
                    )
                    .reduce((s, item) => s + item.quantity, 0)
            );
        }, 0);

        // Thống kê theo trạng thái
        const statusStats = {
            pending: orders.filter((o) => o.status === 'pending').length,
            processing: orders.filter((o) => o.status === 'processing').length,
            shipped: orders.filter((o) => o.status === 'shipped').length,
            completed: orders.filter((o) => o.status === 'completed').length,
            cancelled: orders.filter((o) => o.status === 'cancelled').length,
        };

        return res.status(200).json({
            success: true,
            data: {
                period,
                revenue,
                totalOrders,
                soldCount,
                statusStats,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy thống kê:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};
