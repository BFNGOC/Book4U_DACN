import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const ORDER_SELLER_API_URL = 'api/seller-orders';

// Lấy danh sách đơn hàng của seller (có filter theo status)
export const getSellerOrders = (params = {}) =>
    fetchHandler(
        axiosPrivate,
        ORDER_SELLER_API_URL,
        params,
        'Lỗi khi lấy danh sách đơn hàng.'
    );

// Lấy chi tiết một đơn hàng
export const getSellerOrderDetail = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}`,
        {},
        'Lỗi khi lấy chi tiết đơn hàng.'
    );

// Cập nhật trạng thái đơn hàng (generic)
export const updateOrderStatus = (orderId, status) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}/status`,
        { status },
        'Lỗi khi cập nhật trạng thái đơn hàng.',
        'PUT'
    );

// Bắt đầu picking (pending → picking)
export const startPicking = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}/status/picking`,
        {},
        'Lỗi khi bắt đầu lấy hàng.',
        'PUT'
    );

// Đánh dấu đã packed (picking → packed)
export const markAsPacked = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}/status/packed`,
        {},
        'Lỗi khi đóng gói hàng.',
        'PUT'
    );

// Giao hàng cho vận chuyển (packed → in_transit)
export const handoffToCarrier = (orderId, handoffData) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}/handoff-carrier`,
        handoffData,
        'Lỗi khi giao hàng cho vận chuyển.',
        'PUT'
    );

export const getRevenueStats = (period = 'month') =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/stats/revenue`,
        { period },
        'Lỗi khi lấy thống kê doanh thu.'
    );
