/**
 * Notification Context
 * Quản lý thông báo realtime cho toàn ứng dụng
 */

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from 'react';
import socketService from '../services/socketService';
import * as notificationApi from '../services/api/notificationApi';
import useSellerSocket from '../hooks/useSellerSocket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Auto connect socket for sellers
    useSellerSocket();

    // Fetch notifications từ database
    const loadNotificationsFromDB = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await notificationApi.getNotifications(1, 50);

            if (response.success && response.data.notifications) {
                // Convert DB notifications to UI format
                const dbNotifications = response.data.notifications.map(
                    (notif) => ({
                        ...notif,
                        id: notif._id,
                        read: notif.isRead,
                        createdAt: notif.createdAt,
                    })
                );
                setNotifications(dbNotifications);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error loading notifications from DB:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Thêm thông báo
    const addNotification = useCallback((notification) => {
        const id = `${Date.now()}-${Math.random()}`;
        const newNotification = {
            ...notification,
            id,
            read: false,
            createdAt: new Date(),
        };

        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Auto remove sau 5 giây (chỉ từ UI, vẫn lưu trong list)
        setTimeout(() => {
            // Có thể để notification lại trong list để user xem lại
        }, 5000);

        return id;
    }, []);

    // Đánh dấu đã đọc
    const markAsRead = useCallback(async (notificationId) => {
        // Update UI immediately
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Call API to save to database
        try {
            await notificationApi.markNotificationAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        // Update UI immediately
        setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, read: true }))
        );
        setUnreadCount(0);

        // Call API to save to database
        try {
            await notificationApi.markAllNotificationsAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    // Xóa thông báo
    const removeNotification = useCallback(async (notificationId) => {
        // Update UI immediately
        setNotifications((prev) =>
            prev.filter((notif) => notif.id !== notificationId)
        );

        // Call API to delete from database
        try {
            await notificationApi.deleteNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, []);

    // Xóa tất cả
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Lắng nghe thông báo từ socket
    // ⚠️ MUST setup listener BEFORE useSellerSocket joins room
    useEffect(() => {
        const handleNotification = (notification) => {
            addNotification(notification);

            // Sound notification (optional)
            playNotificationSound();
        };

        socketService.onNotification(handleNotification);

        return () => {
            socketService.offNotification();
        };
    }, [addNotification]);

    // Load notifications từ database khi mount
    useEffect(() => {
        loadNotificationsFromDB();
    }, [loadNotificationsFromDB]);

    // Play sound khi có thông báo
    const playNotificationSound = () => {
        try {
            const audio = new Audio(
                'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj=='
            );
            audio.play().catch((e) => console.log('Audio play failed:', e));
        } catch (e) {
            // Nếu không support audio thì skip
        }
    };

    const value = {
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        loadNotificationsFromDB,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook để sử dụng notification
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            'useNotification must be used within NotificationProvider'
        );
    }
    return context;
};

export default NotificationContext;
