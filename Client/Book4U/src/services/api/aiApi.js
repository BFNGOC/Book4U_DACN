import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const AI_API_URL = 'api/ai/';

export const chatAi = (bookData) =>
    fetchHandler(
        axiosPrivate,
        `${AI_API_URL}chat`,
        bookData,
        'Lỗi khi giao tiếp với AI.',
        'POST',
        'application/json'
    );

export const getAiChatHistory = () =>
    fetchHandler(axiosPrivate, `${AI_API_URL}history`, {}, 'Lỗi khi lấy lịch sử trò chuyện AI.');
