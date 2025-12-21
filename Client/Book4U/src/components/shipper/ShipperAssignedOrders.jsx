import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { completeDeliveryStage } from '../../services/api/multiDeliveryApi';

export default function ShipperAssignedOrders({
    assignedStages = [],
    onStageCompleted,
}) {
    const [completing, setCompleting] = useState(null);
    const [expandedStageId, setExpandedStageId] = useState(null);
    const [showNotes, setShowNotes] = useState({});
    const [notes, setNotes] = useState({});

    const handleCompleteStage = async (stageId) => {
        try {
            setCompleting(stageId);
            const response = await completeDeliveryStage(stageId, {
                notes: notes[stageId] || '',
            });

            if (response.success) {
                toast.success('✅ Hoàn thành giai đoạn!');
                setNotes((prev) => ({ ...prev, [stageId]: '' }));
                onStageCompleted();
            } else {
                toast.error(response.message || 'Lỗi hoàn thành giai đoạn');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
            console.error(error);
        } finally {
            setCompleting(null);
        }
    };

    const getStageLabel = (stageNumber, totalStages, isLastStage) => {
        if (totalStages === 1) return '📦 Pickup & Delivery';
        if (stageNumber === 1) return '📦 Stage 1: Pickup từ Kho';
        if (stageNumber === 2) return '🚚 Stage 2: Chuyển Hub Liên Tỉnh';
        return '📍 Stage 3: Giao cho Khách';
    };

    const getStageStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-50 border-yellow-500',
            in_transit: 'bg-blue-50 border-blue-500',
            completed: 'bg-green-50 border-green-500',
            failed: 'bg-red-50 border-red-500',
        };
        return colors[status] || 'bg-gray-50 border-gray-500';
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                label: '⏳ Chờ',
            },
            in_transit: {
                bg: 'bg-blue-100',
                text: 'text-blue-700',
                label: '🚚 Đang Lấy/Giao',
            },
            delivered: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                label: '✅ Hoàn Thành',
            },
            failed: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                label: '❌ Thất Bại',
            },
        };
        return badges[status] || badges['pending'];
    };

    if (assignedStages.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 text-lg">
                    📭 Bạn chưa nhận đơn hàng nào
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                    🚚 Đơn Hàng Được Giao
                </h3>
                <p className="text-gray-600 text-sm">
                    Bạn đang quản lý {assignedStages.length} giai đoạn giao hàng
                </p>
            </div>

            <div className="space-y-3">
                {assignedStages.map((stage) => {
                    const orderDetail = stage.orderDetailId;
                    const mainOrder = orderDetail?.mainOrderId;
                    const customer = mainOrder?.profileId;
                    const badge = getStatusBadge(stage.status);

                    return (
                        <div
                            key={stage._id}
                            className={`rounded-lg shadow-md overflow-hidden border-l-4 hover:shadow-lg transition ${getStageStatusColor(
                                stage.status
                            )}`}>
                            {/* Header */}
                            <div
                                className="p-4 cursor-pointer hover:opacity-80 transition"
                                onClick={() =>
                                    setExpandedStageId(
                                        expandedStageId === stage._id
                                            ? null
                                            : stage._id
                                    )
                                }>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                {getStageLabel(
                                                    stage.stageNumber,
                                                    stage.totalStages,
                                                    stage.isLastStage
                                                )}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <p className="text-sm font-medium text-gray-700 mt-2">
                                            Đơn #{orderDetail?._id.slice(-8)}
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            {/* From */}
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold">
                                                    📦 Từ
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stage.fromLocation
                                                        ?.warehouseName ||
                                                        'Transfer Hub'}
                                                </p>
                                            </div>

                                            {/* To */}
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold">
                                                    📍 Đến
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stage.toLocation
                                                        ?.warehouseName ||
                                                        stage.toLocation
                                                            ?.address ||
                                                        customer?.firstName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedStageId === stage._id && (
                                <div className="border-t bg-white p-4 space-y-4">
                                    {/* Timeline */}
                                    <div className="bg-gray-50 rounded p-3 border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-3">
                                            📅 Lịch Sử
                                        </p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Tạo:
                                                </span>
                                                <span className="text-gray-900">
                                                    {new Date(
                                                        stage.createdAt
                                                    ).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                            {stage.acceptedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Nhận:
                                                    </span>
                                                    <span className="text-green-600 font-medium">
                                                        ✓{' '}
                                                        {new Date(
                                                            stage.acceptedAt
                                                        ).toLocaleString(
                                                            'vi-VN'
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {stage.deliveredAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Hoàn thành:
                                                    </span>
                                                    <span className="text-green-600 font-medium">
                                                        ✓{' '}
                                                        {new Date(
                                                            stage.deliveredAt
                                                        ).toLocaleString(
                                                            'vi-VN'
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Info */}
                                    <div className="bg-white rounded p-3 border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                            📋 Thông Tin Đơn Hàng
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Khách:
                                                </span>
                                                <span className="font-medium">
                                                    {customer?.firstName}{' '}
                                                    {customer?.lastName}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Giá trị:
                                                </span>
                                                <span className="font-bold text-red-500">
                                                    {orderDetail?.totalAmount?.toLocaleString(
                                                        'vi-VN'
                                                    )}{' '}
                                                    ₫
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Info */}
                                    {stage.isLastStage && (
                                        <div className="bg-white rounded p-3 border border-gray-200">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">
                                                📍 Địa Chỉ Giao Hàng
                                            </p>
                                            <div className="space-y-1 text-sm">
                                                <p className="font-medium text-gray-900">
                                                    {
                                                        orderDetail
                                                            ?.shippingAddress
                                                            ?.fullName
                                                    }
                                                </p>
                                                <p className="text-gray-600">
                                                    📞{' '}
                                                    {
                                                        orderDetail
                                                            ?.shippingAddress
                                                            ?.phone
                                                    }
                                                </p>
                                                <p className="text-gray-600">
                                                    {
                                                        orderDetail
                                                            ?.shippingAddress
                                                            ?.address
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Items */}
                                    {orderDetail?.items &&
                                        orderDetail.items.length > 0 && (
                                            <div className="bg-white rounded p-3 border border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 mb-2">
                                                    📦 Sản Phẩm
                                                </p>
                                                <div className="space-y-2">
                                                    {orderDetail.items.map(
                                                        (item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between text-sm border-b pb-2 last:border-0">
                                                                <span className="text-gray-700">
                                                                    SL:{' '}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                                <span className="font-medium">
                                                                    {(
                                                                        item.quantity *
                                                                        item.price
                                                                    ).toLocaleString(
                                                                        'vi-VN'
                                                                    )}{' '}
                                                                    ₫
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Notes Section */}
                                    {stage.status !== 'completed' && (
                                        <div className="bg-white rounded p-3 border border-gray-200">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">
                                                📝 Ghi Chú (Tùy Chọn)
                                            </p>
                                            <textarea
                                                value={notes[stage._id] || ''}
                                                onChange={(e) =>
                                                    setNotes((prev) => ({
                                                        ...prev,
                                                        [stage._id]:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="VD: Khách không ở nhà, để tại cửa..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                            />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {stage.status === 'accepted' && (
                                        <button
                                            onClick={() => {
                                                // Update to in_transit
                                                handleCompleteStage(stage._id);
                                            }}
                                            disabled={completing === stage._id}
                                            className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                                                completing === stage._id
                                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}>
                                            {completing === stage._id
                                                ? '⏳ Đang xử lý...'
                                                : '🚚 Bắt Đầu Lấy/Giao'}
                                        </button>
                                    )}

                                    {stage.status === 'in_transit' && (
                                        <button
                                            onClick={() =>
                                                handleCompleteStage(stage._id)
                                            }
                                            disabled={completing === stage._id}
                                            className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                                                completing === stage._id
                                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}>
                                            {completing === stage._id
                                                ? '⏳ Đang xử lý...'
                                                : '✅ Hoàn Thành Giai Đoạn'}
                                        </button>
                                    )}

                                    {stage.status === 'completed' && (
                                        <div className="w-full px-4 py-3 rounded-lg font-semibold text-center bg-green-100 text-green-700">
                                            ✅ Đã Hoàn Thành
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
