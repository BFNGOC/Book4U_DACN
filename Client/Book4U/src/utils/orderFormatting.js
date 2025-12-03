/**
 * Order Formatting Utilities
 * Provides consistent data structure across all order display components
 */

/**
 * Format order item from API response
 * Handles both populated and unpopulated fields
 */
export const formatOrderItem = (item) => {
    // Handle populated bookId object vs simple ID
    const book = item.bookId || {};
    const seller = item.sellerId || {};

    return {
        bookId: book._id || item.bookId,
        bookTitle: book.title || 'Sản phẩm',
        bookSlug: book.slug || '',
        bookImages: book.images || [],
        sellerId: seller._id || item.sellerId,
        sellerName: seller.storeName || 'Shop',
        quantity: item.quantity || 0,
        price: item.price || 0,
        subtotal: (item.price || 0) * (item.quantity || 0),
    };
};

/**
 * Format order from API response
 * Ensure all fields have consistent structure
 */
export const formatOrder = (order) => {
    if (!order) return null;

    const customer = order.profileId || {};
    const carrier = order.carrier || {};

    return {
        orderId: order._id,
        status: order.status,

        // Customer info
        customerId: customer._id || order.profileId,
        customerName:
            customer.firstName + ' ' + customer.lastName || 'Khách hàng',
        customerPhone: customer.primaryPhone || '',

        // Items
        items: (order.items || []).map(formatOrderItem),

        // Totals
        totalAmount: order.totalAmount || 0,

        // Shipping
        shippingAddress: order.shippingAddress || {},

        // Payment
        paymentMethod: order.paymentMethod || 'COD',
        paymentStatus: order.paymentStatus || 'unpaid',

        // Warehouse & Logistics
        warehouseId: order.warehouseId,
        warehouseName: order.warehouseName,
        trackingNumber: order.trackingNumber,

        // Carrier info
        carrierName: carrier.name,
        carrierId: carrier.id,

        // Delivery
        deliveryAttempts: order.deliveryAttempts || [],
        currentLocation: order.currentLocation,
        maxDeliveryAttempts: order.maxDeliveryAttempts || 3,

        // Return info
        returnInfo: order.return,

        // Notes
        notes: order.notes || [],

        // Timestamps
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
};

/**
 * Calculate item subtotals
 */
export const calculateOrderTotals = (items) => {
    if (!items || !Array.isArray(items)) return { subtotal: 0, items: [] };

    const formattedItems = items.map(formatOrderItem);
    const subtotal = formattedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
    );

    return {
        subtotal,
        itemCount: items.length,
        items: formattedItems,
    };
};

/**
 * Get status label with emoji and color
 */
export const getStatusDisplay = (status) => {
    const statusMap = {
        pending: {
            label: '⏳ Chờ xác nhận',
            color: 'bg-yellow-100 text-yellow-800',
            badge: 'warning',
        },
        confirmed: {
            label: '✅ Đã xác nhận',
            color: 'bg-blue-100 text-blue-800',
            badge: 'info',
        },
        picking: {
            label: '📦 Đang lấy hàng',
            color: 'bg-purple-100 text-purple-800',
            badge: 'info',
        },
        packed: {
            label: '📮 Đã đóng gói',
            color: 'bg-orange-100 text-orange-800',
            badge: 'info',
        },
        in_transit: {
            label: '🚚 Đang vận chuyển',
            color: 'bg-indigo-100 text-indigo-800',
            badge: 'primary',
        },
        out_for_delivery: {
            label: '🚴 Đang giao',
            color: 'bg-cyan-100 text-cyan-800',
            badge: 'primary',
        },
        completed: {
            label: '🎉 Đã giao',
            color: 'bg-green-100 text-green-800',
            badge: 'success',
        },
        return_initiated: {
            label: '↩️ Yêu cầu trả hàng',
            color: 'bg-red-100 text-red-800',
            badge: 'warning',
        },
        returned: {
            label: '↩️ Đã trả hàng',
            color: 'bg-red-100 text-red-800',
            badge: 'danger',
        },
        cancelled: {
            label: '❌ Đã hủy',
            color: 'bg-gray-100 text-gray-800',
            badge: 'secondary',
        },
    };

    return (
        statusMap[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800',
            badge: 'secondary',
        }
    );
};

/**
 * Format price with VND currency
 */
export const formatPrice = (price) => {
    return (price || 0).toLocaleString('vi-VN') + '₫';
};

/**
 * Get next possible action based on current status
 */
export const getNextAction = (status) => {
    const actions = {
        pending: {
            action: 'confirm',
            label: '✓ Xác nhận đơn',
            color: 'bg-blue-500 hover:bg-blue-600',
        },
        confirmed: {
            action: 'picking',
            label: '▶ Bắt đầu lấy hàng',
            color: 'bg-purple-500 hover:bg-purple-600',
        },
        picking: {
            action: 'packed',
            label: '✓ Đã đóng gói',
            color: 'bg-orange-500 hover:bg-orange-600',
        },
        packed: {
            action: 'handoff',
            label: '🚚 Giao cho vận chuyển',
            color: 'bg-green-500 hover:bg-green-600',
        },
    };

    return actions[status] || null;
};
