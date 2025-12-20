import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserOrdersDetail, cancelOrder } from '../services/api/orderApi.js';
import { useUser } from '../contexts/userContext.jsx';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();
    const { user } = useUser();

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
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            // Lấy danh sách OrderDetails của khách hàng
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await getUserOrdersDetail(params);

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

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;

        try {
            const response = await cancelOrder(orderId, 'Khách hàng hủy');
            if (response.success) {
                toast.success('Hủy đơn hàng thành công');
                fetchOrders();
            } else {
                toast.error(response.message || 'Lỗi hủy đơn');
            }
        } catch (error) {
            toast.error('Lỗi hủy đơn');
            console.error(error);
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
            <h1 className="text-3xl font-bold mb-6">Đơn hàng của tôi</h1>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    'all',
                    'pending',
                    'confirmed',
                    'picking',
                    'packed',
                    'in_transit',
                    'completed',
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
                        {status === 'all'
                            ? 'Tất cả'
                            : statusLabels[status]?.label}
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
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                            onClick={() =>
                                navigate(`/order-detail/${order._id}`)
                            }>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-bold text-lg">
                                        Đơn hàng #
                                        {order._id?.slice(-8).toUpperCase() ||
                                            order._id}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {order.sellerId?.shopName && (
                                            <span className="mr-3">
                                                Cửa hàng:{' '}
                                                {order.sellerId.shopName}
                                            </span>
                                        )}
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <span
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                                        statusLabels[order.status]?.color
                                    }`}>
                                    {statusLabels[order.status]?.label}
                                </span>
                            </div>

                            {/* Items preview */}
                            <div className="border-t pt-4 mb-4">
                                {order.items && order.items.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                            📦 Sản phẩm ({order.items.length})
                                        </p>
                                        <div className="space-y-1">
                                            {order.items
                                                .slice(0, 2)
                                                .map((item, idx) => (
                                                    <p
                                                        key={idx}
                                                        className="text-xs text-gray-600">
                                                        •{' '}
                                                        {item.bookId?.title ||
                                                            'Sản phẩm'}{' '}
                                                        x{item.quantity}
                                                    </p>
                                                ))}
                                            {order.items.length > 2 && (
                                                <p className="text-xs text-gray-500">
                                                    ... và{' '}
                                                    {order.items.length - 2} sản
                                                    phẩm khác
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {order.shippingAddress && (
                                    <p className="text-sm text-gray-600">
                                        <strong>📍 Giao đến:</strong>{' '}
                                        {order.shippingAddress.fullName} -{' '}
                                        {order.shippingAddress.address}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Tổng tiền
                                    </p>
                                    <p className="text-lg font-bold">
                                        <span className="text-red-500">
                                            {order.totalAmount?.toLocaleString()}
                                            ₫
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/order-detail/${order._id}`
                                            );
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                                        Xem chi tiết
                                    </button>
                                    {[
                                        'pending',
                                        'confirmed',
                                        'picking',
                                        'packed',
                                    ].includes(order.status) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelOrder(order._id);
                                            }}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium">
                                            Hủy đơn
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;
