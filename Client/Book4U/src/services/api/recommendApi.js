import axiosPrivate from '../../utils/api/axiosPrivate.js';
const RECOMMEND_API_URL = 'api/recommend';
import { fetchHandler } from './fetchHandler.js';

export const getUserRecommendations = (params) =>
    fetchHandler(
        axiosPrivate,
        `${RECOMMEND_API_URL}/user`,
        params,
        'Lỗi khi lấy đề xuất cho người dùng.'
    );
