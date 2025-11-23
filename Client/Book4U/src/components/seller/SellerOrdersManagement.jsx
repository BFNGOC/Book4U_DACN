import { useEffect, useState } from 'react';
import {
    getSellerOrders,
    updateOrderStatus,
} from '../../services/api/sellerOrderApi';
import { ChevronDown, Search, Filter } from 'lucide-react';
import API_URL from '../../configs/api';

function SellerOrdersManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipped: 'Đã gửi',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await getSellerOrders({
                page,
                limit: 10,
                status: statusFilter || undefined,
            });

            if (res.success) {
                setOrders(res.data);
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const res = await updateOrderStatus(orderId, newStatus);
            if (res.success) {
                setOrders(
                    orders.map((order) =>
                        order._id === orderId
                            ? { ...order, status: newStatus }
                            : order
                    )
                );
            }
        } catch (err) {
            console.error('Lỗi:', err);
        }
    };

    if (loading)
        return <p className="text-center text-gray-500">Đang tải...</p>;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm đơn hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã gửi</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                    Không có đơn hàng nào.
                </p>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="bg-white border rounded-lg overflow-hidden">
                            <button
                                onClick={() =>
                                    setExpandedOrder(
                                        expandedOrder === order._id
                                            ? null
                                            : order._id
                                    )
                                }
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                #
                                                {order._id
                                                    .slice(-6)
                                                    .toUpperCase()}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Từ: {order.profileId?.firstName}{' '}
                                                {order.profileId?.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    statusColors[order.status]
                                                }`}>
                                                {statusLabels[order.status]}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-blue-600">
                                                {order.totalAmount.toLocaleString()}
                                                ₫
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                        expandedOrder === order._id
                                            ? 'rotate-180'
                                            : ''
                                    }`}
                                />
                            </button>

                            {expandedOrder === order._id && (
                                <div className="border-t p-4 bg-gray-50">
                                    <div className="space-y-4">
                                        {/* Items */}
                                        <div>
                                            <h4 className="font-semibold mb-3">
                                                Sản phẩm:
                                            </h4>
                                            <div className="space-y-2">
                                                {order.items.map(
                                                    (item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-start gap-3 p-3 bg-white rounded border">
                                                            <img
                                                                src={`${API_URL}${item.bookId?.images?.[0]}`}
                                                                alt={
                                                                    item.bookId
                                                                        ?.title
                                                                }
                                                                className="w-16 h-20 object-cover rounded"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="font-semibold">
                                                                    {
                                                                        item
                                                                            .bookId
                                                                            ?.title
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    x
                                                                    {
                                                                        item.quantity
                                                                    }{' '}
                                                                    ×{' '}
                                                                    {item.price.toLocaleString()}
                                                                    ₫
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold">
                                                                {(
                                                                    item.quantity *
                                                                    item.price
                                                                ).toLocaleString()}
                                                                ₫
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Shipping Address */}
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Địa chỉ giao hàng:
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {
                                                    order.shippingAddress
                                                        ?.fullName
                                                }
                                                <br />
                                                {order.shippingAddress?.phone}
                                                <br />
                                                {order.shippingAddress?.address}
                                            </p>
                                        </div>

                                        {/* Status Update */}
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Cập nhật trạng thái:
                                            </h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {[
                                                    'pending',
                                                    'processing',
                                                    'shipped',
                                                    'completed',
                                                ].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                order._id,
                                                                status
                                                            )
                                                        }
                                                        disabled={
                                                            order.status ===
                                                            status
                                                        }
                                                        className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                                                            order.status ===
                                                            status
                                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}>
                                                        {statusLabels[status]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                        Trước
                    </button>
                    {Array.from(
                        { length: pagination.pages },
                        (_, i) => i + 1
                    ).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-4 py-2 rounded-lg ${
                                page === p
                                    ? 'bg-blue-600 text-white'
                                    : 'border hover:bg-gray-50'
                            }`}>
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.pages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}

export default SellerOrdersManagement;
