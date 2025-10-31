import axiosPublic from '../../utils/api/axiosPublic.js';
import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const ROLE_REQUEST_API_URL = 'api/role-requests';

// [POST] /api/role-requests — người dùng gửi yêu cầu (seller / shipper)
export const createRoleRequest = (data) =>
    fetchHandler(
        axiosPrivate,
        ROLE_REQUEST_API_URL,
        data,
        'Lỗi khi gửi yêu cầu đăng ký vai trò.',
        'POST'
    );

// [GET] /api/role-requests/me — người dùng lấy danh sách yêu cầu của mình
export const getMyRoleRequests = () =>
    fetchHandler(
        axiosPrivate,
        `${ROLE_REQUEST_API_URL}/me`,
        {},
        'Lỗi khi lấy danh sách yêu cầu của bạn.'
    );

// [GET] /api/role-requests — admin lấy tất cả yêu cầu
export const getAllRoleRequests = (params) =>
    fetchHandler(
        axiosPrivate,
        ROLE_REQUEST_API_URL,
        params,
        'Lỗi khi lấy danh sách yêu cầu.',
        'GET'
    );

// [PATCH] /api/role-requests/:id/approve — admin phê duyệt yêu cầu
export const approveRoleRequest = (id) =>
    fetchHandler(
        axiosPrivate,
        `${ROLE_REQUEST_API_URL}/${id}/approve`,
        {},
        'Lỗi khi phê duyệt yêu cầu.',
        'PATCH'
    );

// [PATCH] /api/role-requests/:id/reject — admin từ chối yêu cầu
export const rejectRoleRequest = (id, data = {}) =>
    fetchHandler(
        axiosPrivate,
        `${ROLE_REQUEST_API_URL}/${id}/reject`,
        data,
        'Lỗi khi từ chối yêu cầu.',
        'PATCH'
    );
