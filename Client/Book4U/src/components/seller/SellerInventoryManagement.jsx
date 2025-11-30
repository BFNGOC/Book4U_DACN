import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/userContext';
import {
    getWarehousesBySeller,
    createWarehouse,
    updateWarehouse,
    importStock,
    exportStock,
    getWarehouseLogs,
    getWarehouseInventory,
} from '../../services/api/warehouseApi';
import { getSellerBooks } from '../../services/api/bookApi';
import WarehouseModal from '../modal/WarehouseModal';
import {
    AlertCircle,
    Package,
    Plus,
    ArrowDown,
    ArrowUp,
    History,
    MapPin,
    Phone,
    User,
    X,
    Filter,
    ChevronDown,
} from 'lucide-react';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

function SellerInventoryManagement() {
    const { user } = useUser();
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);

    // Import/Export Modal
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('import'); // 'import' | 'export'
    const [books, setBooks] = useState([]);
    const [formData, setFormData] = useState({
        bookId: '',
        quantity: '',
        reason: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Logs
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logFilters, setLogFilters] = useState({
        type: '',
        page: 1,
        limit: 15,
    });

    // Inventory (sản phẩm trong kho)
    const [showInventory, setShowInventory] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);

    // Warehouse Management Modal
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    useEffect(() => {
        if (user?._id) {
            fetchWarehouseData();
            fetchBooks();
        }
    }, [user?._id]);

    const fetchWarehouseData = async () => {
        try {
            setLoading(true);
            const res = await getWarehousesBySeller();
            if (res.success && res.data?.length > 0) {
                setWarehouses(res.data);
                setSelectedWarehouse(res.data[0]);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBooks = async () => {
        try {
            // Lấy chỉ sách của seller hiện tại
            const res = await getSellerBooks({ limit: 100 });
            if (res.success) {
                setBooks(res.data);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        }
    };

    const fetchLogs = async () => {
        try {
            setLogsLoading(true);
            const res = await getWarehouseLogs({
                warehouseId: selectedWarehouse?._id,
                type: logFilters.type || undefined,
                page: logFilters.page,
                limit: logFilters.limit,
            });
            if (res.success) {
                setLogs(res.data);
            }
        } catch (err) {
            console.error('Lỗi:', err);
            toast.error('Lỗi khi tải lịch sử');
        } finally {
            setLogsLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            setInventoryLoading(true);
            const res = await getWarehouseInventory(selectedWarehouse?._id, {
                limit: 50,
            });
            if (res.success) {
                setInventory(res.data);
            }
        } catch (err) {
            console.error('Lỗi:', err);
            toast.error('Lỗi khi tải danh sách sản phẩm');
        } finally {
            setInventoryLoading(false);
        }
    };

    const handleOpenModal = (type) => {
        setModalType(type);
        setFormData({ bookId: '', quantity: '', reason: '' });
        setShowModal(true);
    };

    // Warehouse CRUD handlers
    const handleCreateWarehouse = async (warehouseData) => {
        try {
            const res = await createWarehouse(warehouseData);
            if (res.success) {
                toast.success('✅ Tạo kho thành công');
                setShowWarehouseModal(false);
                fetchWarehouseData();
            }
        } catch (err) {
            toast.error(err.message || 'Lỗi khi tạo kho');
        }
    };

    const handleUpdateWarehouse = async (warehouseData) => {
        try {
            const res = await updateWarehouse(
                editingWarehouse._id,
                warehouseData
            );
            if (res.success) {
                toast.success('✅ Cập nhật kho thành công');
                setShowWarehouseModal(false);
                setEditingWarehouse(null);
                fetchWarehouseData();
            }
        } catch (err) {
            toast.error(err.message || 'Lỗi khi cập nhật kho');
        }
    };

    const handleWarehouseModalSave = (warehouseData, skipApiCall) => {
        // skipApiCall = false: SellerInventoryManagement - gọi API
        // skipApiCall = true: SellerStep2 - chỉ return local data (không xảy ra trong file này)
        if (!skipApiCall) {
            if (editingWarehouse) {
                handleUpdateWarehouse(warehouseData);
            } else {
                handleCreateWarehouse(warehouseData);
            }
        }
    };

    const handleEditWarehouse = (warehouse) => {
        setEditingWarehouse(warehouse);
        setShowWarehouseModal(true);
    };

    const handleSubmitForm = async () => {
        if (!formData.bookId || !formData.quantity) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                warehouseId: selectedWarehouse?._id,
                bookId: formData.bookId,
                quantity: parseInt(formData.quantity),
                reason: formData.reason || undefined,
            };

            const res =
                modalType === 'import'
                    ? await importStock(payload)
                    : await exportStock(payload);

            if (res.success) {
                toast.success(
                    `${
                        modalType === 'import' ? 'Nhập' : 'Xuất'
                    } kho thành công!`
                );
                setShowModal(false);
                setFormData({ bookId: '', quantity: '', reason: '' });
                fetchLogs(); // Refresh logs
            } else {
                toast.error(res.message || 'Thao tác thất bại');
            }
        } catch (err) {
            console.error('Lỗi:', err);
            toast.error('Lỗi khi thực hiện thao tác');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">
                        Đang tải dữ liệu...
                    </p>
                </div>
            </div>
        );

    if (warehouses.length === 0)
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center bg-gray-50 rounded-2xl p-8 max-w-sm">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">
                        Không có kho hàng nào
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                        Vui lòng cập nhật thông tin cửa hàng để tạo kho hàng
                    </p>
                </div>
            </div>
        );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <Package className="w-8 h-8" />
                    <h1 className="text-3xl font-bold">Quản Lý Kho Hàng</h1>
                </div>
                <p className="text-blue-100 mt-2">
                    Quản lý tồn kho, nhập/xuất hàng và theo dõi lịch sử thao tác
                </p>
            </div>

            {/* Warehouse Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Danh Sách Kho Hàng
                    </h2>
                    <button
                        onClick={() => {
                            setEditingWarehouse(null);
                            setShowWarehouseModal(true);
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold">
                        <Plus className="w-5 h-5" />
                        Thêm Kho
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {warehouses.map((warehouse, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setSelectedWarehouse(warehouse);
                                setShowLogs(false);
                                setLogFilters({ ...logFilters, page: 1 });
                            }}
                            className={`relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-105 group ${
                                selectedWarehouse?._id === warehouse._id
                                    ? 'ring-2 ring-blue-600 shadow-xl'
                                    : 'shadow-md hover:shadow-lg'
                            }`}>
                            <div
                                className={`p-5 h-full ${
                                    selectedWarehouse?._id === warehouse._id
                                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-600'
                                        : 'bg-white border-2 border-gray-100'
                                }`}>
                                {/* Status Badge */}
                                {warehouse.isDefault && (
                                    <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full mb-3">
                                        Kho mặc định
                                    </div>
                                )}

                                {/* Warehouse Name */}
                                <h3 className="font-bold text-lg text-gray-900 text-left">
                                    {warehouse.name}
                                </h3>

                                {/* Location */}
                                <div className="flex items-start gap-2 mt-3 text-left">
                                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium">
                                            {warehouse.street}
                                        </p>
                                        <p className="text-xs">
                                            {warehouse.ward},{' '}
                                            {warehouse.district},{' '}
                                            {warehouse.province}
                                        </p>
                                    </div>
                                </div>

                                {/* Manager Info */}
                                <div className="space-y-2 mt-4 text-left">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700 font-medium">
                                            {warehouse.managerName ||
                                                'Chưa cập nhật'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700 font-medium">
                                            {warehouse.managerPhone ||
                                                'Chưa cập nhật'}
                                        </span>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditWarehouse(warehouse);
                                    }}
                                    className="mt-4 w-full px-3 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                                    ✏️ Sửa Kho
                                </button>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Warehouse Details */}
            {selectedWarehouse && (
                <div className="space-y-6">
                    {/* Warehouse Info & Actions */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                            {/* Warehouse Details */}
                            <div className="lg:col-span-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Thông Tin Kho
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">
                                            Tên kho
                                        </p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">
                                            {selectedWarehouse.name}
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">
                                            Quản lý
                                        </p>
                                        <p className="text-base font-medium text-gray-800 mt-1">
                                            {selectedWarehouse.managerName ||
                                                'Chưa cập nhật'}
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">
                                            Số điện thoại
                                        </p>
                                        <p className="text-base font-medium text-gray-800 mt-1">
                                            {selectedWarehouse.managerPhone ||
                                                'Chưa cập nhật'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="lg:col-span-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Địa Chỉ
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <span className="font-semibold">
                                            {selectedWarehouse.street}
                                        </span>
                                        <br />
                                        {selectedWarehouse.ward},{' '}
                                        {selectedWarehouse.district}
                                        <br />
                                        {selectedWarehouse.province}
                                        {selectedWarehouse.postalCode && (
                                            <>
                                                <br />
                                                Mã:{' '}
                                                {selectedWarehouse.postalCode}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    Thao Tác
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() =>
                                            handleOpenModal('import')
                                        }
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                                        <ArrowDown className="w-5 h-5" />
                                        Nhập Kho
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleOpenModal('export')
                                        }
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                                        <ArrowUp className="w-5 h-5" />
                                        Xuất Kho
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowLogs(!showLogs);
                                            if (!showLogs) fetchLogs();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                                        <History className="w-5 h-5" />
                                        Lịch Sử
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowInventory(!showInventory);
                                            if (!showInventory)
                                                fetchInventory();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                                        <Package className="w-5 h-5" />
                                        Danh Sách Hàng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logs Section */}
                    {showLogs && (
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-blue-600" />
                                    Lịch Sử Nhập/Xuất Kho
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-600" />
                                    <select
                                        value={logFilters.type}
                                        onChange={(e) => {
                                            setLogFilters({
                                                ...logFilters,
                                                type: e.target.value,
                                                page: 1,
                                            });
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Tất cả loại</option>
                                        <option value="import">Nhập kho</option>
                                        <option value="export">Xuất kho</option>
                                        <option value="order_create">
                                            Tạo đơn hàng
                                        </option>
                                        <option value="order_cancel">
                                            Hủy đơn hàng
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {logsLoading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-gray-600 font-medium">
                                        Đang tải lịch sử...
                                    </p>
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                    Loại
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                    Sách
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                                    Số Lượng
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                                    Trước
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                                    Sau
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                    Ngày
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {logs.map((log, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                                log.type ===
                                                                'import'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : log.type ===
                                                                      'export'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : log.type ===
                                                                      'order_create'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {log.type ===
                                                            'import'
                                                                ? 'Nhập'
                                                                : log.type ===
                                                                  'export'
                                                                ? 'Xuất'
                                                                : log.type ===
                                                                  'order_create'
                                                                ? 'Đơn Hàng'
                                                                : 'Hủy'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-gray-900 font-medium">
                                                            {log.bookId
                                                                ?.title ||
                                                                'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-bold text-gray-900">
                                                            {log.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-600">
                                                        {log.quantityBefore}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-600">
                                                        {log.quantityAfter}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {new Date(
                                                            log.createdAt
                                                        ).toLocaleDateString(
                                                            'vi-VN',
                                                            {
                                                                year: 'numeric',
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                            }
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">
                                        Chưa có lịch sử thao tác
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showInventory && selectedWarehouse && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            Danh Sách Sản Phẩm - {selectedWarehouse.name}
                        </h3>
                    </div>

                    {inventoryLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                            <p className="text-gray-600 font-medium">
                                Đang tải danh sách...
                            </p>
                        </div>
                    ) : inventory?.items && inventory.items.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                            Tên Sách
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                            Tác Giả
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                            Danh Mục
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                            Giá
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                            Tồn Kho
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                            Trạng Thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {inventory.items.map(
                                        (item, idx) => (
                                            console.log(item),
                                            (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="text-gray-900 font-medium">
                                                            {item.bookTitle}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-gray-600">
                                                            {item.bookAuthor}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-gray-600">
                                                            {item.bookCategory}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-bold text-gray-900">
                                                            {item.bookPrice.toLocaleString(
                                                                'vi-VN'
                                                            )}{' '}
                                                            đ
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                                item.isPublished
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {item.isPublished
                                                                ? 'Đang bán'
                                                                : 'Nháp'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">
                                Kho này chưa có sản phẩm
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900">
                            💡 Mẹo Quản Lý Kho
                        </h4>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>• Nhập kho để tăng tồn hàng</li>
                            <li>• Xuất kho để giảm tồn hàng</li>
                            <li>• Lịch sử ghi lại tất cả thao tác</li>
                            <li>• Chọn sách, nhập số lượng, lưu thao tác</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Import/Export Modal - Redesigned */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        {/* Modal Header */}
                        <div
                            className={`bg-gradient-to-r ${
                                modalType === 'import'
                                    ? 'from-green-500 to-green-600'
                                    : 'from-orange-500 to-orange-600'
                            } px-6 py-6 text-white flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                {modalType === 'import' ? (
                                    <ArrowDown className="w-6 h-6" />
                                ) : (
                                    <ArrowUp className="w-6 h-6" />
                                )}
                                <h3 className="text-2xl font-bold">
                                    {modalType === 'import'
                                        ? 'Nhập Kho'
                                        : 'Xuất Kho'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Chọn Sách{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.bookId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            bookId: e.target.value,
                                        })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                    <option value="">-- Chọn sách --</option>
                                    {books.map((book) => (
                                        <option key={book._id} value={book._id}>
                                            {book.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Số Lượng{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Nhập số lượng"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            quantity: e.target.value,
                                        })
                                    }
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Lý Do (Tùy Chọn)
                                </label>
                                <textarea
                                    placeholder="Nhập lý do nhập/xuất kho"
                                    value={formData.reason}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reason: e.target.value,
                                        })
                                    }
                                    rows="3"
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors">
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmitForm}
                                disabled={submitting}
                                className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-all ${
                                    modalType === 'import'
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500'
                                } disabled:opacity-50`}>
                                {submitting ? 'Đang xử lý...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warehouse Modal - Tạo/Sửa Kho */}
            {showWarehouseModal && (
                <WarehouseModal
                    onClose={() => {
                        setShowWarehouseModal(false);
                        setEditingWarehouse(null);
                    }}
                    onSave={handleWarehouseModalSave}
                    skipApiCall={false}
                />
            )}
        </div>
    );
}

export default SellerInventoryManagement;
