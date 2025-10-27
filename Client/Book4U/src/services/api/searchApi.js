import axiosPublic from '../../utils/api/axiosPublic.js';

const API_URL = 'api/search';

const fetchBooks = async (endpoint, queryParams, errorMsg) => {
    try {
        const res = await axiosPublic.get(endpoint, { params: queryParams });
        return {
            success: true,
            data: res.data.data || [],
            meta: res.data.meta || {},
        };
    } catch (err) {
        console.error(`❌ Lỗi khi gọi API ${endpoint}:`, err);
        return {
            success: false,
            data: [],
            meta: {},
            message: err.response?.data?.message || errorMsg,
        };
    }
};

export const suggestBooks = (params) =>
    fetchBooks(`${API_URL}/suggest`, params, 'Lỗi khi tìm kiếm sách.');

export const getSearchResults = (params) =>
    fetchBooks(`${API_URL}`, params, 'Lỗi khi lấy kết quả tìm kiếm.');
