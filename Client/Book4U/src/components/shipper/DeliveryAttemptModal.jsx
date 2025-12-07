import { useState } from 'react';

export default function DeliveryAttemptModal({ order, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        status: 'success',
        reason: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(order._id, formData);
        } finally {
            setLoading(false);
        }
    };

    const lastAttempt =
        order.deliveryAttempts?.[order.deliveryAttempts.length - 1];
    const currentAttempt = (lastAttempt?.attemptNumber || 0) + 1;
    const canRetry = currentAttempt <= (order.maxDeliveryAttempts || 3);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                        📍 Ghi Nhận Giao Hàng
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        Lần giao: {currentAttempt} /{' '}
                        {order.maxDeliveryAttempts || 3}
                    </p>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Order Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold">Gửi tới:</span>{' '}
                            {order.shippingAddress?.fullName}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold">Địa chỉ:</span>{' '}
                            {order.shippingAddress?.address}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Số tiền:</span>{' '}
                            {order.totalAmount?.toLocaleString('vi-VN')} ₫
                        </p>
                    </div>

                    {/* Status Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Kết Quả Giao Hàng
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="status"
                                    value="success"
                                    checked={formData.status === 'success'}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-green-500"
                                />
                                <span className="ml-3">
                                    <span className="text-sm font-medium text-gray-900">
                                        ✅ Giao thành công
                                    </span>
                                </span>
                            </label>

                            {canRetry &&
                                currentAttempt <
                                    (order.maxDeliveryAttempts || 3) && (
                                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="failed"
                                            checked={
                                                formData.status === 'failed'
                                            }
                                            onChange={handleChange}
                                            className="w-4 h-4 text-red-500"
                                        />
                                        <span className="ml-3">
                                            <span className="text-sm font-medium text-gray-900">
                                                ❌ Giao không thành công (sẽ
                                                giao lại)
                                            </span>
                                        </span>
                                    </label>
                                )}
                        </div>
                    </div>

                    {/* Reason (if failed) */}
                    {formData.status === 'failed' && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Lý Do Thất Bại
                            </label>
                            <select
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">-- Chọn lý do --</option>
                                <option value="Không có người nhận">
                                    Không có người nhận
                                </option>
                                <option value="Khách từ chối">
                                    Khách từ chối
                                </option>
                                <option value="Địa chỉ sai">Địa chỉ sai</option>
                                <option value="Khách yêu cầu liên hệ lại">
                                    Khách yêu cầu liên hệ lại
                                </option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Ghi Chú (Tùy Chọn)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Nhập ghi chú thêm..."
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                (!formData.reason &&
                                    formData.status === 'failed')
                            }
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Đang lưu...' : 'Xác Nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
