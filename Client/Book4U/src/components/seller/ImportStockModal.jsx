import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { importStock } from '@/services/api/warehouseApi';

function ImportStockModal({ isOpen, onClose, product, warehouses, onSuccess }) {
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Nhập kho sản phẩm mới');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && warehouses.length > 0) {
            setSelectedWarehouse(warehouses[0]._id || '');
        }
    }, [isOpen, warehouses]);

    const validateForm = () => {
        const newErrors = {};
        if (!selectedWarehouse) newErrors.warehouse = 'Vui lòng chọn kho';
        if (!quantity || quantity <= 0)
            newErrors.quantity = 'Số lượng phải lớn hơn 0';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await importStock({
                warehouseId: selectedWarehouse,
                bookId: product._id,
                quantity: parseInt(quantity),
                reason: reason || 'Nhập kho',
            });

            if (res.success) {
                toast.success('✅ Nhập kho thành công!');
                resetForm();
                onClose();
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error('Error:', err);
            toast.error(err.message || 'Lỗi khi nhập kho');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedWarehouse(warehouses[0]?._id || '');
        setQuantity('');
        setReason('Nhập kho sản phẩm mới');
        setErrors({});
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Nhập Kho
                            </h2>
                            <p className="text-sm text-gray-600">
                                {product.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Warehouse Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Chọn Kho
                            <span className="text-red-500"> *</span>
                        </label>
                        <select
                            value={selectedWarehouse}
                            onChange={(e) => {
                                setSelectedWarehouse(e.target.value);
                                if (errors.warehouse) {
                                    setErrors({ ...errors, warehouse: '' });
                                }
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                errors.warehouse
                                    ? 'border-red-300'
                                    : 'border-gray-300'
                            }`}>
                            <option value="">-- Chọn kho --</option>
                            {warehouses.map((warehouse) => (
                                <option
                                    key={warehouse._id}
                                    value={warehouse._id}>
                                    {warehouse.name} ({warehouse.district},
                                    {warehouse.province})
                                </option>
                            ))}
                        </select>
                        {errors.warehouse && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.warehouse}
                            </p>
                        )}
                    </div>

                    {/* Quantity Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Số Lượng
                            <span className="text-red-500"> *</span>
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(e.target.value);
                                if (errors.quantity) {
                                    setErrors({ ...errors, quantity: '' });
                                }
                            }}
                            placeholder="Nhập số lượng"
                            min="1"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                errors.quantity
                                    ? 'border-red-300'
                                    : 'border-gray-300'
                            }`}
                        />
                        {errors.quantity && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.quantity}
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Lý do / Ghi chú
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do nhập kho"
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold text-blue-900">
                                📝 Lưu ý:
                            </span>
                            <br />
                            Sau khi nhập kho, bạn có thể đăng bán sản phẩm này.
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang xử lý...
                            </>
                        ) : (
                            '✓ Nhập Kho'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImportStockModal;
