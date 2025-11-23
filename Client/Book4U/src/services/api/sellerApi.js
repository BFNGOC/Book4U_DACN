import axiosPublic from '../../utils/api/axiosPublic.js';
import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const SELLER_API_URL = 'api/sellers';

// Public APIs
export const getSellerStore = (sellerId) =>
    fetchHandler(
        axiosPublic,
        `${SELLER_API_URL}/${sellerId}`,
        {},
        'Lỗi khi lấy thông tin cửa hàng.'
    );

export const getSellerProducts = (sellerId, params) =>
    fetchHandler(
        axiosPublic,
        `${SELLER_API_URL}/${sellerId}/products`,
        params,
        'Lỗi khi lấy danh sách sản phẩm.'
    );

// Private APIs (seller only)
export const getSellerDashboard = () =>
    fetchHandler(
        axiosPrivate,
        `${SELLER_API_URL}/dashboard/info`,
        {},
        'Lỗi khi lấy dashboard.'
    );

export const getSellerStats = (period = 'month') =>
    fetchHandler(
        axiosPrivate,
        `${SELLER_API_URL}/dashboard/stats`,
        { period },
        'Lỗi khi lấy thống kê.'
    );

export const updateSellerProfile = (data) =>
    fetchHandler(
        axiosPrivate,
        `${SELLER_API_URL}/profile/update`,
        data,
        'Lỗi khi cập nhật profile.',
        'PUT'
    );
