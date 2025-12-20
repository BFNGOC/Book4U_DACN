import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderDetailInfo, cancelOrder } from '../services/api/orderApi.js';
import DeliveryStageTracker from '../components/tracking/DeliveryStageTracker.jsx';
import { formatPrice } from '../utils/orderFormatting.js';
import {
    ArrowLeft,
    Phone,
    Star,
    MapPin,
    Calendar,
    Package,
    CheckCircle,
    XCircle,
    AlertCircle,
} from 'lucide-react';

/**
 * ============================================================
 * ORDER DETAIL PAGE COMPONENT
 * ============================================================
 * Hiển thị chi tiết đầy đủ 1 OrderDetail
 * - Order header (ID, dates, status)
 * - Seller information (shop, rating, contact)
 * - Items list (full details)
 * - Shipping address
 * - Tracking timeline (DeliveryStageTracker)
 * - Order summary (prices, totals)
 * - Action buttons (cancel, contact seller)
 */

function OrderDetailPage() {
    const { orderDetailId } = useParams();
    const navigate = useNavigate();
    const [orderDetail, setOrderDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const statusConfig = {
        pending: {
            label: '⏳ Chờ xác nhận',
            color: 'bg-yellow-100 text-yellow-800',
            icon: AlertCircle,
        },
        confirmed: {
            label: '✅ Đã xác nhận',
            color: 'bg-blue-100 text-blue-800',
            icon: CheckCircle,
        },
        picking: {
            label: '📦 Đang lấy hàng',
            color: 'bg-purple-100 text-purple-800',
            icon: Package,
        },
        packed: {
            label: '📮 Đã đóng gói',
            color: 'bg-orange-100 text-orange-800',
            icon: Package,
        },
        in_transit: {
            label: '🚚 Đang vận chuyển',
            color: 'bg-indigo-100 text-indigo-800',
            icon: AlertCircle,
        },
        in_delivery_stage: {
            label: '🚴 Đang giao',
            color: 'bg-cyan-100 text-cyan-800',
            icon: AlertCircle,
        },
        delivered: {
            label: '🎉 Đã giao',
            color: 'bg-green-100 text-green-800',
            icon: CheckCircle,
        },
        failed: {
            label: '❌ Giao thất bại',
            color: 'bg-red-100 text-red-800',
            icon: XCircle,
        },
        cancelled: {
            label: '❌ Đã hủy',
            color: 'bg-gray-100 text-gray-800',
            icon: XCircle,
        },
    };

    // Fetch OrderDetail
    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getOrderDetailInfo(orderDetailId);

                if (!response.success) {
                    setError(
                        response.message || 'Không thể lấy thông tin đơn hàng'
                    );
                    return;
                }

                setOrderDetail(response.data);
                console.log('📋 OrderDetail loaded:', response.data);
            } catch (err) {
                console.error('❌ Error fetching OrderDetail:', err);
                setError(err.message || 'Lỗi khi tải thông tin đơn hàng');
                toast.error('Không thể tải thông tin đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        if (orderDetailId) {
            fetchOrderDetail();
        }
    }, [orderDetailId]);

    // Handle cancel order
    const handleCancelOrder = async () => {
        // Only allow cancellation for pending orders
        if (orderDetail.status !== 'pending') {
            toast.error('Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận"');
            return;
        }

        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            const response = await cancelOrder(orderDetail.mainOrderId._id);
            if (response.success) {
                toast.success('Hủy đơn hàng thành công');
                setOrderDetail((prev) => ({
                    ...prev,
                    status: 'cancelled',
                }));
            } else {
                toast.error(response.message || 'Không thể hủy đơn hàng');
            }
        } catch (err) {
            console.error('❌ Error canceling order:', err);
            toast.error('Lỗi khi hủy đơn hàng');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gradient-to-r from-blue-400 to-indigo-600 border-t-transparent mb-6"></div>
                    <p className="text-gray-600 text-lg font-medium">
                        Đang tải thông tin đơn hàng...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !orderDetail) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition">
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
                        <XCircle
                            size={56}
                            className="mx-auto text-red-500 mb-4"
                        />
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">
                            Không tìm thấy đơn hàng
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error ||
                                'Đơn hàng không tồn tại hoặc bạn không có quyền xem'}
                        </p>
                        <button
                            onClick={() => navigate('/orders')}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition font-semibold">
                            Quay lại danh sách đơn
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const status = statusConfig[orderDetail.status] || statusConfig.pending;
    const seller = orderDetail.sellerId;
    const sellerRating = seller?.performance?.averageRating || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-semibold transition group">
                    <ArrowLeft
                        size={20}
                        className="group-hover:-translate-x-1 transition"
                    />
                    Quay lại
                </button>

                {/* Order Header - Modern Design */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Mã đơn hàng
                            </p>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                {orderDetail._id?.slice(-8).toUpperCase()}
                            </h1>
                            <div className="flex items-center gap-6 text-gray-700">
                                <span className="flex items-center gap-2 text-sm">
                                    <Calendar
                                        size={16}
                                        className="text-blue-500"
                                    />
                                    <span className="font-medium">
                                        {new Date(
                                            orderDetail.mainOrderId?.createdAt
                                        ).toLocaleDateString('vi-VN')}
                                    </span>
                                </span>
                                <span className="flex items-center gap-2 text-sm">
                                    <Package
                                        size={16}
                                        className="text-indigo-500"
                                    />
                                    <span className="font-medium">
                                        {orderDetail.items?.length || 0} sản
                                        phẩm
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div
                            className={`px-6 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-lg ${status.color}`}>
                            <status.icon size={20} />
                            {status.label}
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">
                                    Thanh toán
                                </p>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full ${
                                            orderDetail.mainOrderId
                                                ?.paymentStatus === 'paid'
                                                ? 'bg-green-500'
                                                : 'bg-yellow-500'
                                        }`}></div>
                                    {orderDetail.mainOrderId?.paymentStatus ===
                                    'paid'
                                        ? '✅ Đã thanh toán'
                                        : '⏳ Chờ thanh toán'}
                                </p>
                            </div>
                            {orderDetail.mainOrderId?.paymentMethod && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        Phương thức
                                    </p>
                                    <p className="font-semibold text-gray-800">
                                        {orderDetail.mainOrderId.paymentMethod}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seller Information - Modern Card */}
                {seller && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            Thông tin người bán
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-800 mb-3">
                                    {seller.shopName ||
                                        `${seller.firstName} ${seller.lastName}`}
                                </p>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={
                                                    i < Math.round(sellerRating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }
                                            />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-gray-700">
                                        {sellerRating.toFixed(1)} ⭐
                                    </span>
                                </div>
                                {seller.primaryPhone && (
                                    <a
                                        href={`tel:${seller.primaryPhone}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm">
                                        <Phone size={16} />
                                        {seller.primaryPhone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Items List - Modern Grid */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        Sản phẩm đã đặt
                    </h2>
                    <div className="space-y-4">
                        {orderDetail.items?.map((item, index) => {
                            const book = item.bookId;
                            return (
                                <div
                                    key={index}
                                    className="flex gap-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition border border-gray-200">
                                    {/* Book Cover */}
                                    {book?.coverImageUrl && (
                                        <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                                            <img
                                                src={book.coverImageUrl}
                                                alt={book?.title}
                                                className="w-full h-full object-cover hover:scale-105 transition"
                                            />
                                        </div>
                                    )}
                                    {/* Item Details */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 mb-2 text-base line-clamp-2">
                                            {book?.title ||
                                                'Sản phẩm không xác định'}
                                        </h3>
                                        {book?.authors && (
                                            <p className="text-sm text-gray-600 mb-3">
                                                📖 {book.authors.join(', ')}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-end">
                                            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                                                x{item.quantity}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600 mb-1">
                                                    {item.quantity} ×{' '}
                                                    {formatPrice(item.price)}₫
                                                </p>
                                                <p className="font-bold text-lg text-indigo-600">
                                                    {formatPrice(
                                                        item.quantity *
                                                            item.price
                                                    )}
                                                    ₫
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <MapPin size={24} className="text-red-500" />
                        Địa chỉ giao hàng
                    </h2>
                    {orderDetail.shippingAddress && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                            <p className="font-bold text-lg text-gray-800 mb-3">
                                {orderDetail.shippingAddress.fullName}
                            </p>
                            <div className="space-y-2 text-gray-700">
                                <p className="flex items-center gap-3">
                                    <span className="text-lg">📱</span>
                                    <span className="font-medium">
                                        {orderDetail.shippingAddress.phone}
                                    </span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <span className="text-lg">📍</span>
                                    <span className="font-medium">
                                        {orderDetail.shippingAddress.address}
                                    </span>
                                </p>
                                {orderDetail.shippingAddress.ward && (
                                    <p className="flex items-center gap-3 text-sm text-gray-600 ml-8">
                                        {orderDetail.shippingAddress.ward},{' '}
                                        {orderDetail.shippingAddress.district},{' '}
                                        {orderDetail.shippingAddress.province}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delivery Tracking */}
                {orderDetail.deliveryStages?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition">
                        <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            Trạng thái vận chuyển
                        </h2>
                        <DeliveryStageTracker
                            orderDetailId={orderDetailId}
                            showMap={true}
                            userRole="customer"
                        />
                    </div>
                )}

                {/* Actions */}
                {orderDetail.status === 'pending' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                        <button
                            onClick={handleCancelOrder}
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition font-bold text-lg flex items-center justify-center gap-2 group">
                            <XCircle
                                size={20}
                                className="group-hover:rotate-12 transition"
                            />
                            Hủy đơn hàng
                        </button>
                        <p className="text-center text-sm text-gray-600 mt-4">
                            Bạn chỉ có thể hủy đơn hàng trong trạng thái "Chờ
                            xác nhận"
                        </p>
                    </div>
                )}

                {/* Completed Order Message */}
                {orderDetail.status === 'completed' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg p-8 text-center">
                        <div className="inline-block p-4 bg-green-500 text-white rounded-full mb-4">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-green-800 mb-3">
                            Đơn hàng đã được giao
                        </h3>
                        <p className="text-green-700 text-lg">
                            🎉 Cảm ơn bạn đã mua sắm tại Book4U!
                        </p>
                    </div>
                )}

                {/* Cancelled Order Message */}
                {orderDetail.status === 'cancelled' && (
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400 rounded-2xl shadow-lg p-8 text-center">
                        <div className="inline-block p-4 bg-gray-500 text-white rounded-full mb-4">
                            <XCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            Đơn hàng đã bị hủy
                        </h3>
                        <p className="text-gray-700 text-lg">
                            Đơn hàng này không thể được khôi phục.
                        </p>
                    </div>
                )}

                {/* In Transit / Processing Message */}
                {[
                    'confirmed',
                    'picking',
                    'packed',
                    'in_transit',
                    'in_delivery_stage',
                ].includes(orderDetail.status) && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl shadow-lg p-6 text-center">
                        <p className="text-gray-700 font-semibold text-lg">
                            ⏳ Đơn hàng đang được xử lý. Vui lòng không hủy đơn
                            nếu không cần thiết.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderDetailPage;
