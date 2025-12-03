import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { confirmOrder } from '../services/api/orderApi.js';
import { getSellerOrders } from '../services/api/sellerOrderApi.js';
import {
    formatOrderItem,
    getStatusDisplay,
    formatPrice,
} from '../utils/orderFormatting.js';

function SellerConfirmation() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [confirmingOrderId, setConfirmingOrderId] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState({});

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await getSellerOrders({ status: 'pending' });
            if (response.success) {
                setOrders(response.data || []);
            } else {
                toast.error(
                    response.message ||
                        'Lỗi tải danh sách đơn hàng chờ xác nhận'
                );
            }
        } catch (error) {
            toast.error('Lỗi tải danh sách đơn hàng chờ xác nhận');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = async (orderId) => {
        try {
            setConfirmingOrderId(orderId);

            // Gọi API confirm order
            const response = await confirmOrder(orderId);
            if (!response.success) {
                toast.error(response.message || 'Lỗi xác nhận đơn hàng');
                return;
            }

            const data = response.data;
            setSelectedWarehouse((prev) => ({
                ...prev,
                [orderId]: data.warehouseId?.name || 'Không rõ',
            }));

            toast.success(
                `Xác nhận thành công. Kho: ${data.warehouseId?.name || 'N/A'}`
            );
            fetchPendingOrders();
        } catch (error) {
            toast.error('Lỗi xác nhận đơn hàng');
            console.error(error);
        } finally {
            setConfirmingOrderId(null);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6 text-center">
                <p className="text-gray-600">Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">Xác nhận đơn hàng</h1>
            <p className="text-gray-600 mb-6">
                {orders.length} đơn hàng chờ xác nhận
            </p>

            {orders.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-gray-500 text-lg">
                        ✅ Không có đơn hàng chờ xác nhận
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Order header */}
                            <div
                                className="p-4 border-b cursor-pointer hover:bg-gray-50 transition"
                                onClick={() =>
                                    setExpandedOrderId(
                                        expandedOrderId === order._id
                                            ? null
                                            : order._id
                                    )
                                }>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-bold text-lg">
                                            Đơn hàng #{order._id.slice(-8)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            📍 {order.shippingAddress?.address}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            👤 {order.shippingAddress?.fullName}{' '}
                                            - 📞 {order.shippingAddress?.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-red-500">
                                            {order.totalAmount?.toLocaleString()}
                                            ₫
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {expandedOrderId === order._id && (
                                <div className="p-6 bg-gray-50 space-y-6">
                                    {/* Order items */}
                                    <div>
                                        <h3 className="font-bold text-lg mb-4">
                                            📦 Chi tiết sản phẩm
                                        </h3>
                                        <div className="space-y-3">
                                            {order.items?.map((item, idx) => {
                                                const formatted =
                                                    formatOrderItem(item);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-white p-4 rounded-lg border flex gap-4">
                                                        <div className="flex-1">
                                                            <p className="font-bold">
                                                                {
                                                                    formatted.bookTitle
                                                                }
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Số lượng:{' '}
                                                                <strong>
                                                                    {
                                                                        formatted.quantity
                                                                    }
                                                                </strong>
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Đơn giá:{' '}
                                                                <strong>
                                                                    {formatPrice(
                                                                        formatted.price
                                                                    )}
                                                                </strong>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-red-500">
                                                                {formatPrice(
                                                                    formatted.subtotal
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Customer info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h4 className="font-bold mb-2">
                                                📍 Địa chỉ nhận hàng
                                            </h4>
                                            <p className="text-sm">
                                                {
                                                    order.shippingAddress
                                                        ?.fullName
                                                }
                                            </p>
                                            <p className="text-sm">
                                                📞{' '}
                                                {order.shippingAddress?.phone}
                                            </p>
                                            <p className="text-sm">
                                                {order.shippingAddress?.address}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h4 className="font-bold mb-2">
                                                💳 Phương thức thanh toán
                                            </h4>
                                            <p className="text-sm">
                                                {order.paymentMethod === 'COD'
                                                    ? 'Thanh toán khi nhận hàng'
                                                    : order.paymentMethod ===
                                                      'VNPAY'
                                                    ? 'Ví VNPAY'
                                                    : order.paymentMethod ===
                                                      'MOMO'
                                                    ? 'Ví MoMo'
                                                    : order.paymentMethod}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order summary */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Tạm tính:
                                                </span>
                                                <span className="font-semibold">
                                                    {order.subtotal?.toLocaleString() ||
                                                        0}
                                                    ₫
                                                </span>
                                            </div>
                                            {order.discountAmount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Giảm giá:</span>
                                                    <span>
                                                        -
                                                        {order.discountAmount?.toLocaleString()}
                                                        ₫
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="font-bold">
                                                    Tổng cộng:
                                                </span>
                                                <span className="text-lg font-bold text-red-500">
                                                    {order.totalAmount?.toLocaleString()}
                                                    ₫
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warehouse selection info */}
                                    {selectedWarehouse[order._id] && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-sm">
                                                <strong>
                                                    ✅ Kho được chọn:
                                                </strong>{' '}
                                                {selectedWarehouse[order._id]}
                                            </p>
                                        </div>
                                    )}

                                    {/* Confirm button */}
                                    <button
                                        onClick={() =>
                                            handleConfirmOrder(order._id)
                                        }
                                        disabled={
                                            confirmingOrderId === order._id ||
                                            selectedWarehouse[order._id]
                                        }
                                        className={`w-full py-3 rounded-lg font-bold transition ${
                                            selectedWarehouse[order._id]
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}>
                                        {confirmingOrderId === order._id
                                            ? '⏳ Đang xác nhận...'
                                            : selectedWarehouse[order._id]
                                            ? '✅ Đã xác nhận'
                                            : '✓ Xác nhận đơn hàng'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SellerConfirmation;
