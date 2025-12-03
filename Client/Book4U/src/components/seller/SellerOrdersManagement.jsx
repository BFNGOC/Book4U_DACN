import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    getSellerOrders,
    startPicking,
    markAsPacked,
    handoffToCarrier,
} from '../../services/api/sellerOrderApi.js';
import { confirmOrder } from '../../services/api/orderApi.js';
import {
    formatOrderItem,
    getStatusDisplay,
    formatPrice,
    getNextAction,
} from '../../utils/orderFormatting.js';

function SellerOrdersManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [showHandoffModal, setShowHandoffModal] = useState(null);
    const [handoffData, setHandoffData] = useState({
        carrierName: '',
        trackingNumber: '',
        shipperId: '',
        shipperName: '',
    });

    const statusLabels = {
        pending: '⏳ Chờ xác nhận',
        confirmed: '✅ Chờ lấy hàng',
        picking: '📦 Đang lấy hàng',
        packed: '📮 Đã đóng gói',
        in_transit: '🚚 Đang vận chuyển',
        out_for_delivery: '🚴 Đang giao',
        completed: '🎉 Đã giao',
    };

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getSellerOrders({ status: filter });
            if (response.success) {
                setOrders(response.data || []);
            } else {
                toast.error(response.message || 'Lỗi tải danh sách đơn hàng');
            }
        } catch (error) {
            toast.error('Lỗi tải danh sách đơn hàng');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            let response;
            if (newStatus === 'confirmed') {
                response = await confirmOrder(orderId);
            } else if (newStatus === 'picking') {
                response = await startPicking(orderId);
            } else if (newStatus === 'packed') {
                response = await markAsPacked(orderId);
            }

            if (response.success) {
                toast.success('Cập nhật trạng thái thành công');
                fetchOrders();
            } else {
                toast.error(response.message || 'Lỗi cập nhật trạng thái');
            }
        } catch (error) {
            toast.error('Lỗi cập nhật trạng thái');
            console.error(error);
        }
    };

    const handleStartHandoff = (orderId) => {
        setShowHandoffModal(orderId);
        setHandoffData({
            carrierName: '',
            trackingNumber: '',
            shipperId: '',
            shipperName: '',
        });
    };

    const handleConfirmHandoff = async () => {
        if (
            !handoffData.carrierName.trim() ||
            !handoffData.trackingNumber.trim()
        ) {
            toast.error('Vui lòng nhập tên vận chuyển và mã theo dõi');
            return;
        }

        try {
            const response = await handoffToCarrier(
                showHandoffModal,
                handoffData
            );
            if (response.success) {
                toast.success('Giao hàng cho vận chuyển thành công');
                setShowHandoffModal(null);
                fetchOrders();
            } else {
                toast.error(response.message || 'Lỗi giao hàng');
            }
        } catch (error) {
            toast.error('Lỗi giao hàng');
            console.error(error);
        }
    };

    if (loading)
        return <p className="text-center text-gray-500">Đang tải...</p>;

    return (
        <div className="p-6 bg-gray-50">
            <h1 className="text-3xl font-bold mb-6">Quản lý đơn hàng</h1>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 bg-white p-4 rounded-lg">
                {[
                    'pending',
                    'confirmed',
                    'picking',
                    'packed',
                    'in_transit',
                    'completed',
                ].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                            filter === status
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}>
                        {statusLabels[status]}
                    </button>
                ))}
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-gray-500 text-lg">
                        Không có đơn hàng nào
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
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold">
                                                Đơn hàng #{order._id}
                                            </p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${
                                                    getStatusDisplay(
                                                        order.status
                                                    ).color
                                                }`}>
                                                {
                                                    getStatusDisplay(
                                                        order.status
                                                    ).label
                                                }
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Khách:{' '}
                                            {order.shippingAddress?.fullName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-500">
                                            {formatPrice(order.totalAmount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {order.items?.length} sản phẩm
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {expandedOrderId === order._id && (
                                <div className="p-4 bg-gray-50 space-y-4">
                                    {/* Items */}
                                    <div>
                                        <h4 className="font-bold mb-2">
                                            📦 Sản phẩm:
                                        </h4>
                                        <div className="space-y-2">
                                            {order.items?.map((item, idx) => {
                                                const formatted =
                                                    formatOrderItem(item);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between items-start text-sm p-2 bg-white rounded border border-gray-200">
                                                        <div className="flex-1">
                                                            <p className="font-semibold">
                                                                {
                                                                    formatted.bookTitle
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Shop:{' '}
                                                                {
                                                                    formatted.sellerName
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                SL:{' '}
                                                                {
                                                                    formatted.quantity
                                                                }{' '}
                                                                x{' '}
                                                                {formatPrice(
                                                                    formatted.price
                                                                )}
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

                                    {/* Shipping address */}
                                    <div>
                                        <h4 className="font-bold mb-2">
                                            📍 Địa chỉ giao:
                                        </h4>
                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="font-semibold">
                                                {
                                                    order.shippingAddress
                                                        ?.fullName
                                                }
                                            </p>
                                            <p>
                                                📞{' '}
                                                {order.shippingAddress?.phone}
                                            </p>
                                            <p className="text-gray-600">
                                                {order.shippingAddress?.address}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order info: Payment, Warehouse, Tracking */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                Thanh toán
                                            </p>
                                            <p className="font-semibold">
                                                {order.paymentMethod}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {order.paymentStatus}
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                Kho
                                            </p>
                                            <p className="font-semibold">
                                                {order.warehouseName || '—'}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {order.warehouseId
                                                    ? '✓ Đã chọn'
                                                    : '—'}
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                Mã vận đơn
                                            </p>
                                            <p className="font-semibold text-xs break-all">
                                                {order.trackingNumber || '—'}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {order.carrier?.name || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Current status and actions */}
                                    <div>
                                        <h4 className="font-bold mb-2">
                                            📊 Trạng thái & Hành động:
                                        </h4>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <div
                                                className={`px-3 py-2 rounded text-sm font-semibold ${
                                                    getStatusDisplay(
                                                        order.status
                                                    ).color
                                                }`}>
                                                {
                                                    getStatusDisplay(
                                                        order.status
                                                    ).label
                                                }
                                            </div>

                                            <div className="flex-1"></div>

                                            {/* Action buttons */}
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() =>
                                                        updateOrderStatus(
                                                            order._id,
                                                            'confirmed'
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold">
                                                    ✓ Xác nhận đơn
                                                </button>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <button
                                                    onClick={() =>
                                                        updateOrderStatus(
                                                            order._id,
                                                            'picking'
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-semibold">
                                                    ▶ Bắt đầu lấy hàng
                                                </button>
                                            )}
                                            {order.status === 'picking' && (
                                                <button
                                                    onClick={() =>
                                                        updateOrderStatus(
                                                            order._id,
                                                            'packed'
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold">
                                                    ✓ Đã đóng gói
                                                </button>
                                            )}
                                            {order.status === 'packed' && (
                                                <button
                                                    onClick={() =>
                                                        handleStartHandoff(
                                                            order._id
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-semibold">
                                                    🚚 Giao cho vận chuyển
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery notes */}
                                    {order.notes && order.notes.length > 0 && (
                                        <div>
                                            <h4 className="font-bold mb-2">
                                                📋 Ghi chú:
                                            </h4>
                                            <div className="space-y-1 text-xs">
                                                {order.notes
                                                    .slice(-3)
                                                    .map((note, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-white p-2 rounded border-l-2 border-blue-500">
                                                            <p className="font-semibold">
                                                                {note.message}
                                                            </p>
                                                            <p className="text-gray-500">
                                                                {new Date(
                                                                    note.timestamp
                                                                ).toLocaleString(
                                                                    'vi-VN'
                                                                )}{' '}
                                                                - {note.addedBy}
                                                            </p>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Handoff modal */}
            {showHandoffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">
                            🚚 Giao hàng cho vận chuyển
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Tên vận chuyển
                                </label>
                                <input
                                    type="text"
                                    value={handoffData.carrierName}
                                    onChange={(e) =>
                                        setHandoffData({
                                            ...handoffData,
                                            carrierName: e.target.value,
                                        })
                                    }
                                    placeholder="VNPost, GHN, GHTK..."
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Mã theo dõi
                                </label>
                                <input
                                    type="text"
                                    value={handoffData.trackingNumber}
                                    onChange={(e) =>
                                        setHandoffData({
                                            ...handoffData,
                                            trackingNumber: e.target.value,
                                        })
                                    }
                                    placeholder="VN123456789..."
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    ID người giao hàng (tuỳ chọn)
                                </label>
                                <input
                                    type="text"
                                    value={handoffData.shipperId}
                                    onChange={(e) =>
                                        setHandoffData({
                                            ...handoffData,
                                            shipperId: e.target.value,
                                        })
                                    }
                                    placeholder="ID shipper"
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Tên người giao hàng (tuỳ chọn)
                                </label>
                                <input
                                    type="text"
                                    value={handoffData.shipperName}
                                    onChange={(e) =>
                                        setHandoffData({
                                            ...handoffData,
                                            shipperName: e.target.value,
                                        })
                                    }
                                    placeholder="Tên shipper"
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowHandoffModal(null)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmHandoff}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SellerOrdersManagement;
