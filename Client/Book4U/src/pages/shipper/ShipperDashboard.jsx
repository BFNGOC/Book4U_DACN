import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ShipperOrderList from '../../components/shipper/ShipperOrderList';
import ShipperOrderMap from '../../components/shipper/ShipperOrderMap';
import {
    getShipperOrders,
    updateShipperLocation,
} from '../../services/api/shipperApi';

export default function ShipperDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [currentLocation, setCurrentLocation] = useState(null);

    // Fetch shipper's assigned orders
    useEffect(() => {
        fetchOrders();
        // Start location tracking
        startLocationTracking();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getShipperOrders();
            if (response.success) {
                setOrders(response.data);
            } else {
                toast.error(response.message || 'Lỗi lấy danh sách đơn hàng');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startLocationTracking = () => {
        if (!navigator.geolocation) {
            toast.error('Trình duyệt không hỗ trợ GPS');
            return;
        }

        // Get location every 30 seconds
        navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ latitude, longitude });

                // Update to server
                try {
                    await updateShipperLocation({
                        latitude,
                        longitude,
                        address: `${latitude}, ${longitude}`,
                    });
                } catch (error) {
                    console.error('Failed to update location:', error);
                }
            },
            (error) => {
                console.warn('Location error:', error);
                toast.error('Không thể lấy vị trí GPS');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📦 Bảng Điều Khiển Shipper
                    </h1>
                    <p className="text-gray-600">
                        Quản lý các đơn hàng giao hàng của bạn
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div className="ml-5">
                                <p className="text-gray-500 text-sm font-medium">
                                    Tổng Đơn
                                </p>
                                <p className="text-gray-900 text-lg font-bold">
                                    {orders.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">🚚</span>
                            </div>
                            <div className="ml-5">
                                <p className="text-gray-500 text-sm font-medium">
                                    Đang Giao
                                </p>
                                <p className="text-gray-900 text-lg font-bold">
                                    {
                                        orders.filter(
                                            (o) =>
                                                o.status === 'out_for_delivery'
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div className="ml-5">
                                <p className="text-gray-500 text-sm font-medium">
                                    Hoàn Thành
                                </p>
                                <p className="text-gray-900 text-lg font-bold">
                                    {
                                        orders.filter(
                                            (o) => o.status === 'completed'
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">📍</span>
                            </div>
                            <div className="ml-5">
                                <p className="text-gray-500 text-sm font-medium">
                                    Vị Trí
                                </p>
                                <p className="text-gray-900 text-sm">
                                    {currentLocation
                                        ? `${currentLocation.latitude.toFixed(
                                              4
                                          )}, ${currentLocation.longitude.toFixed(
                                              4
                                          )}`
                                        : 'Đang lấy...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="mb-6 flex gap-4">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                            viewMode === 'list'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}>
                        📋 Danh Sách
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                            viewMode === 'map'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}>
                        🗺️ Bản Đồ
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="ml-auto px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition">
                        🔄 Làm Mới
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <ShipperOrderList
                        orders={orders}
                        onOrderUpdate={fetchOrders}
                    />
                ) : (
                    <ShipperOrderMap
                        orders={orders}
                        currentLocation={currentLocation}
                    />
                )}
            </div>
        </div>
    );
}
