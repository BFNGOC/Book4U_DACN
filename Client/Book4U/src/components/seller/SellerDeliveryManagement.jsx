import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Truck,
    CheckCircle,
    AlertCircle,
    Loader,
    Edit2,
} from 'lucide-react';
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

/**
 * ============================================================
 * SELLER DELIVERY MANAGEMENT COMPONENT
 * ============================================================
 * Seller xem delivery stages của đơn hàng đã ship
 * - Xem chi tiết từng stage
 * - Xem vị trí shipper realtime
 * - Xem lịch sử vận chuyển
 * 🆕 - Confirm button cho Stage 2
 */

const SellerDeliveryManagement = ({ orderDetailId }) => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedStage, setExpandedStage] = useState(null);
    const [confirmingStage, setConfirmingStage] = useState(null);
    const [confirmNotes, setConfirmNotes] = useState('');

    useEffect(() => {
        if (orderDetailId) {
            fetchDeliveryStages();
            // Auto-refresh every 60 seconds
            const interval = setInterval(fetchDeliveryStages, 60000);
            return () => clearInterval(interval);
        }
    }, [orderDetailId]);

    const fetchDeliveryStages = async () => {
        try {
            setLoading(true);
            const response = await multiDeliveryApi.getDeliveryStages(
                orderDetailId
            );
            if (response.success) {
                setStages(response.data.stages || []);
                setError(null);
            }
        } catch (err) {
            setError('Không thể tải thông tin vận chuyển');
            console.error('Error fetching stages:', err);
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Confirm Stage 2 delivery
    const handleConfirmStage2 = async (stageId) => {
        try {
            setConfirmingStage(stageId);
            const response = await multiDeliveryApi.confirmCarrierDelivery(
                stageId,
                { notes: confirmNotes }
            );

            if (response.success) {
                // Refresh data
                await fetchDeliveryStages();
                setConfirmNotes('');
                alert(
                    '✅ Xác nhận Stage 2 hoàn thành. Stage 3 đã được kích hoạt!'
                );
            } else {
                alert(`❌ Lỗi: ${response.message}`);
            }
        } catch (err) {
            alert(`❌ Lỗi: ${err.message}`);
        } finally {
            setConfirmingStage(null);
        }
    };

    const getStageStatusColor = (status) => {
        const colors = {
            pending: 'bg-gray-100 text-gray-700',
            accepted: 'bg-blue-100 text-blue-700',
            picked_up: 'bg-blue-100 text-blue-700',
            in_transit: 'bg-yellow-100 text-yellow-700',
            at_next_hub: 'bg-cyan-100 text-cyan-700',
            delivered: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
        };
        return colors[status] || colors.pending;
    };

    const getStageStatusLabel = (status) => {
        const labels = {
            pending: '⏳ Chờ nhận',
            accepted: '✓ Đã chấp nhận',
            picked_up: '📦 Đã lấy hàng',
            in_transit: '🚚 Đang vận chuyển',
            at_next_hub: '🏢 Tới trung tâm',
            delivered: '✅ Đã giao',
            failed: '❌ Giao thất bại',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </div>
        );
    }

    if (stages.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">
                    Chưa có thông tin vận chuyển
                </p>
                <p className="text-sm mt-1">Đơn hàng sẽ được xử lý sớm</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Theo dõi vận chuyển
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Tổng {stages.length} giai đoạn{' '}
                        {stages.some((s) => s.isInterProvincial)
                            ? '(Liên tỉnh)'
                            : '(Nội tỉnh)'}
                    </p>
                </div>
                <button
                    onClick={fetchDeliveryStages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    Cập nhật
                </button>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {stages.map((stage, index) => (
                    <div
                        key={stage._id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                        {/* Stage header */}
                        <div
                            className="p-4 cursor-pointer bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200"
                            onClick={() =>
                                setExpandedStage(
                                    expandedStage === stage._id
                                        ? null
                                        : stage._id
                                )
                            }>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Stage number */}
                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                                        {stage.stageNumber}
                                    </div>

                                    {/* Stage info */}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {stage.stageNumber === 1 &&
                                                'Lấy hàng từ kho'}
                                            {stage.stageNumber === 2 &&
                                                'Vận chuyển liên tỉnh'}
                                            {stage.stageNumber === 3 &&
                                                'Giao hàng cho khách'}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {stage.fromLocation?.address ||
                                                stage.fromLocation
                                                    ?.warehouseName ||
                                                'Kho'}{' '}
                                            →{' '}
                                            {stage.toLocation?.address ||
                                                stage.toLocation
                                                    ?.warehouseName ||
                                                'Khách hàng'}
                                        </p>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div
                                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${getStageStatusColor(
                                        stage.status
                                    )}`}>
                                    {getStageStatusLabel(stage.status)}
                                </div>
                            </div>
                        </div>

                        {/* Stage details (expanded) */}
                        {expandedStage === stage._id && (
                            <div className="p-4 bg-gray-50 space-y-4">
                                {/* Locations */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                            📍 Từ
                                        </h4>
                                        <div className="bg-white p-3 rounded-lg text-sm text-gray-700">
                                            <p className="font-medium">
                                                {stage.fromLocation
                                                    ?.warehouseName ||
                                                    stage.fromLocation?.type}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {stage.fromLocation?.province},{' '}
                                                {stage.fromLocation?.district}
                                            </p>
                                            <p className="text-xs mt-1">
                                                {stage.fromLocation?.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                            🏁 Đến
                                        </h4>
                                        <div className="bg-white p-3 rounded-lg text-sm text-gray-700">
                                            <p className="font-medium">
                                                {stage.toLocation
                                                    ?.warehouseName ||
                                                    stage.toLocation?.type}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {stage.toLocation?.province},{' '}
                                                {stage.toLocation?.district}
                                            </p>
                                            <p className="text-xs mt-1">
                                                {stage.toLocation?.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Current location */}
                                {stage.currentLocation && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                            📍 Vị trí hiện tại
                                        </h4>
                                        <div className="bg-white p-3 rounded-lg text-sm">
                                            <p className="font-medium text-blue-600">
                                                {stage.currentLocation?.address}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {new Date(
                                                    stage.currentLocation?.timestamp
                                                ).toLocaleString('vi-VN')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                📌{' '}
                                                {stage.currentLocation?.latitude.toFixed(
                                                    4
                                                )}
                                                ,{' '}
                                                {stage.currentLocation?.longitude.toFixed(
                                                    4
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Shipper info */}
                                {stage.assignedShipperId && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                            👤 Shipper phụ trách
                                        </h4>
                                        <div className="bg-white p-3 rounded-lg text-sm text-gray-700">
                                            <p className="font-medium">
                                                {stage.assignedShipperId
                                                    ?.shipperName ||
                                                    'Chưa xác định'}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {stage.assignedShipperId?.phone}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Location history */}
                                {stage.locationHistory &&
                                    stage.locationHistory.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                                📍 Lịch sử vị trí (
                                                {stage.locationHistory.length})
                                            </h4>
                                            <div className="bg-white rounded-lg divide-y max-h-64 overflow-y-auto">
                                                {stage.locationHistory
                                                    .slice()
                                                    .reverse()
                                                    .map((loc, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-3 text-sm">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-gray-900">
                                                                        {
                                                                            loc.address
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 mt-1">
                                                                        {new Date(
                                                                            loc.timestamp
                                                                        ).toLocaleString(
                                                                            'vi-VN'
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap ml-2">
                                                                    {loc.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Timeline info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600 text-xs mb-1">
                                            🕐 Thời gian chờ
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {stage.waitingTime
                                                ? `${Math.round(
                                                      stage.waitingTime / 60000
                                                  )} phút`
                                                : 'Chưa xác định'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-xs mb-1">
                                            ⏱️ Tổng thời gian
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {stage.totalTime
                                                ? `${Math.round(
                                                      stage.totalTime / 3600000
                                                  )} giờ`
                                                : 'Đang xử lý'}
                                        </p>
                                    </div>
                                </div>

                                {/* 🆕 Stage 2 Confirm Button */}
                                {stage.stageNumber === 2 &&
                                    stage.status === 'in_transit' && (
                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-900">
                                                            🚚 Stage 2 đang vận
                                                            chuyển
                                                        </p>
                                                        <p className="text-xs text-amber-700 mt-1">
                                                            Khi dịch vụ vận
                                                            chuyển báo tới Hub
                                                            2, nhấn xác nhận để
                                                            kích hoạt Stage 3
                                                        </p>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={confirmNotes}
                                                    onChange={(e) =>
                                                        setConfirmNotes(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Ghi chú (tùy chọn): VD: Đã tới Hub 2 lúc 15h30..."
                                                    className="w-full px-3 py-2 border border-amber-300 rounded text-xs mb-2 focus:outline-none focus:border-amber-500 resize-none"
                                                    rows="2"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleConfirmStage2(
                                                            stage._id
                                                        )
                                                    }
                                                    disabled={
                                                        confirmingStage ===
                                                        stage._id
                                                    }
                                                    className={`w-full px-3 py-2 ${
                                                        confirmingStage ===
                                                        stage._id
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-amber-600 hover:bg-amber-700'
                                                    } text-white text-sm font-medium rounded transition flex items-center justify-center gap-2`}>
                                                    {confirmingStage ===
                                                    stage._id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            Đang xác nhận...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Xác nhận Stage 2
                                                            Hoàn Thành
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary footer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-gray-900">
                            {stages.every((s) => s.status === 'delivered')
                                ? '✅ Đơn hàng đã giao thành công'
                                : stages.some((s) => s.status === 'failed')
                                ? '⚠️ Giao hàng thất bại'
                                : `📦 Đang xử lý ${
                                      stages.filter(
                                          (s) => s.status !== 'delivered'
                                      ).length
                                  } giai đoạn`}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                            Cập nhật lần cuối:{' '}
                            {new Date().toLocaleTimeString('vi-VN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDeliveryManagement;
