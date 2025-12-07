import axiosPrivate from '../../utils/api/axiosPrivate';
import { fetchHandler } from './fetchHandler';

const SHIPPER_API_URL = 'api/delivery';

// Get all orders assigned to shipper
export const getShipperOrders = (filters = {}) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_API_URL}/shipper/orders`,
        filters,
        'Lỗi lấy danh sách đơn hàng'
    );

// Update shipper's current location
export const updateShipperLocation = (location) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_API_URL}/shipper/location`,
        location,
        'Lỗi cập nhật vị trí',
        'POST'
    );

// Record delivery attempt
export const recordDeliveryAttempt = (orderId, attemptData) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_API_URL}/${orderId}/attempt`,
        attemptData,
        'Lỗi ghi nhận giao hàng',
        'POST'
    );

// Get order tracking
export const getOrderTracking = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_API_URL}/${orderId}/tracking`,
        {},
        'Lỗi lấy thông tin theo dõi'
    );

// Get delivery statistics for shipper
export const getShipperStats = () =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_API_URL}/shipper/stats`,
        {},
        'Lỗi lấy thống kê'
    );
