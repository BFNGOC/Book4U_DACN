import { useEffect, useState } from 'react';
import { useUser } from '../../contexts/userContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import SellerOrdersManagement from '../../components/seller/SellerOrdersManagement';
import SellerProductsManagement from '../../components/seller/SellerProductsManagement';
import SellerInventoryManagement from '../../components/seller/SellerInventoryManagement';
import SellerRevenueStats from '../../components/seller/SellerRevenueStats';
import { getSellerDashboard } from '../../services/api/sellerApi';
import {
    getSellerOrderDetails,
    getRevenueStats,
} from '../../services/api/sellerOrderApi';
import { BarChart3, Package, TrendingUp, ShoppingCart } from 'lucide-react';

function SellerDashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrderDetails: 0,
        totalRevenue: 0,
        totalSales: 0,
    });

    useEffect(() => {
        console.log('User data in SellerDashboard:', user);
        if (user?.role !== 'seller') {
            navigate('/');
            return;
        }

        const fetchDashboard = async () => {
            try {
                setLoading(true);

                // ✅ API 1: Lấy thông tin cơ bản (sản phẩm, etc)
                const dashboardRes = await getSellerDashboard();

                // ✅ API 2: Lấy danh sách OrderDetail của seller
                const orderDetailsRes = await getSellerOrderDetails({
                    page: 1,
                    limit: 1000, // Lấy tất cả để tính stats
                });

                // ✅ API 3: Lấy thống kê doanh thu theo tháng
                const revenueRes = await getRevenueStats('month');

                if (dashboardRes.success && orderDetailsRes.success) {
                    // Tính toán stats từ OrderDetails
                    const orderDetailsData = orderDetailsRes.data || [];
                    const totalOrderDetails = orderDetailsData.length;

                    // ✅ Doanh số bán = Tổng số lượng sản phẩm đã bán (từ những OrderDetail đã delivered)
                    const totalSales = orderDetailsData
                        .filter((od) => od.status === 'delivered') // Chỉ tính đơn đã giao
                        .reduce((sum, od) => {
                            return (
                                sum +
                                (od.items || []).reduce(
                                    (itemSum, item) =>
                                        itemSum + (item.quantity || 0),
                                    0
                                )
                            );
                        }, 0);

                    // Doanh thu từ revenue API (tính từ delivered OrderDetails)
                    const totalRevenue = revenueRes.success
                        ? revenueRes.data?.revenue || 0
                        : 0;

                    setStats({
                        totalProducts:
                            dashboardRes.data?.stats?.totalProducts || 0,
                        totalOrderDetails,
                        totalRevenue,
                        totalSales, // ✅ Số lượng sản phẩm đã bán
                    });

                    setDashboard(dashboardRes.data);
                } else {
                    throw new Error('Failed to fetch dashboard data');
                }
            } catch (err) {
                console.error('Lỗi:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [user, navigate]);

    if (loading) return <Loading context="Đang tải dashboard..." />;

    if (!dashboard)
        return (
            <p className="text-center mt-10 text-gray-500">
                Không thể tải dashboard.
            </p>
        );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white z-40 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div>
                        <h1 className="text-4xl font-bold">
                            Bảng điều khiển cửa hàng
                        </h1>
                        <p className="text-blue-100 mt-2">
                            Quản lý cửa hàng, đơn hàng và sản phẩm của bạn
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[
                        {
                            label: 'Tổng sản phẩm',
                            value: stats?.totalProducts || 0,
                            icon: Package,
                            color: 'from-blue-500 to-blue-600',
                            bg: 'bg-blue-50',
                        },
                        {
                            label: 'Đơn hàng',
                            value: stats?.totalOrderDetails || 0,
                            icon: ShoppingCart,
                            color: 'from-green-500 to-green-600',
                            bg: 'bg-green-50',
                        },
                        {
                            label: 'Số sản phẩm đã bán',
                            value: stats?.totalSales || 0,
                            icon: TrendingUp,
                            color: 'from-orange-500 to-orange-600',
                            bg: 'bg-orange-50',
                        },
                        {
                            label: 'Doanh thu',
                            value: `${(
                                stats?.totalRevenue || 0
                            ).toLocaleString()}₫`,
                            icon: BarChart3,
                            color: 'from-red-500 to-red-600',
                            bg: 'bg-red-50',
                        },
                    ].map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow">
                                        <p className="text-gray-600 text-sm font-medium mb-2">
                                            {stat.label}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div
                                        className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg shadow-md`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b bg-gray-50 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'overview', label: 'Tổng quan', icon: '📊' },
                            {
                                id: 'orders',
                                label: 'Quản lý đơn hàng',
                                icon: '📦',
                            },
                            {
                                id: 'products',
                                label: 'Quản lý sản phẩm',
                                icon: '📚',
                            },
                            {
                                id: 'inventory',
                                label: 'Quản lý kho',
                                icon: '🏪',
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'text-blue-600 border-blue-600 bg-white'
                                        : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100'
                                }`}>
                                <span className="text-base">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'overview' && <SellerRevenueStats />}
                        {activeTab === 'orders' && <SellerOrdersManagement />}
                        {activeTab === 'products' && (
                            <SellerProductsManagement />
                        )}
                        {activeTab === 'inventory' && (
                            <SellerInventoryManagement />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SellerDashboard;
