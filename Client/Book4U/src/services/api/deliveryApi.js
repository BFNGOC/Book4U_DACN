import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const DELIVERY_API_URL = 'api/delivery';

// Lấy thông tin tracking/vận chuyển của đơn hàng
export const getDeliveryInfo = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${DELIVERY_API_URL}/${orderId}`,
        {},
        'Lỗi khi lấy thông tin vận chuyển.'
    );

// Cập nhật vị trí GPS của đơn hàng (shipper)
export const updateDeliveryLocation = (orderId, latitude, longitude, address) =>
    fetchHandler(
        axiosPrivate,
        `${DELIVERY_API_URL}/${orderId}/location`,
        { latitude, longitude, address },
        'Lỗi khi cập nhật vị trí giao hàng.',
        'PUT'
    );

// Ghi nhận lần giao hàng (shipper)
export const recordDeliveryAttempt = (orderId, success, reason, notes) =>
    fetchHandler(
        axiosPrivate,
        `${DELIVERY_API_URL}/${orderId}/attempt`,
        { success, reason, notes },
        'Lỗi khi ghi nhận lần giao hàng.',
        'PUT'
    );

// Cập nhật trạng thái vận chuyển
export const updateDeliveryStatus = (orderId, status) =>
    fetchHandler(
        axiosPrivate,
        `${DELIVERY_API_URL}/${orderId}/status`,
        { status },
        'Lỗi khi cập nhật trạng thái vận chuyển.',
        'PUT'
    );

// Lấy lịch sử tracking (timeline)
export const getTrackingTimeline = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${DELIVERY_API_URL}/${orderId}/timeline`,
        {},
        'Lỗi khi lấy lịch sử tracking.'
    );
