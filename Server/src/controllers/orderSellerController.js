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
                .populate('items.sellerId', 'storeName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(query),
        ]);

        // 🔥 FILTER: Chỉ lấy items của seller này
        const filteredOrders = orders.map((order) => {
            const sellerOnly = order.toObject();

            // Filter items: chỉ lấy items của seller này
            sellerOnly.items = order.items.filter(
                (item) => item.sellerId._id.toString() === seller._id.toString()
            );

            // Tính subtotal chỉ cho items của seller này
            sellerOnly.sellerSubtotal = sellerOnly.items.reduce((sum, item) => {
                return sum + item.price * item.quantity;
            }, 0);

            return sellerOnly;
        });

        console.log('  Orders found:', filteredOrders.length, 'Total:', total);

        return res.status(200).json({
            success: true,
            data: filteredOrders,
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

        // 🔥 FILTER: Chỉ lấy items của seller này
        const sellerOrder = order.toObject();
        sellerOrder.items = order.items.filter(
            (item) => item.sellerId._id.toString() === seller._id.toString()
        );

        // Tính subtotal chỉ cho items của seller này
        sellerOrder.sellerSubtotal = sellerOrder.items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        return res.status(200).json({
            success: true,
            data: sellerOrder,
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
        const { period = 'month', month, year } = req.query;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        // Tính ngày bắt đầu
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Nếu có month/year cụ thể, dùng month/year đó
                if (month && year) {
                    startDate = new Date(year, month - 1, 1);
                    endDate = new Date(year, month, 0, 23, 59, 59, 999);
                } else {
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setMonth(endDate.getMonth() + 1);
                    endDate.setDate(0);
                    endDate.setHours(23, 59, 59, 999);
                }
                break;
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setMonth(11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        // ✅ Lấy từ OrderDetail thay vì Order
        const OrderDetail = require('../models/orderDetailModel');
        const orderDetails = await OrderDetail.find({
            sellerId: seller._id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'delivered',
        });

        const revenue = orderDetails.reduce(
            (sum, od) => sum + (od.totalAmount || 0),
            0
        );

        return res.status(200).json({
            success: true,
            data: {
                period,
                month: month || startDate.getMonth() + 1,
                year: year || startDate.getFullYear(),
                revenue,
                ordersCount: orderDetails.length,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
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

// [GET] /api/seller-orders/stats/top-products - Sản phẩm bán chạy nhất
exports.getTopProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = 'month', month, year, limit = 10 } = req.query;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        // Tính ngày bắt đầu
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                if (month && year) {
                    startDate = new Date(year, month - 1, 1);
                    endDate = new Date(year, month, 0, 23, 59, 59, 999);
                } else {
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setMonth(endDate.getMonth() + 1);
                    endDate.setDate(0);
                    endDate.setHours(23, 59, 59, 999);
                }
                break;
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setMonth(11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        // ✅ Lấy từ OrderDetail thay vì Order
        const OrderDetail = require('../models/orderDetailModel');
        const orderDetails = await OrderDetail.find({
            sellerId: seller._id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'delivered',
        }).populate('items.bookId', 'title images slug');

        // Group by book và tính tổng quantity + revenue
        const productStats = {};

        orderDetails.forEach((orderDetail) => {
            (orderDetail.items || []).forEach((item) => {
                const bookId = item.bookId._id.toString();
                if (!productStats[bookId]) {
                    productStats[bookId] = {
                        bookId: item.bookId._id,
                        title: item.bookId.title,
                        image: item.bookId.images?.[0],
                        slug: item.bookId.slug,
                        quantity: 0,
                        revenue: 0,
                        orders: 0,
                    };
                }
                productStats[bookId].quantity += item.quantity;
                productStats[bookId].revenue +=
                    (item.price || 0) * (item.quantity || 0);
                productStats[bookId].orders += 1;
            });
        });

        // Convert to array và sort by quantity (bán chạy nhất)
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, parseInt(limit));

        return res.status(200).json({
            success: true,
            data: {
                period,
                month: month || startDate.getMonth() + 1,
                year: year || startDate.getFullYear(),
                count: topProducts.length,
                products: topProducts,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sản phẩm bán chạy:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/seller-orders/stats/breakdown - Doanh thu chi tiết theo ngày/giờ
exports.getRevenueBreakdown = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = 'month', month, year } = req.query;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không có quyền truy cập.',
            });
        }

        // Tính ngày bắt đầu
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                if (month && year) {
                    startDate = new Date(year, month - 1, 1);
                    endDate = new Date(year, month, 0, 23, 59, 59, 999);
                } else {
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setMonth(endDate.getMonth() + 1);
                    endDate.setDate(0);
                    endDate.setHours(23, 59, 59, 999);
                }
                break;
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setMonth(11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        const OrderDetail = require('../models/orderDetailModel');
        const orderDetails = await OrderDetail.find({
            sellerId: seller._id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'delivered',
        });

        // ✅ Group dữ liệu theo ngày/giờ
        const breakdown = {};

        if (period === 'day') {
            // Group by hour (0-23)
            for (let h = 0; h < 24; h++) {
                breakdown[h] = {
                    revenue: 0,
                    orders: 0,
                    hour: `${h.toString().padStart(2, '0')}:00`,
                };
            }
            orderDetails.forEach((od) => {
                const hour = new Date(od.createdAt).getHours();
                breakdown[hour].revenue += od.totalAmount || 0;
                breakdown[hour].orders += 1;
            });
        } else if (period === 'week') {
            // Group by day of week
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            for (let d = 0; d < 7; d++) {
                breakdown[d] = { revenue: 0, orders: 0, day: dayNames[d] };
            }
            orderDetails.forEach((od) => {
                const dayOfWeek = new Date(od.createdAt).getDay();
                breakdown[dayOfWeek].revenue += od.totalAmount || 0;
                breakdown[dayOfWeek].orders += 1;
            });
        } else if (period === 'month') {
            // Group by date
            const daysInMonth = new Date(
                endDate.getFullYear(),
                endDate.getMonth() + 1,
                0
            ).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                breakdown[d] = { revenue: 0, orders: 0, date: d };
            }
            orderDetails.forEach((od) => {
                const date = new Date(od.createdAt).getDate();
                breakdown[date].revenue += od.totalAmount || 0;
                breakdown[date].orders += 1;
            });
        } else {
            // Group by month
            for (let m = 1; m <= 12; m++) {
                breakdown[m] = { revenue: 0, orders: 0, month: m };
            }
            orderDetails.forEach((od) => {
                const month = new Date(od.createdAt).getMonth() + 1;
                breakdown[month].revenue += od.totalAmount || 0;
                breakdown[month].orders += 1;
            });
        }

        // Convert to array
        const chartData = Object.values(breakdown);

        return res.status(200).json({
            success: true,
            data: {
                period,
                month: month || startDate.getMonth() + 1,
                year: year || startDate.getFullYear(),
                chartData,
            },
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy doanh thu chi tiết:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/seller-orders/:orderId/status/picking - Bắt đầu picking
exports.startPicking = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không phải là seller.',
            });
        }

        const Order = require('../models/orderModel');
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        if (order.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: `Không thể bắt đầu picking từ status=${order.status}. Phải là confirmed.`,
            });
        }

        order.status = 'picking';
        order.notes = order.notes || [];
        order.notes.push({
            timestamp: new Date(),
            message: `Seller ${seller.storeName} bắt đầu lấy hàng`,
            addedBy: 'seller',
        });

        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Bắt đầu lấy hàng thành công.',
            data: order,
        });
    } catch (err) {
        console.error('❌ Lỗi khi bắt đầu picking:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/seller-orders/:orderId/status/packed - Đã đóng gói
exports.markAsPacked = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;
        const { trackingNumber, carrierName } = req.body;

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không phải là seller.',
            });
        }

        const Order = require('../models/orderModel');
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        if (!['picking', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể đóng gói từ status=${order.status}. Phải là confirmed hoặc picking.`,
            });
        }

        order.status = 'packed';

        // Optional: lưu tracking number nếu có
        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }
        if (carrierName) {
            order.carrier = { name: carrierName };
        }

        order.notes = order.notes || [];
        order.notes.push({
            timestamp: new Date(),
            message: `Seller ${seller.storeName} đã hoàn thành đóng gói`,
            addedBy: 'seller',
        });

        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được đóng gói. Sẵn sàng cho shipper lấy.',
            data: order,
        });
    } catch (err) {
        console.error('❌ Lỗi khi đóng gói:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/seller-orders/:orderId/handoff-carrier - Bàn giao cho shipper (status = in_transit)
exports.handoffToCarrier = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;
        const { carrierName, trackingNumber, shipperId, shipperName } =
            req.body;

        // Validate inputs
        if (!carrierName || !carrierName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tên vận chuyển không được để trống',
            });
        }

        if (!trackingNumber || !trackingNumber.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Mã vận đơn không được để trống',
            });
        }

        if (!shipperId || !shipperId.trim()) {
            return res.status(400).json({
                success: false,
                message: 'ID shipper không được để trống',
            });
        }

        if (!shipperName || !shipperName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tên shipper không được để trống',
            });
        }

        const seller = await SellerProfile.findOne({ userId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Bạn không phải là seller.',
            });
        }

        const Order = require('../models/orderModel');
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        if (order.status !== 'packed') {
            return res.status(400).json({
                success: false,
                message: `Không thể bàn giao từ status=${order.status}. Phải là packed.`,
            });
        }

        order.status = 'in_transit';
        order.carrier = {
            name: carrierName.trim(),
            id: shipperId.trim(),
        };
        order.trackingNumber = trackingNumber.trim();

        order.notes = order.notes || [];
        order.notes.push({
            timestamp: new Date(),
            message: `Seller ${
                seller.storeName
            } bàn giao cho shipper ${shipperName.trim()} (Tracking: ${trackingNumber})`,
            addedBy: 'seller',
        });

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                'Đơn hàng bàn giao cho shipper thành công. Đang vận chuyển.',
            data: order,
        });
    } catch (err) {
        console.error('❌ Lỗi khi bàn giao:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};
