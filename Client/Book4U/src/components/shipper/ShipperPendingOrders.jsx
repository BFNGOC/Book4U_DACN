import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { acceptDeliveryStage } from '../../services/api/multiDeliveryApi';

export default function ShipperPendingOrders({
    pendingOrders = [],
    onOrderAccepted,
}) {
    const [accepting, setAccepting] = useState(null);
    const [expandedStageId, setExpandedStageId] = useState(null);

    const handleAcceptOrder = async (stageId) => {
        try {
            setAccepting(stageId);
            const response = await acceptDeliveryStage(stageId);

            if (response.success) {
                toast.success('✅ Nhận đơn hàng thành công!');
                onOrderAccepted();
            } else {
                toast.error(response.message || 'Lỗi nhận đơn hàng');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
            console.error(error);
        } finally {
            setAccepting(null);
        }
    };

    const getStageLabel = (stageNumber, totalStages) => {
        if (totalStages === 1) return '📦 Pickup & Delivery';
        if (stageNumber === 1) return '📦 Stage 1: Pickup từ Kho';
        if (stageNumber === 2) return '🚚 Stage 2: Chuyển Hub Liên Tỉnh';
        return '📍 Stage 3: Giao cho Khách';
    };

    if (pendingOrders.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 text-lg">
                    ✨ Không có đơn hàng chờ nhận
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                    🎯 Đơn Hàng Chờ Nhận
                </h3>
                <p className="text-gray-600 text-sm">
                    Bạn có {pendingOrders.length} đơn hàng trong khu vực của
                    mình
                </p>
            </div>

            <div className="space-y-3">
                {pendingOrders.map((stage) => {
                    const orderDetail = stage.orderDetailId;
                    const mainOrder = orderDetail?.mainOrderId;
                    const customer = mainOrder?.profileId;

                    return (
                        <div
                            key={stage._id}
                            className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500 hover:shadow-lg transition">
                            {/* Header */}
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 transition"
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
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                {getStageLabel(
                                                    stage.stageNumber,
                                                    stage.totalStages
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Stage {stage.stageNumber} /{' '}
                                                {stage.totalStages}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            {/* From */}
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold">
                                                    📦 Lấy từ
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stage.fromLocation
                                                        .address ||
                                                        stage.fromLocation
                                                            ?.warehouseName ||
                                                        'Transfer Hub'}
                                                </p>
                                            </div>

                                            {/* To */}
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold">
                                                    📍 Giao tới
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stage.toLocation.address ||
                                                        stage.toLocation
                                                            ?.warehouseName ||
                                                        customer?.firstName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right ml-4">
                                        <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            ⏳ Chờ Nhận
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedStageId === stage._id && (
                                <div className="border-t bg-gray-50 p-4 space-y-4">
                                    {/* Order Info */}
                                    <div className="bg-white rounded p-3 border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                            📋 Thông Tin Đơn Hàng
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    ID Đơn:
                                                </span>
                                                <span className="font-mono text-gray-900">
                                                    {orderDetail?._id.slice(-8)}
                                                </span>
                                            </div>
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
                                    <div className="bg-white rounded p-3 border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                            📍 Địa Chỉ Giao Hàng
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            <p className="font-medium text-gray-900">
                                                {
                                                    orderDetail?.shippingAddress
                                                        ?.fullName
                                                }
                                            </p>
                                            <p className="text-gray-600">
                                                📞{' '}
                                                {
                                                    orderDetail?.shippingAddress
                                                        ?.phone
                                                }
                                            </p>
                                            <p className="text-gray-600">
                                                {
                                                    orderDetail?.shippingAddress
                                                        ?.address
                                                }
                                            </p>
                                        </div>
                                    </div>

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
                                                                className="flex justify-between text-sm">
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

                                    {/* Action Button */}
                                    <button
                                        onClick={() =>
                                            handleAcceptOrder(stage._id)
                                        }
                                        disabled={accepting === stage._id}
                                        className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                                            accepting === stage._id
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}>
                                        {accepting === stage._id
                                            ? '⏳ Đang xử lý...'
                                            : '✅ Nhận Đơn Hàng'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
