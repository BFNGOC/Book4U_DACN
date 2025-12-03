import React, { useState, useEffect } from 'react';
import { getDeliveryInfo } from '../../services/api/deliveryApi.js';
import './OrderTracking.css';

const OrderTracking = ({ orderId, isCustomer = true }) => {
    const [order, setOrder] = useState(null);
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');

    // Status timeline configuration
    const statusTimeline = [
        { status: 'pending', label: 'Chờ xác nhận', icon: '⏳' },
        { status: 'confirmed', label: 'Đã xác nhận', icon: '✅' },
        { status: 'picking', label: 'Đang lấy hàng', icon: '📦' },
        { status: 'packed', label: 'Đã đóng gói', icon: '📮' },
        { status: 'in_transit', label: 'Đang vận chuyển', icon: '🚚' },
        {
            status: 'out_for_delivery',
            label: 'Shipper đang giao',
            icon: '🚴',
        },
        { status: 'completed', label: 'Đã giao', icon: '🎉' },
    ];

    useEffect(() => {
        fetchTrackingInfo();
        const interval = setInterval(fetchTrackingInfo, 10000); // Cập nhật mỗi 10s
        return () => clearInterval(interval);
    }, [orderId]);

    const fetchTrackingInfo = async () => {
        try {
            const response = await getDeliveryInfo(orderId);
            if (response.success) {
                setTrackingInfo(response.data);
                setError(null);
            } else {
                setError(response.message || 'Lỗi tải tracking info');
            }
        } catch (err) {
            setError('Lỗi tải tracking info');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnRequest = async () => {
        if (!returnReason.trim()) {
            alert('Vui lòng nhập lý do hoàn trả');
            return;
        }

        try {
            // Using requestReturn from orderApi instead
            const { requestReturn } = await import(
                '../../services/api/orderApi.js'
            );
            const response = await requestReturn(orderId, returnReason);
            if (response.success) {
                fetchTrackingInfo();
                setShowReturnModal(false);
                setReturnReason('');
                alert('Yêu cầu hoàn trả đã được gửi');
            } else {
                alert(response.message || 'Lỗi gửi yêu cầu hoàn trả');
            }
        } catch (err) {
            alert('Lỗi gửi yêu cầu hoàn trả');
            console.error(err);
        }
    };

    const getStatusIndex = (status) => {
        return statusTimeline.findIndex((s) => s.status === status);
    };

    const isStatusComplete = (status) => {
        const currentIndex = getStatusIndex(trackingInfo?.status);
        const targetIndex = getStatusIndex(status);
        return currentIndex >= targetIndex;
    };

    if (loading) return <div className="tracking-loading">Đang tải...</div>;
    if (error) return <div className="tracking-error">{error}</div>;
    if (!trackingInfo)
        return (
            <div className="tracking-empty">
                Không tìm thấy thông tin đơn hàng
            </div>
        );

    const currentStatusObj = statusTimeline.find(
        (s) => s.status === trackingInfo.status
    );

    return (
        <div className="order-tracking">
            <div className="tracking-header">
                <h2>Theo dõi đơn hàng</h2>
                {trackingInfo.trackingNumber && (
                    <p className="tracking-number">
                        Mã vận đơn:{' '}
                        <strong>{trackingInfo.trackingNumber}</strong>
                    </p>
                )}
                {trackingInfo.carrier && (
                    <p className="carrier-info">
                        Nhà vận chuyển:{' '}
                        <strong>{trackingInfo.carrier.name}</strong>
                    </p>
                )}
            </div>

            {/* Status Timeline */}
            <div className="status-timeline">
                {statusTimeline.map((step, idx) => (
                    <div
                        key={idx}
                        className={`timeline-step ${
                            isStatusComplete(step.status) ? 'completed' : ''
                        } ${
                            trackingInfo.status === step.status ? 'active' : ''
                        }`}>
                        <div className="step-icon">{step.icon}</div>
                        <div className="step-label">{step.label}</div>
                        {idx < statusTimeline.length - 1 && (
                            <div className="step-connector" />
                        )}
                    </div>
                ))}
            </div>

            {/* Current Location */}
            {trackingInfo.currentLocation &&
                trackingInfo.status !== 'completed' && (
                    <div className="current-location">
                        <h3>📍 Vị trí hiện tại</h3>
                        <p className="location-address">
                            {trackingInfo.currentLocation.address}
                        </p>
                        <p className="location-coords">
                            {trackingInfo.currentLocation.latitude},
                            {trackingInfo.currentLocation.longitude}
                        </p>
                        <p className="last-updated">
                            Cập nhật lúc:{' '}
                            {new Date(
                                trackingInfo.currentLocation.lastUpdated
                            ).toLocaleString('vi-VN')}
                        </p>
                    </div>
                )}

            {/* Delivery Attempts */}
            {trackingInfo.deliveryAttempts &&
                trackingInfo.deliveryAttempts.length > 0 && (
                    <div className="delivery-attempts">
                        <h3>📋 Lịch sử giao hàng</h3>
                        {trackingInfo.deliveryAttempts.map((attempt, idx) => (
                            <div
                                key={idx}
                                className={`attempt-card attempt-${attempt.status}`}>
                                <div className="attempt-header">
                                    <span className="attempt-number">
                                        Lần {attempt.attemptNumber}
                                    </span>
                                    <span
                                        className={`attempt-status ${attempt.status}`}>
                                        {attempt.status === 'success'
                                            ? '✅ Thành công'
                                            : '❌ Thất bại'}
                                    </span>
                                </div>
                                <p className="attempt-time">
                                    {new Date(attempt.timestamp).toLocaleString(
                                        'vi-VN'
                                    )}
                                </p>
                                {attempt.driverName && (
                                    <p className="driver-info">
                                        Shipper:{' '}
                                        <strong>{attempt.driverName}</strong>
                                    </p>
                                )}
                                {attempt.reason && (
                                    <p className="attempt-reason">
                                        Lý do: <em>{attempt.reason}</em>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

            {/* Order Details */}
            <div className="order-details">
                <h3>📦 Chi tiết đơn hàng</h3>
                <div className="customer-info">
                    <h4>Khách hàng</h4>
                    <p>{trackingInfo.customer.name}</p>
                    <p>{trackingInfo.customer.phone}</p>
                </div>

                <div className="items-list">
                    <h4>Sản phẩm</h4>
                    {trackingInfo.items.map((item, idx) => (
                        <div key={idx} className="item-card">
                            {item.bookId.images && (
                                <img
                                    src={item.bookId.images[0]}
                                    alt={item.bookId.title}
                                    className="item-image"
                                />
                            )}
                            <div className="item-info">
                                <p className="item-title">
                                    {item.bookId.title}
                                </p>
                                <p className="item-quantity">
                                    Số lượng: {item.quantity}
                                </p>
                                <p className="item-price">{item.price}₫</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes */}
            {trackingInfo.notes && trackingInfo.notes.length > 0 && (
                <div className="notes-section">
                    <h3>📝 Ghi chú</h3>
                    {trackingInfo.notes.map((note, idx) => (
                        <div key={idx} className="note-item">
                            <span className="note-time">
                                {new Date(note.timestamp).toLocaleString(
                                    'vi-VN'
                                )}
                            </span>
                            <span
                                className={`note-from note-from-${note.addedBy}`}>
                                {note.addedBy === 'carrier'
                                    ? '🚚'
                                    : note.addedBy === 'seller'
                                    ? '🏪'
                                    : '💬'}{' '}
                                {note.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                {trackingInfo.status === 'out_for_delivery' ||
                    (trackingInfo.status === 'in_transit' && (
                        <button
                            className="btn btn-return"
                            onClick={() => setShowReturnModal(true)}>
                            🔄 Yêu cầu hoàn trả
                        </button>
                    ))}
                {trackingInfo.status === 'completed' && (
                    <button className="btn btn-success">✅ Đã nhận hàng</button>
                )}
            </div>

            {/* Return Modal */}
            {showReturnModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Yêu cầu hoàn trả</h3>
                        <textarea
                            placeholder="Vui lòng nhập lý do hoàn trả..."
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            rows={5}
                        />
                        <div className="modal-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={handleReturnRequest}>
                                Gửi yêu cầu
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowReturnModal(false);
                                    setReturnReason('');
                                }}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracking;
