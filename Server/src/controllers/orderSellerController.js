const Order = require('../models/orderModel');
const Book = require('../models/bookModel');
const { SellerProfile } = require('../models/profileModel');

// [GET] /api/seller-orders - Danh sách đơn hàng của seller
exports.getSellerOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        // Lấy tất cả bookIds của seller
        const sellerBooks = await Book.find({ sellerId: seller._id }).select(
            '_id'
        );
        const bookIds = sellerBooks.map((b) => b._id);

        // Tìm kiếm orders
        const query = { 'items.bookId': { $in: bookIds } };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('profileId', 'firstName lastName primaryPhone')
                .populate('items.bookId', 'title slug images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy danh sách đơn hàng:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/seller-orders/:orderId - Chi tiết đơn hàng
exports.getSellerOrderDetail = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        const order = await Order.findById(orderId)
            .populate('profileId', 'firstName lastName primaryPhone')
            .populate('items.bookId', 'title slug images author')
            .populate('items.sellerId', 'storeName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng.',
            });
        }

        // Kiểm tra quyền truy cập (đơn hàng phải có sản phẩm của seller này)
        const sellerBooks = await Book.find({ sellerId: seller._id }).select(
            '_id'
        );
        const bookIds = sellerBooks.map((b) => b._id.toString());

        const hasAccess = order.items.some((item) =>
            bookIds.includes(item.bookId._id.toString())
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập đơn hàng này.',
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy chi tiết đơn hàng:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/seller-orders/:orderId/status - Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;
        const { status } = req.body;

        if (
            ![
                'pending',
                'processing',
                'shipped',
                'completed',
                'cancelled',
            ].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ.',
            });
        }

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        const order = await Order.findById(orderId).populate('items.bookId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng.',
            });
        }

        // Kiểm tra quyền truy cập
        const sellerBooks = await Book.find({ sellerId: seller._id }).select(
            '_id'
        );
        const bookIds = sellerBooks.map((b) => b._id.toString());

        const hasAccess = order.items.some((item) =>
            bookIds.includes(item.bookId._id.toString())
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật đơn hàng này.',
            });
        }

        order.status = status;
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công.',
            data: order,
        });
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật trạng thái:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/seller-orders/stats/revenue - Thống kê doanh thu theo thời gian
exports.getRevenueStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = 'month' } = req.query;

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

        // Tính ngày bắt đầu
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
            status: 'completed',
        });

        const revenue = orders.reduce(
            (sum, order) => sum + order.totalAmount,
            0
        );

        return res.status(200).json({
            success: true,
            data: {
                period,
                revenue,
                ordersCount: orders.length,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy thống kê doanh thu:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};
