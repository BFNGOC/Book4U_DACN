import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Clock,
    CheckCircle,
    TrendingUp,
    AlertCircle,
} from 'lucide-react';
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

/**
 * ============================================================
 * DELIVERY STAGE TRACKER COMPONENT
 * ============================================================
 * Hiển thị từng giai đoạn vận chuyển (liên tỉnh)
 * - Timeline với trạng thái
 * - Vị trí hiện tại
 * - Thông tin shipper + kho
 * 🆕 - Confirm button cho Stage 2 (seller)
 * 🆕 - Google Maps link clickable
 */

const DeliveryStageTracker = ({
    orderDetailId,
    showMap = true,
    userRole = 'customer',
}) => {
    const [stages, setStages] = useState([]);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmingStage, setConfirmingStage] = useState(null);
    const [confirmNotes, setConfirmNotes] = useState('');

    useEffect(() => {
        fetchDeliveryStages();
        // Polling every 30 seconds for realtime updates
        const interval = setInterval(fetchDeliveryStages, 30000);
        return () => clearInterval(interval);
    }, [orderDetailId]);

    const fetchDeliveryStages = async () => {
        try {
            setLoading(true);
            const response = await multiDeliveryApi.getDeliveryStages(
                orderDetailId
            );
            if (response.success) {
                setStages(response.data.stages || []);
                setCurrentStageIndex(response.data.currentStageIndex || 0);
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
        switch (status) {
            case 'pending':
                return 'bg-gray-200';
            case 'accepted':
                return 'bg-blue-200';
            case 'picked_up':
                return 'bg-blue-300';
            case 'in_transit':
            case 'in_transit_with_gps':
                return 'bg-yellow-300';
            case 'at_next_hub':
                return 'bg-cyan-300';
            case 'delivered':
                return 'bg-green-300';
            case 'failed':
                return 'bg-red-300';
            default:
                return 'bg-gray-200';
        }
    };

    const getStageStatusLabel = (status) => {
        const labels = {
            pending: 'Chờ nhận',
            accepted: 'Đã chấp nhận',
            picked_up: 'Đã lấy hàng',
            in_transit: 'Đang vận chuyển',
            in_transit_with_gps: 'Vận chuyển (GPS)',
            at_next_hub: 'Tới trung tâm',
            delivered: 'Đã giao',
            failed: 'Giao thất bại',
            cancelled: 'Đã hủy',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
            </div>
        );
    }

    if (stages.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                Chưa có thông tin vận chuyển
            </div>
        );
    }

    const currentStage = stages[currentStageIndex];

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
            {/* ===== TIMELINE ===== */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Lộ trình vận chuyển
                </h3>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                    {/* Stages */}
                    <div className="space-y-4 relative z-10">
                        {stages.map((stage, index) => (
                            <div key={stage._id} className="space-y-2">
                                <div
                                    className={`flex gap-4 pb-4 ${
                                        index !== stages.length - 1
                                            ? 'border-b border-gray-200'
                                            : ''
                                    }`}>
                                    {/* Timeline dot */}
                                    <div className="relative">
                                        <div
                                            className={`w-8 h-8 rounded-full ${getStageStatusColor(
                                                stage.status
                                            )} flex items-center justify-center`}>
                                            {stage.status === 'delivered' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <div
                                                    className={`w-3 h-3 rounded-full ${
                                                        index ===
                                                        currentStageIndex
                                                            ? 'bg-blue-600 animate-pulse'
                                                            : 'bg-gray-400'
                                                    }`}></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stage info */}
                                    <div className="flex-1 pt-1">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* From location */}
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                                    Từ
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stage.fromLocation
                                                        ?.warehouseName ||
                                                        stage.fromLocation
                                                            ?.locationType}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {
                                                        stage.fromLocation
                                                            ?.province
                                                    }
                                                </p>
                                            </div>

                                            {/* To location */}
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                                    Đến
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stage.toLocation
                                                        ?.warehouseName ||
                                                        'Khách hàng'}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {stage.toLocation?.province}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 🆕 Tracking Number for Stage 2 */}
                                        {stage.stageNumber === 2 &&
                                            stage.trackingNumber && (
                                                <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                                                    <p className="text-xs text-gray-600 font-semibold">
                                                        📦 Mã Vận Đơn:
                                                    </p>
                                                    <p className="text-sm font-bold text-blue-700 break-all">
                                                        {stage.trackingNumber}
                                                    </p>
                                                    {stage.shippingCompany && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Dịch vụ:{' '}
                                                            <span className="font-medium">
                                                                {
                                                                    stage.shippingCompany
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {/* 🆕 Shipper Info for Stage 1 & 3 */}
                                        {(stage.stageNumber === 1 ||
                                            stage.stageNumber === 3) &&
                                            stage.assignedShipperId && (
                                                <div className="mt-2 bg-green-50 p-2 rounded border border-green-200">
                                                    <p className="text-sm text-gray-600 font-semibold">
                                                        👤 Người giao hàng:{' '}
                                                        {stage.assignedShipperId
                                                            .lastName || ''}
                                                        {' ' +
                                                            stage
                                                                .assignedShipperId
                                                                .firstName ||
                                                            'N/A'}{' '}
                                                    </p>
                                                    {stage.assignedShipperId
                                                        .primaryPhone && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            📞{' '}
                                                            {
                                                                stage
                                                                    .assignedShipperId
                                                                    .primaryPhone
                                                            }
                                                        </p>
                                                    )}
                                                    {stage.assignedShipperId
                                                        .performance && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            ⭐ Đánh giá:{' '}
                                                            <span className="font-medium">
                                                                {(
                                                                    stage
                                                                        .assignedShipperId
                                                                        .performance
                                                                        .averageRating ||
                                                                    5
                                                                ).toFixed(1)}
                                                            </span>
                                                            {' / 5.0'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {/* Status */}
                                        <div className="mt-2">
                                            <span
                                                className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStageStatusColor(
                                                    stage.status
                                                )} text-gray-900`}>
                                                {getStageStatusLabel(
                                                    stage.status
                                                )}
                                            </span>
                                        </div>

                                        {/* Timeline dates */}
                                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                                            {stage.pickedUpAt && (
                                                <p>
                                                    📦 Lấy hàng:{' '}
                                                    {new Date(
                                                        stage.pickedUpAt
                                                    ).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                            {stage.inTransitAt && (
                                                <p>
                                                    🚚 Vận chuyển:{' '}
                                                    {new Date(
                                                        stage.inTransitAt
                                                    ).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                            {stage.deliveredAt && (
                                                <p>
                                                    ✅ Giao hàng:{' '}
                                                    {new Date(
                                                        stage.deliveredAt
                                                    ).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 🆕 Stage 2 Confirm Button (Seller Only) */}
                                {stage.stageNumber === 2 &&
                                    stage.status === 'in_transit' &&
                                    userRole === 'seller' &&
                                    confirmingStage !== stage._id && (
                                        <div className="ml-12 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2 mb-3">
                                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-900">
                                                        Stage 2 đang vận chuyển
                                                    </p>
                                                    <p className="text-xs text-amber-700 mt-1">
                                                        Khi dịch vụ vận chuyển
                                                        báo tới Hub, nhấn xác
                                                        nhận
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
                                                placeholder="Ghi chú (tùy chọn)..."
                                                className="w-full px-3 py-2 border border-amber-300 rounded text-xs mb-2 focus:outline-none focus:border-amber-500"
                                                rows="2"
                                            />
                                            <button
                                                onClick={() =>
                                                    handleConfirmStage2(
                                                        stage._id
                                                    )
                                                }
                                                className="w-full px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 transition">
                                                ✓ Xác nhận Stage 2 Hoàn Thành
                                            </button>
                                        </div>
                                    )}

                                {/* Confirming State */}
                                {confirmingStage === stage._id && (
                                    <div className="ml-12 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            <p className="text-sm text-blue-700 font-medium">
                                                Đang xác nhận...
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== CURRENT STAGE DETAILS ===== */}
            {currentStage && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Giai đoạn hiện tại (Giai đoạn {currentStageIndex + 1}/
                        {stages.length})
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Current location */}
                        {currentStage.currentLocation && (
                            <div>
                                <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                                    Vị trí hiện tại
                                </p>
                                <p className="text-sm font-medium text-gray-900 flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <span>
                                        {currentStage.currentLocation.address ||
                                            `${currentStage.currentLocation.latitude?.toFixed(
                                                4
                                            )}, ${currentStage.currentLocation.longitude?.toFixed(
                                                4
                                            )}`}
                                    </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Cập nhật:{' '}
                                    {new Date(
                                        currentStage.currentLocation.timestamp
                                    ).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        )}

                        {/* Estimated delivery */}
                        {currentStage.estimatedDeliveryDate && (
                            <div>
                                <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                                    Dự kiến giao
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(
                                        currentStage.estimatedDeliveryDate
                                    ).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Location history */}
                    {currentStage.locationHistory &&
                        currentStage.locationHistory.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <p className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                    Lịch sử vị trí
                                </p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {currentStage.locationHistory
                                        .slice()
                                        .reverse()
                                        .map((loc, idx) => (
                                            <div
                                                key={idx}
                                                className="text-xs text-gray-600">
                                                <span className="font-medium">
                                                    {loc.description ||
                                                        loc.address ||
                                                        'Không rõ'}
                                                </span>
                                                <br />
                                                <span className="text-gray-500">
                                                    {new Date(
                                                        loc.timestamp
                                                    ).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                </div>
            )}

            {/* ===== MAP INTEGRATION ===== */}
            {showMap && (
                <div className="rounded-lg overflow-hidden border border-gray-300">
                    {currentStage?.currentLocation ? (
                        // GPS Location available
                        <a
                            href={`https://www.google.com/maps/search/${currentStage.currentLocation.latitude},${currentStage.currentLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-gradient-to-br from-gray-100 to-gray-200 h-64 flex items-center justify-center hover:from-gray-200 hover:to-gray-300 transition">
                            <div className="text-center text-gray-700">
                                <MapPin className="w-8 h-8 mx-auto mb-2 text-red-600" />
                                <p className="text-sm font-bold">
                                    📍 Xem trên Google Maps
                                </p>
                                <p className="text-xs text-gray-600 mt-2">
                                    {currentStage.currentLocation.latitude?.toFixed(
                                        4
                                    )}
                                    ,{' '}
                                    {currentStage.currentLocation.longitude?.toFixed(
                                        4
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    ✓ Nhấn để xem bản đồ chi tiết
                                </p>
                            </div>
                        </a>
                    ) : (
                        // No GPS but show stage address on maps
                        <a
                            href={`https://www.google.com/maps/search/${
                                currentStage?.toLocation?.province ||
                                currentStage?.fromLocation?.province ||
                                'Việt Nam'
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-gradient-to-br from-blue-100 to-cyan-100 h-64 flex items-center justify-center hover:from-blue-200 hover:to-cyan-200 transition">
                            <div className="text-center text-blue-700">
                                <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-bold">
                                    📍 Xem khu vực giao hàng
                                </p>
                                <p className="text-xs text-blue-600 mt-2 max-w-xs">
                                    {currentStage?.toLocation?.province ||
                                        currentStage?.fromLocation?.province ||
                                        'Vị trí vận chuyển'}
                                </p>
                                <p className="text-xs text-blue-500 mt-2">
                                    Chờ cập nhật GPS...
                                </p>
                                <p className="text-xs text-blue-500 mt-1">
                                    ✓ Nhấn để xem bản đồ
                                </p>
                            </div>
                        </a>
                    )}
                </div>
            )}

            {/* ===== REFRESH BUTTON ===== */}
            <button
                onClick={fetchDeliveryStages}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                Cập nhật thông tin
            </button>
        </div>
    );
};

export default DeliveryStageTracker;
