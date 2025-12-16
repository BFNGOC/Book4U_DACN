import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

/**
 * ============================================================
 * SHIPPER DELIVERY MANAGEMENT COMPONENT
 * ============================================================
 * Shipper nhận và quản lý orders theo khu vực
 */

const ShipperDeliveryManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [acceptingId, setAcceptingId] = useState(null);

    useEffect(() => {
        fetchPendingOrders();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchPendingOrders, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const response = await multiDeliveryApi.getShipperOrders();
            if (response.success) {
                setOrders(response.data.pendingOrders || []);
                setError(null);
            }
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (stageId) => {
        try {
            setAcceptingId(stageId);
            const response = await multiDeliveryApi.acceptDeliveryStage(
                stageId
            );
            if (response.success) {
                // Cập nhật danh sách
                fetchPendingOrders();
                alert('Bạn đã chấp nhận đơn hàng này!');
            }
        } catch (err) {
            alert('Lỗi khi chấp nhận đơn hàng');
            console.error('Error accepting order:', err);
        } finally {
            setAcceptingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Đơn hàng chờ pickup
                </h2>
                <button
                    onClick={fetchPendingOrders}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Cập nhật
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Empty state */}
            {orders.length === 0 && !error && (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">
                        Không có đơn hàng nào chờ pickup
                    </p>
                    <p className="text-sm mt-1">Kiểm tra lại sau vài phút</p>
                </div>
            )}

            {/* Orders list */}
            <div className="grid gap-4">
                {orders.map((order) => (
                    <div
                        key={order._id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                        {/* Order header */}
                        <div
                            className="p-4 cursor-pointer bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200"
                            onClick={() =>
                                setExpandedOrder(
                                    expandedOrder === order._id
                                        ? null
                                        : order._id
                                )
                            }>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2">
                                        {`${
                                            order.orderDetailId?.mainOrderId
                                                ?.profileId?.firstName || ''
                                        } ${
                                            order.orderDetailId?.mainOrderId
                                                ?.profileId?.lastName || ''
                                        }`.trim()}
                                    </h3>
                                    <div className="space-y-1 text-sm text-gray-700">
                                        <p className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {order.toLocation?.province},{' '}
                                            {order.toLocation?.district}
                                        </p>
                                        <p>
                                            📞 {order.toLocation?.contactPhone}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">
                                        Giai đoạn {order.stageNumber}/
                                        {order.totalStages}
                                    </p>
                                    <p className="font-bold text-blue-600">
                                        {order.orderDetailId?.mainOrderId?.totalAmount?.toLocaleString(
                                            'vi-VN'
                                        ) || '0'}{' '}
                                        đ
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order details (expanded) */}
                        {expandedOrder === order._id && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                                {/* Delivery location */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                        📍 Giao tới
                                    </h4>
                                    <div className="bg-white p-3 rounded-lg text-sm text-gray-700">
                                        <p className="font-medium">
                                            {order.toLocation?.contactName}
                                        </p>
                                        <p>{order.toLocation?.address}</p>
                                        <p>
                                            {order.toLocation?.ward},{' '}
                                            {order.toLocation?.district}
                                        </p>
                                        <p className="font-medium text-blue-600 mt-1">
                                            {order.toLocation?.contactPhone}
                                        </p>
                                    </div>
                                </div>

                                {/* Pickup location */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                        📦 Lấy hàng tại
                                    </h4>
                                    <div className="bg-white p-3 rounded-lg text-sm text-gray-700">
                                        <p className="font-medium">
                                            {order.fromLocation?.warehouseName}
                                        </p>
                                        <p>{order.fromLocation?.address}</p>
                                    </div>
                                </div>

                                {/* Items preview */}
                                {order.orderDetailId?.items && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                            📚 Sản phẩm
                                        </h4>
                                        <div className="bg-white p-3 rounded-lg">
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {order.orderDetailId.items.map(
                                                    (item, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex justify-between">
                                                            <span>
                                                                {item.bookId
                                                                    ?.title ||
                                                                    `Sản phẩm ${
                                                                        idx + 1
                                                                    }`}
                                                            </span>
                                                            <span className="font-medium">
                                                                x{item.quantity}
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleAcceptOrder(order._id)
                                        }
                                        disabled={acceptingId === order._id}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2">
                                        {acceptingId === order._id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <CheckCircle className="w-5 h-5" />
                                        )}
                                        Nhận đơn hàng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>💡 Mẹo:</strong> Chỉ những đơn hàng trong khu vực
                    của bạn sẽ xuất hiện. Nhấn vào đơn hàng để xem chi tiết, sau
                    đó nhấn "Nhận đơn hàng" để bắt đầu vận chuyển.
                </p>
            </div>
        </div>
    );
};

export default ShipperDeliveryManagement;
