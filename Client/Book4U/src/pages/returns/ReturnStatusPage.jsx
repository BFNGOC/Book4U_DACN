import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function ReturnStatusPage() {
    const { orderId } = useParams();
    const [returnData, setReturnData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReturnStatus();
    }, [orderId]);

    const fetchReturnStatus = async () => {
        try {
            // Fetch return data
            setLoading(false);
        } catch (error) {
            toast.error('Lỗi lấy thông tin hoàn hàng');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Đang tải...</p>
            </div>
        );
    }

    if (!returnData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Không có yêu cầu hoàn hàng</p>
            </div>
        );
    }

    const statusSteps = [
        { key: 'pending', label: '⏳ Chờ Xử Lý', icon: '⏳' },
        { key: 'approved', label: '✅ Được Duyệt', icon: '✅' },
        { key: 'in_transit', label: '🚚 Đang Vận Chuyển', icon: '🚚' },
        { key: 'received', label: '📦 Đã Nhận', icon: '📦' },
        { key: 'refunded', label: '💰 Đã Hoàn Tiền', icon: '💰' },
    ];

    const currentStepIndex = statusSteps.findIndex(
        (s) => s.key === returnData.status
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        🔄 Trạng Thái Hoàn Hàng
                    </h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Mã Đơn</p>
                            <p className="font-semibold text-gray-900">
                                {orderId?.slice(-8)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">
                                Số Tiền Hoàn
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {returnData.refundAmount?.toLocaleString(
                                    'vi-VN'
                                )}{' '}
                                ₫
                            </p>
                        </div>
                    </div>
                </div>

                {/* Return Reason */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        📝 Lý Do Hoàn Hàng
                    </h2>
                    <p className="text-gray-600 mb-3">
                        <span className="font-semibold">Lý do:</span>{' '}
                        {returnData.reason}
                    </p>
                    <p className="text-gray-600">
                        <span className="font-semibold">Chi tiết:</span>{' '}
                        {returnData.description}
                    </p>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <div className="relative">
                        {statusSteps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.key} className="mb-8 last:mb-0">
                                    <div className="flex items-start">
                                        {/* Timeline Dot */}
                                        <div
                                            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                                                isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isCurrent
                                                    ? 'bg-blue-500 text-white animate-pulse'
                                                    : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {step.icon}
                                        </div>

                                        {/* Timeline Line */}
                                        {index < statusSteps.length - 1 && (
                                            <div
                                                className={`absolute left-6 top-12 w-1 h-12 transition ${
                                                    isCompleted
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-200'
                                                }`}></div>
                                        )}

                                        {/* Content */}
                                        <div className="ml-6 pt-1">
                                            <p className="font-semibold text-gray-900">
                                                {step.label}
                                            </p>
                                            {isCompleted && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    ✓ Hoàn thành
                                                </p>
                                            )}
                                            {isCurrent && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    🔄 Đang xử lý...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Evidence Photos */}
                {returnData.photos?.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            📸 Hình Ảnh Minh Chứng
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {returnData.photos.map((photo, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={photo}
                                        alt={`Evidence ${index + 1}`}
                                        className="w-full h-48 object-cover hover:scale-105 transition cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Seller Response */}
                {returnData.sellerResponse && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            💬 Phản Hồi Từ Người Bán
                        </h2>
                        <p className="text-gray-600">
                            {returnData.sellerResponse}
                        </p>
                    </div>
                )}

                {/* Status Message */}
                {currentStepIndex === statusSteps.length - 1 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <p className="text-green-800 font-semibold text-center">
                            ✅ Hoàn hàng đã hoàn thành. Tiền đã được hoàn vào
                            tài khoản của bạn.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
