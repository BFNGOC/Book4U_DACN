/**
 * Notification API Service
 * Xử lý tất cả API calls liên quan đến notifications
 */

import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const NOTIFICATION_API_URL = 'api/notifications';

/**
 * Lấy danh sách notifications của seller
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số lượng per page
 * @param {boolean} unreadOnly - Chỉ lấy chưa đọc
 * @returns {Promise}
 */
export const getNotifications = (page = 1, limit = 50, unreadOnly = false) =>
    fetchHandler(
        axiosPrivate,
        NOTIFICATION_API_URL,
        { page, limit, unreadOnly },
        'Lỗi khi lấy danh sách thông báo.'
    );

/**
 * Mark notification as read
 * @param {string} notificationId - ID của notification
 * @returns {Promise}
 */
export const markNotificationAsRead = (notificationId) =>
    fetchHandler(
        axiosPrivate,
        `${NOTIFICATION_API_URL}/${notificationId}/read`,
        {},
        'Lỗi khi đánh dấu thông báo là đã đọc.',
        'PUT'
    );

/**
 * Delete notification
 * @param {string} notificationId - ID của notification
 * @returns {Promise}
 */
export const deleteNotification = (notificationId) =>
    fetchHandler(
        axiosPrivate,
        `${NOTIFICATION_API_URL}/${notificationId}`,
        {},
        'Lỗi khi xóa thông báo.',
        'DELETE'
    );

/**
 * Mark all notifications as read
 * @returns {Promise}
 */
export const markAllNotificationsAsRead = () =>
    fetchHandler(
        axiosPrivate,
        `${NOTIFICATION_API_URL}/read-all`,
        {},
        'Lỗi khi đánh dấu tất cả thông báo là đã đọc.',
        'PUT'
    );
