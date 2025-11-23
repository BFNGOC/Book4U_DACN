import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/userContext';
import { getSellerStore } from '../../services/api/sellerApi';
import { AlertCircle, Package } from 'lucide-react';

function SellerInventoryManagement() {
    const { user } = useUser();
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id) {
            fetchWarehouseData();
        }
    }, [user?._id]);

    const fetchWarehouseData = async () => {
        try {
            setLoading(true);
            const res = await getSellerStore(user._id);
            if (res.success && res.data?.warehouses) {
                setWarehouses(res.data.warehouses);
                setSelectedWarehouse(res.data.warehouses[0]);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return <p className="text-center text-gray-500">Đang tải...</p>;

    if (warehouses.length === 0)
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">
                    Không có kho hàng nào. Vui lòng cập nhật thông tin cửa hàng.
                </p>
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Warehouse Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warehouses.map((warehouse, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedWarehouse(warehouse)}
                        className={`p-4 text-left rounded-lg border-2 transition-all ${
                            selectedWarehouse === warehouse
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <h3 className="font-bold text-gray-900">
                            {warehouse.street}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {warehouse.ward}, {warehouse.district},{' '}
                            {warehouse.province}
                        </p>
                        <div className="mt-3 flex gap-6">
                            <div>
                                <p className="text-xs text-gray-500">Quản lý</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {warehouse.managerName || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">
                                    Điện thoại
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {warehouse.managerPhone || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Selected Warehouse Details */}
            {selectedWarehouse && (
                <div className="bg-white rounded-lg border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">
                                Thông tin kho
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Quản lý
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedWarehouse.managerName ||
                                            'Chưa cập nhật'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Số điện thoại
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedWarehouse.managerPhone ||
                                            'Chưa cập nhật'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Địa chỉ
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedWarehouse.street},{' '}
                                        {selectedWarehouse.ward},{' '}
                                        {selectedWarehouse.district},{' '}
                                        {selectedWarehouse.province}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">
                                Thống kê hàng
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        <span className="text-gray-700">
                                            Tổng hàng trong kho
                                        </span>
                                    </div>
                                    <p className="font-bold text-blue-600">0</p>
                                </div>

                                <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-gray-700">
                                            Sắp hết hàng
                                        </span>
                                    </div>
                                    <p className="font-bold text-red-600">0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Alerts */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-yellow-900">
                            Thông báo kho
                        </h4>
                        <p className="text-sm text-yellow-800 mt-1">
                            Vui lòng kiểm tra và cập nhật thông tin kho hàng để
                            quản lý tồn kho hiệu quả.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SellerInventoryManagement;
