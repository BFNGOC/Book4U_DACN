import axiosPublic from '../../utils/api/axiosPublic.js';
import { fetchHandler } from './fetchHandler.js';

const BASE_URL = import.meta.env.VITE_BANK_API;

export const bankApi = {
    // 🔹 Lấy toàn bộ ngân hàng Việt Nam
    getAll: async () => {
        const res = await fetchHandler(
            axiosPublic,
            `${BASE_URL}/banks`,
            {},
            'Không thể tải danh sách ngân hàng',
            'GET'
        );

        // Vì API VietQR trả về { code, desc, data }
        // => ta return về dạng đồng nhất để component dùng dễ hơn
        return {
            ...res,
            data: res?.data?.data || res?.data || [], // đảm bảo đúng format
        };
    },

    // 🔹 Lấy thông tin 1 ngân hàng theo mã (VD: "VCB", "TCB", ...)
    getByCode: async (bankCode) => {
        const res = await fetchHandler(
            axiosPublic,
            `${BASE_URL}/banks/${bankCode}`,
            {},
            'Không thể tải thông tin ngân hàng',
            'GET'
        );

        return {
            ...res,
            data: res?.data?.data || res?.data || {},
        };
    },
};
