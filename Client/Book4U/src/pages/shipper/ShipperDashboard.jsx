import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ShipperOrderList from '../../components/shipper/ShipperOrderList';
import ShipperOrderMap from '../../components/shipper/ShipperOrderMap';
import ShipperPendingOrders from '../../components/shipper/ShipperPendingOrders';
import ShipperAssignedOrders from '../../components/shipper/ShipperAssignedOrders';
import {
    getShipperOrders as getMultiDeliveryOrders,
    getShipperAssignedOrders,
} from '../../services/api/multiDeliveryApi';
import { updateShipperLocation } from '../../services/api/shipperApi';

export default function ShipperDashboard() {
    const [orders, setOrders] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [assignedStages, setAssignedStages] = useState([]);
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
            // ✅ Fetch pending + assigned orders in parallel
            const [pendingRes, assignedRes] = await Promise.all([
                getMultiDeliveryOrders(),
                getShipperAssignedOrders(),
            ]);

            // Handle pending orders
            if (pendingRes.success && pendingRes.data?.pendingOrders) {
                setPendingOrders(pendingRes.data.pendingOrders);
            } else {
                setPendingOrders([]);
            }

            // Handle assigned orders
            if (assignedRes.success) {
                setAssignedStages(
                    Array.isArray(assignedRes.data)
                        ? assignedRes.data
                        : assignedRes.data?.assignedStages || []
                );
            } else {
                setAssignedStages([]);
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

        // First, try with high accuracy
        const watchWithHighAccuracy = () => {
            return navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(
                        '✅ High Accuracy GPS Success:',
                        latitude,
                        longitude
                    );
                    setCurrentLocation({ latitude, longitude });

                    // Update to server
                    try {
                        const response = await updateShipperLocation({
                            latitude,
                            longitude,
                            address: `${latitude}, ${longitude}`,
                        });
                        console.log('📡 Server response:', response);
                        toast.success('📍 Cập nhật vị trí thành công');
                    } catch (error) {
                        console.error('❌ Failed to update location:', error);
                        toast.error(
                            'Lỗi gửi vị trí đến server: ' + error.message
                        );
                    }
                },
                (error) => {
                    console.warn('⚠️ High accuracy location error:', error);
                    console.warn(
                        'Error code:',
                        error.code,
                        '| Message:',
                        error.message
                    );

                    // If timeout (code 3) with high accuracy, try without high accuracy
                    if (error.code === 3) {
                        console.log(
                            '⏱️ High accuracy timeout, retrying with standard accuracy...'
                        );
                        toast.error(
                            'GPS đang chuyển sang chế độ tiêu chuẩn...'
                        );
                        watchWithStandardAccuracy();
                    } else if (error.code === 1) {
                        toast.error(
                            'Từ chối quyền truy cập GPS. Vui lòng bật quyền vị trí trong cài đặt.'
                        );
                    } else if (error.code === 2) {
                        toast.error(
                            'Không thể lấy vị trí GPS. Kiểm tra kết nối Internet hoặc bật GPS.'
                        );
                    } else {
                        toast.error('Không thể lấy vị trí GPS');
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000, // Increased from 5s to 10s
                    maximumAge: 0,
                }
            );
        };

        // Fallback: try without high accuracy requirement
        const watchWithStandardAccuracy = () => {
            return navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(
                        '✅ Standard Accuracy GPS Success:',
                        latitude,
                        longitude
                    );
                    setCurrentLocation({ latitude, longitude });

                    // Update to server
                    try {
                        const response = await updateShipperLocation({
                            latitude,
                            longitude,
                            address: `${latitude}, ${longitude}`,
                        });
                        console.log('📡 Server response:', response);
                        toast.success(
                            '📍 Cập nhật vị trí thành công (tiêu chuẩn)'
                        );
                    } catch (error) {
                        console.error('❌ Failed to update location:', error);
                        toast.error(
                            'Lỗi gửi vị trí đến server: ' + error.message
                        );
                    }
                },
                (error) => {
                    console.warn('⚠️ Standard accuracy location error:', error);
                    console.warn(
                        'Error code:',
                        error.code,
                        '| Message:',
                        error.message
                    );

                    if (error.code === 1) {
                        toast.error(
                            'Từ chối quyền truy cập GPS. Vui lòng bật quyền vị trí trong cài đặt.'
                        );
                    } else if (error.code === 2) {
                        toast.error(
                            'Không thể lấy vị trí GPS. Kiểm tra kết nối Internet hoặc bật GPS.'
                        );
                    } else {
                        toast.error(
                            'Không thể lấy vị trí GPS. Vui lòng kiểm tra cài đặt vị trí trên thiết bị.'
                        );
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 15000, // Longer timeout for standard accuracy
                    maximumAge: 30000, // Accept location up to 30s old
                }
            );
        };

        // Start with high accuracy
        console.log('🚀 Starting location tracking (High Accuracy)...');
        watchWithHighAccuracy();
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
                                <span className="text-2xl">�</span>
                            </div>
                            <div className="ml-5">
                                <p className="text-gray-500 text-sm font-medium">
                                    Chờ Nhận
                                </p>
                                <p className="text-gray-900 text-lg font-bold">
                                    {pendingOrders.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div className="ml-5">
                                <p className="text-gray-500 text-sm font-medium">
                                    Đang Giao
                                </p>
                                <p className="text-gray-900 text-lg font-bold">
                                    {assignedStages.length}
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
                ) : (
                    <>
                        {/* Pending Orders Section */}
                        {pendingOrders.length > 0 && (
                            <div className="mb-8">
                                <ShipperPendingOrders
                                    pendingOrders={pendingOrders}
                                    onOrderAccepted={fetchOrders}
                                />
                            </div>
                        )}

                        {/* Assigned Orders Section */}
                        <div className="mb-8">
                            <ShipperAssignedOrders
                                assignedStages={assignedStages}
                                onStageCompleted={fetchOrders}
                            />
                        </div>

                        {/* Legacy Orders Section (kept for compatibility) */}
                        {viewMode === 'list' && orders.length > 0 ? (
                            <ShipperOrderList
                                orders={orders}
                                onOrderUpdate={fetchOrders}
                            />
                        ) : viewMode === 'map' && orders.length > 0 ? (
                            <ShipperOrderMap
                                orders={orders}
                                currentLocation={currentLocation}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
