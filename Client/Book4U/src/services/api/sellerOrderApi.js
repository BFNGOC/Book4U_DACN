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

export const getRevenueStats = (period = 'month', month, year) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/stats/revenue`,
        { period, month, year },
        'Lỗi khi lấy thống kê doanh thu.'
    );

export const getTopProducts = (period = 'month', month, year, limit = 10) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/stats/top-products`,
        { period, month, year, limit },
        'Lỗi khi lấy sản phẩm bán chạy.'
    );

export const getRevenueBreakdown = (period = 'month', month, year) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/stats/breakdown`,
        { period, month, year },
        'Lỗi khi lấy doanh thu chi tiết.'
    );

/**
 * ORDER DETAIL API (Multi-seller order management)
 * ================================================
 */
const ORDER_DETAIL_API_URL = 'api/seller-orders/details';

// Lấy danh sách OrderDetail của seller
export const getSellerOrderDetails = (params = {}) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_DETAIL_API_URL}/list`,
        params,
        'Lỗi khi lấy danh sách chi tiết đơn hàng.'
    );

// Lấy chi tiết một OrderDetail
export const getSellerOrderDetailInfo = (orderDetailId) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_DETAIL_API_URL}/${orderDetailId}`,
        {},
        'Lỗi khi lấy chi tiết đơn hàng.'
    );

// Confirm OrderDetail (pending → confirmed) + trừ stock tại warehouse
export const confirmOrderDetail = (orderDetailId, confirmData = {}) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_DETAIL_API_URL}/${orderDetailId}/confirm`,
        confirmData,
        'Lỗi khi xác nhận đơn hàng.',
        'POST'
    );

// Ship OrderDetail (confirmed → shipping) + lấy tracking number
export const shipOrderDetail = (orderDetailId, shipData) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_DETAIL_API_URL}/${orderDetailId}/ship`,
        shipData,
        'Lỗi khi giao hàng.',
        'POST'
    );

// Cancel OrderDetail (pending/confirmed → cancelled) + restore stock
export const cancelOrderDetail = (orderDetailId, cancelData = {}) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_DETAIL_API_URL}/${orderDetailId}/cancel`,
        cancelData,
        'Lỗi khi hủy đơn hàng.',
        'POST'
    );
