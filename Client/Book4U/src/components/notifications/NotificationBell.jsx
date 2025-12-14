/**
 * Notification Bell Component
 * Hiển thị icon chuông với badge unread count
 */

import { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';

function NotificationBell() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        removeNotification,
        markAllAsRead,
    } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
            // Notification remains visible but loses highlight
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_ORDER':
                return '📦';
            case 'ORDER_UPDATE':
                return '🔄';
            case 'ORDER_CANCELLED':
                return '❌';
            default:
                return '📬';
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b">
                        <h3 className="font-semibold text-gray-900">
                            Thông báo
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p className="text-sm">Chưa có thông báo</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                                        notification.read
                                            ? 'bg-white'
                                            : 'bg-blue-50'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="text-xl mt-0.5">
                                            {getNotificationIcon(
                                                notification.type
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-gray-900">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            {/* Order Details */}
                                            {notification.data?.orderId && (
                                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                                    <p>
                                                        <span className="font-medium">
                                                            Đơn hàng:
                                                        </span>{' '}
                                                        #
                                                        {notification.data.orderId
                                                            ?.toString()
                                                            .slice(-8)}
                                                    </p>
                                                    {notification.data
                                                        ?.customerName && (
                                                        <p>
                                                            <span className="font-medium">
                                                                Khách hàng:
                                                            </span>{' '}
                                                            {
                                                                notification
                                                                    .data
                                                                    .customerName
                                                            }
                                                        </p>
                                                    )}
                                                    {notification.data
                                                        ?.subtotal && (
                                                        <p>
                                                            <span className="font-medium">
                                                                Tiền hàng của
                                                                bạn:
                                                            </span>{' '}
                                                            {notification.data.subtotal.toLocaleString()}{' '}
                                                            ₫
                                                        </p>
                                                    )}
                                                    {notification.data
                                                        ?.totalOrderAmount && (
                                                        <p>
                                                            <span className="font-medium text-xs">
                                                                (Tổng toàn đơn:{' '}
                                                            </span>
                                                            {notification.data.totalOrderAmount.toLocaleString()}{' '}
                                                            ₫)
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Timestamp */}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(
                                                    notification.createdAt
                                                ).toLocaleTimeString('vi-VN')}
                                            </p>
                                        </div>

                                        {/* Close Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(
                                                    notification.id
                                                );
                                            }}
                                            className="text-gray-400 hover:text-gray-600">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="sticky bottom-0 p-3 border-t bg-gray-50 text-center">
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                Xem tất cả thông báo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
