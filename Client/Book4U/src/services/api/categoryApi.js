import axiosPublic from '../../utils/api/axiosPublic.js';
import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const CATEGORY_API_URL = 'api/categories';

export const getAllCategories = (params) =>
    fetchHandler(
        axiosPublic,
        CATEGORY_API_URL,
        params,
        'Lỗi khi lấy danh mục.'
    );

export const getCategoryById = (id) =>
    fetchHandler(
        axiosPublic,
        `${CATEGORY_API_URL}/${id}`,
        {},
        'Lỗi khi lấy chi tiết danh mục.'
    );

export const createCategory = (formData) =>
    fetchHandler(
        axiosPrivate,
        CATEGORY_API_URL,
        formData,
        'Lỗi khi tạo danh mục.',
        'POST',
        'multipart/form-data'
    );

export const updateCategory = (id, formData) =>
    fetchHandler(
        axiosPrivate,
        `${CATEGORY_API_URL}/${id}`,
        formData,
        'Lỗi khi cập nhật danh mục.',
        'PUT',
        'multipart/form-data'
    );

export const deleteCategory = (id) =>
    fetchHandler(
        axiosPrivate,
        `${CATEGORY_API_URL}/${id}`,
        {},
        'Lỗi khi xóa danh mục.',
        'DELETE'
    );
