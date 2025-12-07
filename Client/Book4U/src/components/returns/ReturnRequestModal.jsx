import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ReturnRequestModal({ order, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
        photos: [],
    });
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length + photoPreview.length > 3) {
            toast.error('Tối đa 3 ảnh');
            return;
        }

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview((prev) => [...prev, reader.result]);
                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, file],
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.reason || !formData.description) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(order._id, formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                        🔄 Yêu Cầu Hoàn Hàng
                    </h2>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Order Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-semibold">Mã đơn:</span>{' '}
                            {order._id?.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Số tiền:</span>{' '}
                            {order.totalAmount?.toLocaleString('vi-VN')} ₫
                        </p>
                    </div>

                    {/* Return Reason */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Lý Do Hoàn Hàng *
                        </label>
                        <select
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                            <option value="">-- Chọn lý do --</option>
                            <option value="Sản phẩm bị lỗi">
                                Sản phẩm bị lỗi
                            </option>
                            <option value="Sản phẩm không đúng mô tả">
                                Sản phẩm không đúng mô tả
                            </option>
                            <option value="Sản phẩm bị hư hỏng">
                                Sản phẩm bị hư hỏng
                            </option>
                            <option value="Giao nhầm sản phẩm">
                                Giao nhầm sản phẩm
                            </option>
                            <option value="Không muốn giữ">
                                Không muốn giữ
                            </option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Mô Tả Chi Tiết *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Mô tả lý do hoàn hàng chi tiết..."
                            rows="4"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"></textarea>
                    </div>

                    {/* Photos */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Hình Ảnh Minh Chứng (Tối đa 3)
                        </label>
                        <div className="space-y-3">
                            {/* Photo Previews */}
                            {photoPreview.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {photoPreview.map((preview, index) => (
                                        <div
                                            key={index}
                                            className="relative rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-20 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePhoto(index)
                                                }
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Button */}
                            {photoPreview.length < 3 && (
                                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition">
                                    <div className="text-center">
                                        <span className="text-2xl">📸</span>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Tải lên ảnh
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
