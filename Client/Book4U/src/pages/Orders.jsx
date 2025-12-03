import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserOrders, cancelOrder } from '../services/api/orderApi.js';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

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
            const userId = localStorage.getItem('userId');

            // Lấy profileId
            const profileRes = await getUserProfile(userId);
            if (!profileRes.success) {
                toast.error('Lỗi lấy thông tin hồ sơ');
                return;
            }
            const profileId = profileRes.data._id;

            // Lấy danh sách đơn
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await getUserOrders(profileId, params);

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
                            onClick={() => navigate(`/orders/${order._id}`)}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-bold text-lg">
                                        Đơn hàng #{order._id.slice(-8)}
                                    </p>
                                    <p className="text-sm text-gray-500">
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

                            <div className="border-t pt-4 mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Địa chỉ:</strong>{' '}
                                    {order.shippingAddress?.address}
                                </p>
                                {order.items && (
                                    <p className="text-sm text-gray-600">
                                        <strong>{order.items.length}</strong>{' '}
                                        sản phẩm
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <p className="text-lg font-bold">
                                    Tổng:{' '}
                                    <span className="text-red-500">
                                        {order.totalAmount?.toLocaleString()}₫
                                    </span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/orders/${order._id}`);
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                                        Chi tiết
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
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                                            Hủy
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
