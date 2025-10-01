import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/user`;

export const requestOtp = async ({ email }) => {
    try {
        const res = await axios.post(
            `${API_URL}/request-otp`,
            { email },
            { withCredentials: true }
        );

        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi khi gửi mã OTP.';
        return { error: true, message };
    }
};

export const verifyOtp = async ({ otp }) => {
    try {
        const res = await axios.post(`${API_URL}/verify-otp`, { otp }, { withCredentials: true });

        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi khi xác thực mã OTP.';
        return { error: true, message };
    }
};

export const register = async ({ tempToken, password }) => {
    try {
        const res = await axios.post(`${API_URL}/register`, { tempToken, password });

        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký.';

        return { error: true, message: message };
    }
};

export const loginPassword = async (formData) => {
    try {
        const res = await axios.post(`${API_URL}/login-password`, formData);

        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập.';

        return { error: true, message: message };
    }
};

export const googleLogin = async (credential) => {
    try {
        const res = await axios.post(`${API_URL}/login-google`, { credential });
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập Google.';
        return { error: true, message };
    }
};

export const forgotPassword = async ({ email }) => {
    try {
        const res = await axios.post(`${API_URL}/forgot-password`, { email });
        return res.data;
    } catch (error) {
        const message =
            error.response?.data?.message || 'Đã xảy ra lỗi khi yêu cầu đặt lại mật khẩu.';
        return { error: true, message };
    }
};

export const resetPassword = async ({ token, newPassword }) => {
    try {
        const res = await axios.post(`${API_URL}/reset-password`, { token, newPassword });
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu.';
        return { error: true, message };
    }
};
