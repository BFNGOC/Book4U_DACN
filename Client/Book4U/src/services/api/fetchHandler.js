// src/services/api/fetchHandler.js
export const fetchHandler = async (axiosInstance, endpoint, queryParams, errorMsg) => {
    try {
        const res = await axiosInstance.get(endpoint, { params: queryParams });
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
