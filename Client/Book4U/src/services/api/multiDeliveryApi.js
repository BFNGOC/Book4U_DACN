import axiosPublic from '../../utils/api/axiosPublic.js';
import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

/**
 * ============================================================
 * MULTI-STAGE DELIVERY API SERVICE
 * ============================================================
 * Quản lý tất cả API calls liên quan đến vận chuyển đa giai đoạn
 */

const MULTI_DELIVERY_API_URL = 'api/multi-delivery';
const SHIPPER_COVERAGE_API_URL = 'api/shipper-coverage';

/**
 * ============================================================
 * MULTI-STAGE DELIVERY APIs
 * ============================================================
 */

/**
 * Tạo delivery stages khi order được ship (nội tỉnh = 1 stage, liên tỉnh = 3 stages)
 * POST /api/multi-delivery/stages/create
 *
 * @param {Object} data - {orderDetailId, fromWarehouse, toCustomer}
 * @returns {Promise}
 */
export const createDeliveryStages = (data) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/stages/create`,
        data,
        'Lỗi khi tạo giai đoạn vận chuyển.',
        'POST'
    );

/**
 * Lấy tất cả delivery stages của một order
 * GET /api/multi-delivery/stages/:orderDetailId
 *
 * @param {string} orderDetailId - ID của order detail
 * @returns {Promise}
 */
export const getDeliveryStages = (orderDetailId) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/stages/${orderDetailId}`,
        {},
        'Lỗi khi lấy giai đoạn vận chuyển.'
    );

/**
 * Shipper chấp nhận nhận đơn hàng ở giai đoạn này
 * PUT /api/multi-delivery/stages/:stageId/accept
 *
 * @param {string} stageId - ID của delivery stage
 * @returns {Promise}
 */
export const acceptDeliveryStage = (stageId) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/stages/${stageId}/accept`,
        {},
        'Lỗi khi chấp nhận đơn hàng.',
        'PUT'
    );

/**
 * Shipper lấy hàng từ vị trí cũ
 * PUT /api/multi-delivery/stages/:stageId/pickup
 *
 * @param {string} stageId - ID của delivery stage
 * @param {Object} location - {latitude, longitude, address}
 * @returns {Promise}
 */
export const pickupPackage = (stageId, location) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/stages/${stageId}/pickup`,
        location,
        'Lỗi khi lấy hàng.',
        'PUT'
    );

/**
 * Cập nhật vị trí hiện tại của shipper (realtime tracking)
 * PUT /api/multi-delivery/stages/:stageId/location
 *
 * @param {string} stageId - ID của delivery stage
 * @param {Object} locationData - {latitude, longitude, address, status (optional)}
 * @returns {Promise}
 */
export const updateShipperLocation = (stageId, locationData) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/stages/${stageId}/location`,
        locationData,
        'Lỗi khi cập nhật vị trí shipper.',
        'PUT'
    );

/**
 * Hoàn thành giai đoạn vận chuyển
 * PUT /api/multi-delivery/stages/:stageId/complete
 *
 * @param {string} stageId - ID của delivery stage
 * @param {Object} deliveryData - {latitude, longitude, address, notes (optional)}
 * @returns {Promise}
 */
export const completeDeliveryStage = (stageId, deliveryData) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/stages/${stageId}/complete`,
        deliveryData,
        'Lỗi khi hoàn thành giai đoạn vận chuyển.',
        'PUT'
    );

/**
 * Lấy danh sách đơn hàng chờ pickup cho shipper (lọc theo coverage area)
 * GET /api/multi-delivery/shipper/orders
 *
 * @param {Object} params - Query parameters (page, limit, etc.)
 * @returns {Promise}
 */
export const getShipperOrders = (params = {}) =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/shipper/orders`,
        params,
        'Lỗi khi lấy danh sách đơn hàng chờ pickup.'
    );

/**
 * Lấy danh sách delivery stages đã assigned cho shipper
 * GET /api/multi-delivery/shipper/assigned
 *
 * @returns {Promise}
 */
export const getShipperAssignedOrders = () =>
    fetchHandler(
        axiosPrivate,
        `${MULTI_DELIVERY_API_URL}/shipper/assigned`,
        {},
        'Lỗi khi lấy danh sách đơn hàng được giao.'
    );

/**
 * Khách hàng theo dõi đơn hàng realtime (xem tất cả stages + vị trí)
 * GET /api/multi-delivery/track/:orderDetailId
 * Public endpoint - không cần authentication
 *
 * @param {string} orderDetailId - ID của order detail
 * @returns {Promise}
 */
export const trackOrderRealtime = (orderDetailId) =>
    fetchHandler(
        axiosPublic,
        `${MULTI_DELIVERY_API_URL}/track/${orderDetailId}`,
        {},
        'Lỗi khi theo dõi đơn hàng.'
    );

/**
 * ============================================================
 * SHIPPER COVERAGE AREA APIs (Admin)
 * ============================================================
 */

/**
 * Admin tạo hoặc cập nhật coverage area cho shipper
 * POST /api/shipper-coverage/create
 *
 * @param {Object} data - Shipper coverage configuration
 * @returns {Promise}
 */
export const createOrUpdateCoverageArea = (data) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_COVERAGE_API_URL}/create`,
        data,
        'Lỗi khi tạo/cập nhật khu vực phục vụ.',
        'POST'
    );

