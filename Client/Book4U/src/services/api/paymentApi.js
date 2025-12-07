import axiosPrivate from '../../utils/api/axiosPrivate';
import { fetchHandler } from './fetchHandler';

const PAYMENT_API_URL = '/api/payment';

// Create VNPAY payment URL
export const createVNPayPayment = (orderId, amount) =>
    fetchHandler(
        axiosPrivate,
        `${PAYMENT_API_URL}/vnpay/create-payment-url`,
        { orderId, amount },
        'Lỗi tạo link thanh toán VNPAY',
        'POST'
    );

// Handle VNPAY callback
export const handleVNPayCallback = (queryParams) =>
    fetchHandler(
        axiosPrivate,
        `${PAYMENT_API_URL}/vnpay/callback`,
        queryParams,
        'Lỗi xử lý callback VNPAY',
        'POST'
    );

// Create MOMO payment
export const createMomoPayment = (orderId, amount) =>
    fetchHandler(
        axiosPrivate,
        `${PAYMENT_API_URL}/momo/create-payment`,
        { orderId, amount },
        'Lỗi tạo thanh toán MOMO',
        'POST'
    );

// Check payment status
export const checkPaymentStatus = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${PAYMENT_API_URL}/status/${orderId}`,
        {},
        'Lỗi kiểm tra trạng thái thanh toán'
    );
