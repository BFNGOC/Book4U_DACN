import { useEffect, useState } from 'react';
import { useUser } from '../contexts/userContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import SellerOrdersManagement from '../components/seller/SellerOrdersManagement';
import SellerProductsManagement from '../components/seller/SellerProductsManagement';
import SellerInventoryManagement from '../components/seller/SellerInventoryManagement';
import SellerRevenueStats from '../components/seller/SellerRevenueStats';
import { getSellerDashboard } from '../services/api/sellerApi';
import { BarChart3, Package, TrendingUp, ShoppingCart } from 'lucide-react';

function SellerDashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('User data in SellerDashboard:', user);
        if (user?.role !== 'seller') {
            navigate('/');
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await getSellerDashboard();
                if (res.success) {
                    setDashboard(res.data);
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

    const { stats } = dashboard;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Bảng điều khiển cửa hàng
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Quản lý cửa hàng, đơn hàng và sản phẩm của bạn
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Tổng sản phẩm
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.totalProducts || 0}
                                </p>
                            </div>
                            <Package className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Đơn hàng
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.totalOrders || 0}
                                </p>
                            </div>
                            <ShoppingCart className="w-10 h-10 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Doanh số bán
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.totalSales || 0}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Doanh thu
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {(
                                        stats?.totalRevenue || 0
                                    ).toLocaleString()}
                                    ₫
                                </p>
                            </div>
                            <BarChart3 className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                                activeTab === 'overview'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}>
                            Tổng quan
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                                activeTab === 'orders'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}>
                            Quản lý đơn hàng
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                                activeTab === 'products'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}>
                            Quản lý sản phẩm
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                                activeTab === 'inventory'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}>
                            Quản lý kho
                        </button>
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
