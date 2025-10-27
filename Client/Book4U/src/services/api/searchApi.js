import axiosPublic from '../../utils/api/axiosPublic.js';
import { fetchHandler } from './fetchHandler.js';
const SEARCH_API_URL = 'api/search';

export const suggestBooks = (params) =>
    fetchHandler(axiosPublic, `${SEARCH_API_URL}/suggest`, params, 'Lỗi khi tìm kiếm sách.');

export const getSearchResults = (params) =>
    fetchHandler(axiosPublic, `${SEARCH_API_URL}`, params, 'Lỗi khi lấy kết quả tìm kiếm.');