/**
 * Lấy khu vực phục vụ của shipper
 * GET /api/shipper-coverage/:shipperId
 *
 * @param {string} shipperId - ID của shipper
 * @returns {Promise}
 */
export const getCoverageArea = (shipperId) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_COVERAGE_API_URL}/${shipperId}`,
        {},
        'Lỗi khi lấy khu vực phục vụ.'
    );

/**
 * Lấy danh sách shippers phục vụ tỉnh nào đó
 * GET /api/shipper-coverage/province/:province
 * Public endpoint
 *
 * @param {string} province - Tên tỉnh/thành phố
 * @returns {Promise}
 */
export const getShippersForProvince = (province) =>
    fetchHandler(
        axiosPublic,
        `${SHIPPER_COVERAGE_API_URL}/province/${province}`,
        {},
        'Lỗi khi lấy danh sách shippers.'
    );

/**
 * Cập nhật vị trí + online status của shipper
 * PUT /api/shipper-coverage/:shipperId/location
 *
 * @param {string} shipperId - ID của shipper
 * @param {Object} locationData - {latitude, longitude, isOnline}
 * @returns {Promise}
 */
export const updateCoverageShipperLocation = (shipperId, locationData) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_COVERAGE_API_URL}/${shipperId}/location`,
        locationData,
        'Lỗi khi cập nhật vị trí shipper.',
        'PUT'
    );

/**
 * Cập nhật status shipper (active, inactive, suspended)
 * PUT /api/shipper-coverage/:shipperId/status
 *
 * @param {string} shipperId - ID của shipper
 * @param {Object} data - {status}
 * @returns {Promise}
 */
export const updateShipperStatus = (shipperId, data) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_COVERAGE_API_URL}/${shipperId}/status`,
        data,
        'Lỗi khi cập nhật status shipper.',
        'PUT'
    );

/**
 * Cập nhật công suất đơn hàng của shipper
 * PUT /api/shipper-coverage/:shipperId/orders-capacity
 *
 * @param {string} shipperId - ID của shipper
 * @param {Object} data - {currentActiveOrders, maxOrdersPerDay}
 * @returns {Promise}
 */
export const updateOrdersCapacity = (shipperId, data) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_COVERAGE_API_URL}/${shipperId}/orders-capacity`,
        data,
        'Lỗi khi cập nhật công suất đơn hàng.',
        'PUT'
    );

/**
 * Cập nhật hiệu suất của shipper
 * PUT /api/shipper-coverage/:shipperId/performance
 *
 * @param {string} shipperId - ID của shipper
 * @param {Object} data - {totalDeliveries, successfulDeliveries, averageRating, onTimeDeliveryRate}
 * @returns {Promise}
 */
export const updateShipperPerformance = (shipperId, data) =>
    fetchHandler(
        axiosPrivate,
        `${SHIPPER_COVERAGE_API_URL}/${shipperId}/performance`,
        data,
        'Lỗi khi cập nhật hiệu suất shipper.',
        'PUT'
    );

/**
 * ============================================================
 * EXPORTED OBJECT (For backward compatibility)
 * ============================================================
 */
export const multiDeliveryApi = {
    // Multi-Stage Delivery
    createDeliveryStages,
    getDeliveryStages,
    acceptDeliveryStage,
    pickupPackage,
    updateShipperLocation,
    completeDeliveryStage,
    getShipperOrders,
    getShipperAssignedOrders,
    trackOrderRealtime,

    // Shipper Coverage
    createOrUpdateCoverageArea,
    getCoverageArea,
    getShippersForProvince,
    updateCoverageShipperLocation,
    updateShipperStatus,
    updateOrdersCapacity,
    updateShipperPerformance,
};

export default multiDeliveryApi;
