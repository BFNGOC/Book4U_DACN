import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const ORDER_API_URL = 'api/orders';

// Tạo đơn hàng mới (status = pending)
export const createOrder = (orderData) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/create`,
        orderData,
        'Lỗi khi tạo đơn hàng.',
        'POST'
    );

// Validate stock trước khi tạo đơn
export const validateStock = (items) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/validate-stock`,
        { items },
        'Lỗi khi kiểm tra tồn kho.',
        'POST'
    );

// Lấy chi tiết đơn hàng
export const getOrderDetail = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/${orderId}`,
        {},
        'Lỗi khi lấy chi tiết đơn hàng.'
    );

// Lấy danh sách đơn hàng của khách hàng
export const getUserOrders = (profileId, filters = {}) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/user/${profileId}`,
        filters,
        'Lỗi khi lấy danh sách đơn hàng.'
    );

// Hủy đơn hàng
export const cancelOrder = (orderId, reason) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/${orderId}/cancel`,
        { reason },
        'Lỗi khi hủy đơn hàng.',
        'POST'
    );

// Xác nhận đơn hàng từ seller (chuyển từ pending → confirmed, khấu trừ stock)
// Mục tiêu: Auto-select nearest warehouse dựa trên customerLocation (geocoding)
export const confirmOrder = (orderId, customerLocation = null) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/${orderId}/confirm`,
        customerLocation ? { customerLocation } : {},
        'Lỗi khi xác nhận đơn hàng.',
        'POST'
    );

// Yêu cầu hoàn hàng
export const requestReturn = (orderId, reason) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/${orderId}/return/request`,
        { reason },
        'Lỗi khi gửi yêu cầu hoàn hàng.',
        'POST'
    );

// Duyệt/từ chối hoàn hàng (admin/seller)
export const approveReturn = (orderId, approved, reason) =>
    fetchHandler(
        axiosPrivate,
        `${ORDER_API_URL}/${orderId}/return/approve`,
        { approved, reason },
        'Lỗi khi duyệt hoàn hàng.',
        'POST'
    );
