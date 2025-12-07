import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderDetail, requestReturn } from '../services/api/orderApi.js';
import OrderTracking from '../components/tracking/OrderTracking.jsx';
import {
    formatOrderItem,
    getStatusDisplay,
    formatPrice,
} from '../utils/orderFormatting.js';

function OrderDetail() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');

    const statusLabels = {
        pending: {
            label: '⏳ Chờ xác nhận',
            color: 'bg-yellow-100 text-yellow-800',
        },
        confirmed: {
            label: '✅ Đã xác nhận',
            color: 'bg-blue-100 text-blue-800',
        },
        picking: {
            label: '📦 Đang lấy hàng',
            color: 'bg-purple-100 text-purple-800',
        },
        packed: {
            label: '📮 Đã đóng gói',
            color: 'bg-orange-100 text-orange-800',
        },
        in_transit: {
            label: '🚚 Đang vận chuyển',
            color: 'bg-indigo-100 text-indigo-800',
        },
        out_for_delivery: {
            label: '🚴 Đang giao',
            color: 'bg-cyan-100 text-cyan-800',
        },
        completed: {
            label: '🎉 Đã giao',
            color: 'bg-green-100 text-green-800',
        },
        return_initiated: {
            label: '🔄 Chờ hoàn',
            color: 'bg-red-100 text-red-800',
        },
        returned: { label: '↩️ Đã hoàn', color: 'bg-gray-100 text-gray-800' },
        cancelled: { label: '❌ Hủy', color: 'bg-gray-100 text-gray-800' },
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            const response = await getOrderDetail(orderId);
            if (response.success) {
                setOrder(response.data);
            } else {
                toast.error(response.message || 'Lỗi tải chi tiết đơn hàng');
            }
        } catch (error) {
            toast.error('Lỗi tải chi tiết đơn hàng');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReturn = async () => {
        if (!returnReason.trim()) {
            toast.error('Vui lòng nhập lý do hoàn hàng');
            return;
        }

        try {
            const response = await requestReturn(orderId, returnReason);
            if (response.success) {
                toast.success('Yêu cầu hoàn hàng đã được gửi');
                setShowReturnModal(false);
                setReturnReason('');
                fetchOrderDetail();
            } else {
                toast.error(response.message || 'Lỗi gửi yêu cầu hoàn hàng');
            }
        } catch (error) {
            toast.error('Lỗi gửi yêu cầu hoàn hàng');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <p className="text-gray-600">Đang tải...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <p className="text-red-500 text-lg">Không tìm thấy đơn hàng</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Đơn hàng #{orderId}</h1>
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </p>
                    <span
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            statusLabels[order.status]?.color
                        }`}>
                        {statusLabels[order.status]?.label}
                    </span>
                </div>
            </div>

            {/* Tracking */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold mb-4">
                    Trạng thái vận chuyển
                </h2>
                <OrderTracking orderId={orderId} isCustomer={true} />
            </div>

            {/* Order items */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold mb-4">Thông tin đơn hàng</h2>
                <div className="space-y-4">
                    {order.items?.map((item, index) => {
                        const formatted = formatOrderItem(item);
                        return (
                            <div
                                key={index}
                                className="flex gap-4 p-4 border rounded-lg">
                                <div className="flex-1">
                                    <p className="font-bold">
                                        {formatted.bookTitle}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Số lượng: {formatted.quantity}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Bán bởi: {formatted.sellerName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-500">
                                        {formatPrice(formatted.subtotal)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Đơn giá: {formatPrice(formatted.price)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Order details */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Shipping address */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-bold mb-4">
                        📍 Địa chỉ nhận hàng
                    </h2>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>{order.shippingAddress?.fullName}</strong>
                        </p>
                        <p>📞 {order.shippingAddress?.phone}</p>
                        <p>{order.shippingAddress?.address}</p>
                    </div>
                </div>

                {/* Payment info */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-bold mb-4">💳 Thanh toán</h2>
                    <div className="space-y-2 text-sm">
                        <p>
                            Phương thức:{' '}
                            <strong>
                                {order.paymentMethod === 'COD'
                                    ? 'Thanh toán khi nhận hàng'
                                    : order.paymentMethod === 'VNPAY'
                                    ? 'Ví VNPAY'
                                    : order.paymentMethod === 'MOMO'
                                    ? 'Ví MoMo'
                                    : order.paymentMethod}
                            </strong>
                        </p>
                        {order.paymentStatus && (
                            <p>
                                Trạng thái:{' '}
                                {order.paymentStatus === 'paid'
                                    ? '✅ Đã thanh toán'
                                    : '⏳ Chưa thanh toán'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Order summary */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="space-y-2 text-sm mb-4 border-b pb-4">
                    <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span>{order.subtotal?.toLocaleString()}₫</span>
                    </div>
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Giảm giá:</span>
                            <span>
                                -{order.discountAmount?.toLocaleString()}₫
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span>
                            {order.shippingFee?.toLocaleString() || '0'}₫
                        </span>
                    </div>
                </div>
                <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-red-500">
                        {order.totalAmount?.toLocaleString()}₫
                    </span>
                </div>
            </div>

            {/* Actions */}
            {order.status === 'completed' &&
                order.return?.status !== 'approved' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <button
                            onClick={() => setShowReturnModal(true)}
                            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold">
                            🔄 Yêu cầu hoàn hàng
                        </button>
                    </div>
                )}

            {order.return?.status && (
                <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
                    <h3 className="font-bold mb-2">Yêu cầu hoàn hàng</h3>
                    <p className="text-sm text-gray-700 mb-2">
                        Lý do: {order.return.reason}
                    </p>
                    <p className="text-sm">
                        Trạng thái:
                        {order.return.status === 'pending' && ' ⏳ Chờ xử lý'}
                        {order.return.status === 'approved' &&
                            ' ✅ Đã chấp nhận'}
                        {order.return.status === 'rejected' && ' ❌ Đã từ chối'}
                    </p>
                </div>
            )}

            {/* Return modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">
                            Yêu cầu hoàn hàng
                        </h3>
                        <textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Vui lòng nhập lý do hoàn hàng..."
                            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:border-blue-500"
                            rows="4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowReturnModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
                                Hủy
                            </button>
                            <button
                                onClick={handleRequestReturn}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                                Gửi yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderDetail;
