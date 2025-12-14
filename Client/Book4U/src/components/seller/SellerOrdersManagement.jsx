import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    getSellerOrderDetails,
    shipOrderDetail,
    cancelOrderDetail,
    confirmOrderDetail,
} from '../../services/api/sellerOrderApi.js';
import {
    formatOrderItem,
    getStatusDisplay,
    formatPrice,
    getNextAction,
} from '../../utils/orderFormatting.js';

function SellerOrdersManagement() {
    const [orderDetails, setOrderDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [expandedOrderDetailId, setExpandedOrderDetailId] = useState(null);
    const [showShippingModal, setShowShippingModal] = useState(null);
    const [shippingData, setShippingData] = useState({
        trackingNumber: '',
        carrierName: '',
        estimatedDeliveryDate: '',
    });

    const statusLabels = {
        pending: '⏳ Chờ xác nhận',
        confirmed: '✅ Chờ giao hàng',
        shipping: '🚚 Đang vận chuyển',
        delivered: '🎉 Đã giao',
        cancelled: '❌ Đã hủy',
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [filter]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await getSellerOrderDetails({ status: filter });
            if (response.success) {
                setOrderDetails(response.data || []);
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

    const handleShipOrderDetail = async (orderDetailId, shippingInfo) => {
        try {
            const response = await shipOrderDetail(orderDetailId, shippingInfo);
            if (response.success) {
                toast.success('Cập nhật shipping thành công');
                setShowShippingModal(null);
                fetchOrderDetails();
            } else {
                toast.error(response.message || 'Lỗi cập nhật shipping');
            }
        } catch (error) {
            toast.error('Lỗi cập nhật shipping');
            console.error(error);
        }
    };

    const handleConfirmOrderDetail = async (orderDetailId) => {
        try {
            const response = await confirmOrderDetail(orderDetailId);
            if (response.success) {
                toast.success('Xác nhận đơn hàng thành công');
                fetchOrderDetails();
            } else {
                toast.error(response.message || 'Lỗi xác nhận đơn hàng');
            }
        } catch (error) {
            toast.error('Lỗi xác nhận đơn hàng');
            console.error(error);
        }
    };

    const handleCancelOrderDetail = async (orderDetailId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            const response = await cancelOrderDetail(orderDetailId);
            if (response.success) {
                toast.success('Hủy đơn hàng thành công');
                fetchOrderDetails();
            } else {
                toast.error(response.message || 'Lỗi hủy đơn hàng');
            }
        } catch (error) {
            toast.error('Lỗi hủy đơn hàng');
            console.error(error);
        }
    };

    const handleStartShipping = (orderDetailId) => {
        setShowShippingModal(orderDetailId);
        setShippingData({
            trackingNumber: '',
            carrierName: '',
            estimatedDeliveryDate: '',
        });
    };

    const handleConfirmShipping = () => {
        if (!shippingData.trackingNumber || !shippingData.carrierName) {
            toast.error('Vui lòng nhập tracking number và hãng vận chuyển');
            return;
        }

        handleShipOrderDetail(showShippingModal, shippingData);
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
                    'shipping',
                    'delivered',
                    'cancelled',
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
            {orderDetails.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-gray-500 text-lg">
                        Không có đơn hàng nào
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orderDetails.map((orderDetail) => (
                        <div
                            key={orderDetail._id}
                            className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* OrderDetail header */}
                            <div
                                className="p-4 border-b cursor-pointer hover:bg-gray-50 transition"
                                onClick={() =>
                                    setExpandedOrderDetailId(
                                        expandedOrderDetailId ===
                                            orderDetail._id
                                            ? null
                                            : orderDetail._id
                                    )
                                }>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold">
                                                Đơn hàng #
                                                {orderDetail._id.slice(-8)}
                                            </p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${
                                                    orderDetail.status ===
                                                    'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : orderDetail.status ===
                                                          'confirmed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : orderDetail.status ===
                                                          'shipping'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : orderDetail.status ===
                                                          'delivered'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                {
                                                    statusLabels[
                                                        orderDetail.status
                                                    ]
                                                }
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Khách:{' '}
                                            {
                                                orderDetail.shippingAddress
                                                    ?.fullName
                                            }
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(
                                                orderDetail.createdAt
                                            ).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-500">
                                            {formatPrice(
                                                orderDetail.totalAmount
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {orderDetail.items?.length} sản phẩm
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {expandedOrderDetailId === orderDetail._id && (
                                <div className="p-4 bg-gray-50 space-y-4">
                                    {/* Items */}
                                    <div>
                                        <h4 className="font-bold mb-2">
                                            📦 Sản phẩm:
                                        </h4>
                                        <div className="space-y-2">
                                            {orderDetail.items?.map(
                                                (item, idx) => {
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
                                                }
                                            )}
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
                                                    orderDetail.shippingAddress
                                                        ?.fullName
                                                }
                                            </p>
                                            <p>
                                                📞{' '}
                                                {
                                                    orderDetail.shippingAddress
                                                        ?.phone
                                                }
                                            </p>
                                            <p className="text-gray-600">
                                                {
                                                    orderDetail.shippingAddress
                                                        ?.address
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* OrderDetail info: Payment, Warehouse, Tracking */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                Thanh toán
                                            </p>
                                            <p className="font-semibold">
                                                {
                                                    orderDetail.mainOrderId
                                                        ?.paymentMethod
                                                }
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {orderDetail.paymentStatus}
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                Kho
                                            </p>
                                            <p className="font-semibold">
                                                {orderDetail.warehouseId
                                                    ?.name || '—'}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {orderDetail.warehouseId
                                                    ? '✓ Đã chọn'
                                                    : '—'}
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded text-sm border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                Mã vận đơn
                                            </p>
                                            <p className="font-semibold text-xs break-all">
                                                {orderDetail.trackingNumber ||
                                                    '—'}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {orderDetail.carrierName || '—'}
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
                                                    orderDetail.status ===
                                                    'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : orderDetail.status ===
                                                          'confirmed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : orderDetail.status ===
                                                          'shipping'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : orderDetail.status ===
                                                          'delivered'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                {
                                                    statusLabels[
                                                        orderDetail.status
                                                    ]
                                                }
                                            </div>

                                            <div className="flex-1"></div>

                                            {/* Action buttons */}
                                            {orderDetail.status ===
                                                'pending' && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleConfirmOrderDetail(
                                                                orderDetail._id
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold">
                                                        ✓ Xác nhận đơn
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleCancelOrderDetail(
                                                                orderDetail._id
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold">
                                                        ✕ Hủy đơn
                                                    </button>
                                                </>
                                            )}
                                            {orderDetail.status ===
                                                'confirmed' && (
                                                <button
                                                    onClick={() =>
                                                        handleStartShipping(
                                                            orderDetail._id
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-semibold">
                                                    🚚 Giao hàng
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery notes */}
                                    {orderDetail.notes &&
                                        orderDetail.notes.length > 0 && (
                                            <div>
                                                <h4 className="font-bold mb-2">
                                                    📋 Ghi chú:
                                                </h4>
                                                <div className="space-y-1 text-xs">
                                                    {orderDetail.notes
                                                        .slice(-3)
                                                        .map((note, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-white p-2 rounded border-l-2 border-blue-500">
                                                                <p className="font-semibold">
                                                                    {
                                                                        note.message
                                                                    }
                                                                </p>
                                                                <p className="text-gray-500">
                                                                    {new Date(
                                                                        note.timestamp
                                                                    ).toLocaleString(
                                                                        'vi-VN'
                                                                    )}{' '}
                                                                    -{' '}
                                                                    {
                                                                        note.addedBy
                                                                    }
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

            {/* Shipping modal (for confirmed orders) */}
            {showShippingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">
                            🚚 Cập nhật thông tin giao hàng
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Hãng vận chuyển
                                </label>
                                <input
                                    type="text"
                                    value={shippingData.carrierName}
                                    onChange={(e) =>
                                        setShippingData({
                                            ...shippingData,
                                            carrierName: e.target.value,
                                        })
                                    }
                                    placeholder="VNPost, GHN, GHTK..."
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Mã vận đơn
                                </label>
                                <input
                                    type="text"
                                    value={shippingData.trackingNumber}
                                    onChange={(e) =>
                                        setShippingData({
                                            ...shippingData,
                                            trackingNumber: e.target.value,
                                        })
                                    }
                                    placeholder="VN123456789..."
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Ngày dự kiến giao (tuỳ chọn)
                                </label>
                                <input
                                    type="date"
                                    value={shippingData.estimatedDeliveryDate}
                                    onChange={(e) =>
                                        setShippingData({
                                            ...shippingData,
                                            estimatedDeliveryDate:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowShippingModal(null)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmShipping}
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
