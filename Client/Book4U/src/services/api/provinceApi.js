import axiosPublic from '../../utils/api/axiosPublic.js';
import { fetchHandler } from './fetchHandler.js';

// ✅ Use backend proxy to avoid CORS issues
const BASE_URL = '/api/province';

export const provinceApi = {
    // 🔹 Lấy toàn bộ tỉnh/thành
    getAll: (depth = 3) =>
        fetchHandler(
            axiosPublic,
            `${BASE_URL}/all`,
            { depth },
            'Không thể tải danh sách tỉnh',
            'GET'
        ),

    // 🔹 Lấy quận/huyện theo mã tỉnh
    getDistricts: (provinceCode) =>
        fetchHandler(
            axiosPublic,
            `${BASE_URL}/districts/${provinceCode}`,
            { depth: 2 },
            'Không thể tải danh sách quận/huyện',
            'GET'
        ),

    // 🔹 Lấy phường/xã theo mã quận/huyện
    getWards: (districtCode) =>
        fetchHandler(
            axiosPublic,
            `${BASE_URL}/wards/${districtCode}`,
            { depth: 2 },
            'Không thể tải danh sách phường/xã',
            'GET'
        ),
};
