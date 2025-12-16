import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    getSellerOrderDetails,
    shipOrderDetail,
    cancelOrderDetail,
    confirmOrderDetail,
} from '../../services/api/sellerOrderApi.js';
import { createDeliveryStages } from '../../services/api/multiDeliveryApi.js';
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
    const [showDeliveryModal, setShowDeliveryModal] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState(null);

    const statusLabels = {
        pending: '⏳ Chờ xác nhận',
        confirmed: '✅ Chờ giao hàng',
        shipping: '🚚 Đang vận chuyển',
        in_delivery_stage: '📦 Trong quá trình giao',
        delivered: '🎉 Đã giao',
        cancelled: '❌ Đã hủy',
    };

    // ✅ Helper: Extract province từ address string
    const extractProvinceFromAddress = (address) => {
        if (!address) return '';
        // Format: "Số nhà, Phường, Quận, Tỉnh/Thành phố"
        // Lấy phần cuối cùng và chuẩn hóa
        const parts = address.split(',').map((p) => p.trim());
        const province = parts[parts.length - 1];

        // Chuẩn hóa tên tỉnh
        const normalized = {
            'Thành phố Hồ Chí Minh': 'TPHCM',
            'Thành phố Hà Nội': 'Hà Nội',
            'TP. Hồ Chí Minh': 'TPHCM',
            'TP. Hà Nội': 'Hà Nội',
        };

        return normalized[province] || province;
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [filter]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);

            // ✅ Special handling for "shipping" filter to include in_delivery_stage
            if (filter === 'shipping') {
                // Fetch both shipping and in_delivery_stage statuses
                const [shippingRes, deliveryRes] = await Promise.all([
                    getSellerOrderDetails({ status: 'shipping' }),
                    getSellerOrderDetails({ status: 'in_delivery_stage' }),
                ]);

                if (shippingRes.success && deliveryRes.success) {
                    // Merge both responses
                    const mergedData = [
                        ...(shippingRes.data || []),
                        ...(deliveryRes.data || []),
                    ];
                    setOrderDetails(mergedData);
                } else {
                    toast.error(
                        shippingRes.message ||
                            deliveryRes.message ||
                            'Lỗi tải danh sách đơn hàng'
                    );
                }
            } else {
                // Normal filter for other statuses
                const response = await getSellerOrderDetails({
                    status: filter,
                });
                if (response.success) {
                    setOrderDetails(response.data || []);
                } else {
                    toast.error(
                        response.message || 'Lỗi tải danh sách đơn hàng'
                    );
                }
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

    const handleStartShipping = (orderDetail) => {
        // ✅ Kiểm tra nội tỉnh vs liên tỉnh
        const warehouseProvince = orderDetail.warehouseId?.province || 'TPHCM'; // Fallback

        // Extract province từ address string
        const customerAddress = orderDetail.shippingAddress?.address;
        const customerProvince = extractProvinceFromAddress(customerAddress);

        const isNational = warehouseProvince !== customerProvince;
        const stages = isNational ? 3 : 1;

        setDeliveryInfo({
            orderDetailId: orderDetail._id,
            warehouseName: orderDetail.warehouseId?.name,
            warehouseProvince,
            customerName: orderDetail.shippingAddress?.fullName,
            customerProvince,
            customerAddress,
            isNational,
            stages,
            totalAmount: orderDetail.totalAmount,
        });
        setShowDeliveryModal(true);
    };

    const handleConfirmDelivery = async () => {
        if (!deliveryInfo) return;

        try {
            // ✅ Gọi createDeliveryStages thay vì shipOrderDetail
            const response = await createDeliveryStages({
                orderDetailId: deliveryInfo.orderDetailId,
            });

            if (response.success) {
                toast.success(
                    `Tạo ${deliveryInfo.stages} stage(s) giao hàng thành công`
                );
                setShowDeliveryModal(false);
                setDeliveryInfo(null);
                fetchOrderDetails();
            } else {
                toast.error(response.message || 'Lỗi tạo stages giao hàng');
            }
        } catch (error) {
            toast.error('Lỗi tạo stages giao hàng');
            console.error(error);
        }
    };

    const handleStartShipping_OLD = (orderDetailId) => {
        setShowShippingModal(orderDetailId);
        setShippingData({
            trackingNumber: '',
            carrierName: '',
            estimatedDeliveryDate: '',
        });
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
                                                            orderDetail
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

            {/* Delivery modal (Multi-stage flow) */}
            {showDeliveryModal && deliveryInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">
                            🚚 Xác nhận giao hàng
                        </h3>

                        <div className="space-y-4 mb-6">
                            {/* Warehouse info */}
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-600 mb-1">
                                    📦 Kho hàng
                                </p>
                                <p className="font-semibold text-sm">
                                    {deliveryInfo.warehouseName}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Tỉnh: {deliveryInfo.warehouseProvince}
                                </p>
                            </div>

                            {/* Customer info */}
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                                <p className="text-xs font-semibold text-green-600 mb-1">
                                    📍 Địa chỉ giao
                                </p>
                                <p className="font-semibold text-sm">
                                    {deliveryInfo.customerName}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {deliveryInfo.customerAddress}
                                </p>
                                <p className="text-xs font-semibold text-green-700 mt-2">
                                    Tỉnh: {deliveryInfo.customerProvince}
                                </p>
                            </div>

                            {/* Delivery type */}
                            <div
                                className={`p-3 rounded border ${
                                    deliveryInfo.isNational
                                        ? 'bg-orange-50 border-orange-200'
                                        : 'bg-green-50 border-green-200'
                                }`}>
                                <p className="text-xs font-semibold mb-1">
                                    {deliveryInfo.isNational ? '🌍' : '📌'} Loại
                                    giao hàng
                                </p>
                                <p className="font-semibold text-sm">
                                    {deliveryInfo.isNational
                                        ? 'Liên tỉnh (3 stages)'
                                        : 'Nội tỉnh (1 stage)'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {deliveryInfo.isNational
                                        ? 'Shipper → Hub 1 → Hub 2 → Khách'
                                        : 'Shipper → Khách'}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                    💰 Số tiền
                                </p>
                                <p className="text-lg font-bold text-red-500">
                                    {formatPrice(deliveryInfo.totalAmount)}
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowDeliveryModal(false);
                                    setDeliveryInfo(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold">
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelivery}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold">
                                ✓ Xác nhận giao
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SellerOrdersManagement;
