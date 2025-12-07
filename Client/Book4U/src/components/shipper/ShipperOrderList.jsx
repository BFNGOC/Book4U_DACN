import { useState } from 'react';
import { toast } from 'react-hot-toast';
import DeliveryAttemptModal from './DeliveryAttemptModal';
import { recordDeliveryAttempt } from '../../services/api/shipperApi';

export default function ShipperOrderList({ orders, onOrderUpdate }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');

    const filteredOrders = orders.filter((order) => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    const handleRecordAttempt = async (orderId, attemptData) => {
        try {
            const response = await recordDeliveryAttempt(orderId, attemptData);
            if (response.success) {
                toast.success('Ghi nhận giao hàng thành công');
                setShowModal(false);
                setSelectedOrder(null);
                onOrderUpdate();
            } else {
                toast.error(response.message || 'Lỗi ghi nhận');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
            console.error(error);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            in_transit: {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                label: '🚚 Đang giao',
            },
            out_for_delivery: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                label: '📍 Đang giao hàng',
            },
            completed: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                label: '✅ Hoàn thành',
            },
            failed: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                label: '❌ Thất bại',
            },
        };
        return badges[status] || badges['in_transit'];
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Filter Tabs */}
            <div className="flex border-b">
                {[
                    { value: 'all', label: 'Tất Cả' },
                    { value: 'in_transit', label: 'Đang Giao' },
                    { value: 'out_for_delivery', label: 'Ra Giao' },
                    { value: 'completed', label: 'Hoàn Thành' },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`flex-1 px-4 py-4 font-medium text-center transition ${
                            filter === tab.value
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}>
                        {tab.label}
                        <span className="ml-2 text-sm">
                            (
                            {
                                orders.filter((o) =>
                                    tab.value === 'all'
                                        ? true
                                        : o.status === tab.value
                                ).length
                            }
                            )
                        </span>
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="divide-y">
                {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Không có đơn hàng nào
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const badge = getStatusBadge(order.status);
                        const lastAttempt =
                            order.deliveryAttempts?.[
                                order.deliveryAttempts.length - 1
                            ];

                        return (
                            <div
                                key={order._id}
                                className="p-6 hover:bg-gray-50 transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-mono text-sm text-gray-500">
                                            ID: {order._id.slice(-8)}
                                        </p>
                                        <h3 className="text-lg font-semibold text-gray-900 mt-1">
                                            {order.items?.[0]?.bookTitle ||
                                                'Sản phẩm'}
                                            {order.items?.length > 1 &&
                                                ` +${order.items.length - 1}`}
                                        </h3>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Gửi Đến
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {order.shippingAddress?.fullName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {order.shippingAddress?.phone}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {order.shippingAddress?.address}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Số Tiền
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {order.totalAmount?.toLocaleString(
                                                'vi-VN'
                                            )}{' '}
                                            ₫
                                        </p>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Thanh toán: {order.paymentMethod}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Lần Giao
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {lastAttempt?.attemptNumber || 0} /{' '}
                                            {order.maxDeliveryAttempts || 3}
                                        </p>
                                        {lastAttempt && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                {lastAttempt.status ===
                                                'success'
                                                    ? '✅ Thành công'
                                                    : `❌ ${
                                                          lastAttempt.reason ||
                                                          'Thất bại'
                                                      }`}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowModal(true);
                                        }}
                                        disabled={order.status === 'completed'}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                                            order.status === 'completed'
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}>
                                        📍 Ghi Nhận Giao Hàng
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Open in map or view details
                                            console.log('View on map:', order);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
                                        🗺️ Xem Bản Đồ
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delivery Attempt Modal */}
            {showModal && selectedOrder && (
                <DeliveryAttemptModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedOrder(null);
                    }}
                    onSubmit={handleRecordAttempt}
                />
            )}
        </div>
    );
}
