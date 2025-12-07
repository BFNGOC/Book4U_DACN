import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderTracking } from '../../services/api/shipperApi';

export default function OrderTracking() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTracking();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchTracking, 10000);
        return () => clearInterval(interval);
    }, [orderId]);

    const fetchTracking = async () => {
        try {
            const response = await getOrderTracking(orderId);
            if (response.success) {
                setOrder(response.data);
            }
        } catch (error) {
            console.error('Error fetching tracking:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Đang tải...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Không tìm thấy đơn hàng</p>
            </div>
        );
    }

    const statuses = [
        { key: 'pending', label: '📋 Đợi Xác Nhận', icon: '⏳' },
        { key: 'confirmed', label: '✅ Đã Xác Nhận', icon: '✓' },
        { key: 'picking', label: '📦 Lấy Hàng', icon: '📦' },
        { key: 'packed', label: '📮 Đóng Gói', icon: '📮' },
        { key: 'in_transit', label: '🚚 Đang Giao', icon: '🚚' },
        { key: 'completed', label: '🎉 Đã Giao', icon: '✅' },
    ];

    const currentStatusIndex = statuses.findIndex(
        (s) => s.key === order.status
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <p className="text-sm text-gray-500 mb-2">
                        Mã đơn: {orderId?.slice(-8)}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Theo Dõi Đơn Hàng
                    </h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Gửi Tới</p>
                            <p className="font-semibold text-gray-900">
                                {order.shippingAddress?.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                                {order.shippingAddress?.phone}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Số Tiền</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {order.totalAmount?.toLocaleString('vi-VN')} ₫
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="relative">
                        {statuses.map((status, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;

                            return (
                                <div
                                    key={status.key}
                                    className="mb-8 last:mb-0">
                                    <div className="flex items-start">
                                        {/* Timeline Dot */}
                                        <div
                                            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                                                isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isCurrent
                                                    ? 'bg-blue-500 text-white animate-pulse'
                                                    : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {status.icon}
                                        </div>

                                        {/* Timeline Line */}
                                        {index < statuses.length - 1 && (
                                            <div
                                                className={`absolute left-6 top-12 w-1 h-12 transition ${
                                                    isCompleted
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-200'
                                                }`}></div>
                                        )}

                                        {/* Content */}
                                        <div className="ml-6 pt-1">
                                            <p className="font-semibold text-gray-900">
                                                {status.label}
                                            </p>
                                            {isCompleted && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    ✓ Hoàn thành
                                                </p>
                                            )}
                                            {isCurrent && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    🔄 Đang xử lý...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Delivery Attempts */}
                {order.deliveryAttempts?.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mt-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            📝 Lịch Sử Giao Hàng
                        </h2>
                        <div className="space-y-4">
                            {order.deliveryAttempts.map((attempt, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-semibold text-gray-900">
                                            Lần giao {attempt.attemptNumber}
                                        </p>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                attempt.status === 'success'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                            {attempt.status === 'success'
                                                ? '✅ Thành công'
                                                : '❌ Thất bại'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {new Date(
                                            attempt.timestamp
                                        ).toLocaleString('vi-VN')}
                                    </p>
                                    {attempt.reason && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            <span className="font-medium">
                                                Lý do:
                                            </span>{' '}
                                            {attempt.reason}
                                        </p>
                                    )}
                                    {attempt.notes && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            <span className="font-medium">
                                                Ghi chú:
                                            </span>{' '}
                                            {attempt.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Location */}
                {order.currentLocation && (
                    <div className="bg-white rounded-lg shadow p-6 mt-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            📍 Vị Trí Hiện Tại
                        </h2>
                        <p className="text-gray-600">
                            {order.currentLocation.address ||
                                `${order.currentLocation.latitude.toFixed(
                                    4
                                )}, ${order.currentLocation.longitude.toFixed(
                                    4
                                )}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Cập nhật lúc:{' '}
                            {new Date(
                                order.currentLocation.timestamp || Date.now()
                            ).toLocaleString('vi-VN')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
