import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const ORDER_SELLER_API_URL = 'api/seller-orders';

export const getSellerOrders = (params = {}) =>
    fetchHandler(
        axiosPrivate,
        ORDER_SELLER_API_URL,
        params,
        'Lỗi khi lấy danh sách đơn hàng.'
    );

export const getSellerOrderDetail = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}`,
        {},
        'Lỗi khi lấy chi tiết đơn hàng.'
    );

export const updateOrderStatus = (orderId, status) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/${orderId}/status`,
        { status },
        'Lỗi khi cập nhật trạng thái đơn hàng.',
        'PUT'
    );

export const getRevenueStats = (period = 'month') =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_SELLER_API_URL}/stats/revenue`,
        { period },
        'Lỗi khi lấy thống kê doanh thu.'
    );
