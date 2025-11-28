import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const WAREHOUSE_API_URL = 'api/warehouse';

/**
 * ==========================================
 * WAREHOUSE API SERVICE
 * ==========================================
 *
 * Quản lý kho hàng cho seller
 */

// ============ WAREHOUSE CRUD ============

/**
 * Tạo kho mới
 * POST /api/warehouse/warehouses
 */
export const createWarehouse = (data) =>
    fetchHandler(
        axiosPrivate,
        `${WAREHOUSE_API_URL}/warehouses`,
        data,
        'Lỗi khi tạo kho hàng',
        'POST'
    );

/**
 * Lấy danh sách kho của seller
 * GET /api/warehouse/warehouses
 */
export const getWarehousesBySeller = () =>
    fetchHandler(
        axiosPrivate,
        `${WAREHOUSE_API_URL}/warehouses`,
        {},
        'Lỗi khi lấy danh sách kho'
    );

// ============ STOCK OPERATIONS ============

/**
 * Nhập kho
 * POST /api/warehouse/import-stock
 *
 * Body:
 * {
 *   warehouseId: ObjectId,
 *   bookId: ObjectId,
 *   quantity: number,
 *   reason?: string
 * }
 */
export const importStock = (data) =>
    fetchHandler(
        axiosPrivate,
        `${WAREHOUSE_API_URL}/import-stock`,
        data,
        'Lỗi khi nhập kho',
        'POST'
    );

/**
 * Xuất kho
 * POST /api/warehouse/export-stock
 *
 * Body:
 * {
 *   warehouseId: ObjectId,
 *   bookId: ObjectId,
 *   quantity: number,
 *   reason?: string
 * }
 */
export const exportStock = (data) =>
    fetchHandler(
        axiosPrivate,
        `${WAREHOUSE_API_URL}/export-stock`,
        data,
        'Lỗi khi xuất kho',
        'POST'
    );

// ============ LOGS & HISTORY ============

/**
 * Lấy lịch sử nhập/xuất kho
 * GET /api/warehouse/logs
 *
 * Query params:
 * {
 *   warehouseId?: ObjectId,
 *   type?: 'import' | 'export' | 'order_create' | 'order_cancel',
 *   page?: number,
 *   limit?: number
 * }
 */
export const getWarehouseLogs = (params = {}) =>
    fetchHandler(
        axiosPrivate,
        `${WAREHOUSE_API_URL}/logs`,
        params,
        'Lỗi khi lấy lịch sử kho'
    );

/**
 * Lấy tổng kho của sản phẩm trên tất cả kho
 * GET /api/warehouse/product/:bookId/stock
 */
export const getProductTotalStock = (bookId) =>
    fetchHandler(
        axiosPrivate,
        `${WAREHOUSE_API_URL}/product/${bookId}/stock`,
        {},
        'Lỗi khi lấy tồn kho sản phẩm'
    );

// ============ ORDER STOCK OPERATIONS ============

/**
 * Kiểm tra stock trước tạo đơn
 * POST /api/orders/validate-stock
 *
 * Body:
 * {
 *   items: [
 *     {
 *       bookId: ObjectId,
 *       quantity: number,
 *       sellerId: ObjectId
 *     }
 *   ]
 * }
 */
export const validateStockBeforeOrder = (data) =>
    fetchHandler(
        axiosPrivate,
        'api/orders/validate-stock',
        data,
        'Lỗi khi kiểm tra stock',
        'POST'
    );

/**
 * Tạo đơn hàng (trừ stock tự động)
 * POST /api/orders/create
 *
 * Body:
 * {
 *   profileId: ObjectId,
 *   items: [
 *     {
 *       bookId: ObjectId,
 *       sellerId: ObjectId,
 *       quantity: number
 *     }
 *   ],
 *   totalAmount: number,
 *   paymentMethod: string,
 *   shippingAddress: object
 * }
 */
export const createOrder = (data) =>
    fetchHandler(
        axiosPrivate,
        'api/orders/create',
        data,
        'Lỗi khi tạo đơn hàng',
        'POST'
    );

/**
 * Hủy đơn hàng (hoàn stock)
 * POST /api/orders/:orderId/cancel
 *
 * Body:
 * {
 *   reason?: string
 * }
 */
export const cancelOrder = (orderId, data = {}) =>
    fetchHandler(
        axiosPrivate,
        `api/orders/${orderId}/cancel`,
        data,
        'Lỗi khi hủy đơn hàng',
        'POST'
    );

/**
 * Lấy chi tiết đơn hàng
 * GET /api/orders/:orderId
 */
export const getOrder = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `api/orders/${orderId}`,
        {},
        'Lỗi khi lấy chi tiết đơn hàng'
    );

/**
 * Lấy danh sách đơn của khách hàng
 * GET /api/orders/user/:profileId
 *
 * Query params:
 * {
 *   status?: string,
 *   page?: number,
 *   limit?: number
 * }
 */
export const getCustomerOrders = (profileId, params = {}) =>
    fetchHandler(
        axiosPrivate,
        `api/orders/user/${profileId}`,
        params,
        'Lỗi khi lấy danh sách đơn hàng'
    );
