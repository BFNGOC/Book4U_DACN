// src/services/api/fetchHandler.js
export const fetchHandler = async (
    axiosInstance,
    endpoint,
    data = {},
    errorMsg = 'Đã xảy ra lỗi.',
    method = 'GET',
    contentType = 'application/json'
) => {
    try {
        const config = {};

        // Nếu có contentType đặc biệt (vd: multipart/form-data)
        if (contentType) {
            config.headers = { 'Content-Type': contentType };
        }

        let res;
        switch (method.toUpperCase()) {
            case 'GET':
                res = await axiosInstance.get(endpoint, { params: data });
                break;
            case 'POST':
                res = await axiosInstance.post(endpoint, data, config);
                break;
            case 'PUT':
                res = await axiosInstance.put(endpoint, data, config);
                break;
            case 'PATCH':
                res = await axiosInstance.patch(endpoint, data, config);
                break;
            case 'DELETE':
                res = await axiosInstance.delete(endpoint, config);
                break;
            default:
                throw new Error(`Phương thức không được hỗ trợ: ${method}`);
        }

        return {
            success: true,
            data: res.data.data || res.data || {},
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
