import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    createVNPayPayment,
    createMomoPayment,
} from '../../services/api/paymentApi';

export default function PaymentModal({ order, onClose, onSuccess }) {
    const [method, setMethod] = useState('COD'); // COD, VNPAY, MOMO
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (method === 'COD') {
            // COD không cần xử lý thanh toán, chỉ ghi nhận
            onSuccess();
            return;
        }

        setLoading(true);
        try {
            let response;

            if (method === 'VNPAY') {
                response = await createVNPayPayment(
                    order._id,
                    order.totalAmount
                );
                if (response.success && response.data.paymentUrl) {
                    // Redirect to VNPAY
                    window.location.href = response.data.paymentUrl;
                    return;
                }
            } else if (method === 'MOMO') {
                response = await createMomoPayment(
                    order._id,
                    order.totalAmount
                );
                if (response.success && response.data.paymentUrl) {
                    // Redirect to MOMO
                    window.location.href = response.data.paymentUrl;
                    return;
                }
            }

            toast.error(response?.message || 'Lỗi xử lý thanh toán');
        } catch (error) {
            toast.error('Lỗi kết nối');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                        💳 Chọn Phương Thức Thanh Toán
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-1">
                            Tổng số tiền
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                            {order.totalAmount?.toLocaleString('vi-VN')} ₫
                        </p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 mb-6">
                        {[
                            {
                                id: 'COD',
                                name: 'Thanh Toán Khi Nhận Hàng',
                                icon: '💵',
                                desc: 'Thanh toán tiền mặt khi nhận hàng',
                            },
                            {
                                id: 'VNPAY',
                                name: 'VNPAY',
                                icon: '🏦',
                                desc: 'Chuyển khoản ngân hàng qua VNPAY',
                            },
                            {
                                id: 'MOMO',
                                name: 'MOMO',
                                icon: '📱',
                                desc: 'Thanh toán qua ví điện tử MOMO',
                            },
                        ].map((m) => (
                            <label
                                key={m.id}
                                className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                                <input
                                    type="radio"
                                    name="payment"
                                    value={m.id}
                                    checked={method === m.id}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="w-4 h-4 text-blue-500 mt-1"
                                />
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-2">
                                            {m.icon}
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            {m.name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {m.desc}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50">
                            Hủy
                        </button>
                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Đang xử lý...' : 'Tiếp Tục'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
