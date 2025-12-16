import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

/**
 * ============================================================
 * DELIVERY STAGE TRACKER COMPONENT
 * ============================================================
 * Hiển thị từng giai đoạn vận chuyển (liên tỉnh)
 * - Timeline với trạng thái
 * - Vị trí hiện tại
 * - Thông tin shipper + kho
 */

const DeliveryStageTracker = ({ orderDetailId, showMap = true }) => {
    const [stages, setStages] = useState([]);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                            <div
                                key={stage._id}
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
                                                    index === currentStageIndex
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
                                                {stage.fromLocation?.province}
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

                                    {/* Status */}
                                    <div className="mt-2">
                                        <span
                                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStageStatusColor(
                                                stage.status
                                            )} text-gray-900`}>
                                            {getStageStatusLabel(stage.status)}
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
            {showMap && currentStage?.currentLocation && (
                <div className="rounded-lg overflow-hidden border border-gray-300">
                    <div className="bg-gray-100 h-64 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <MapPin className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">
                                Google Maps Integration
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Vị trí: {currentStage.currentLocation.latitude},
                                {currentStage.currentLocation.longitude}
                            </p>
                        </div>
                    </div>
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
