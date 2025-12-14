const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// All notification routes (seller only)

// [GET] /api/notifications - Lấy danh sách notifications
router.get(
    '/',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.getNotifications
);

// [PUT] /api/notifications/:notificationId/read - Mark notification as read
router.put(
    '/:notificationId/read',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.markNotificationAsRead
);

// [DELETE] /api/notifications/:notificationId - Delete notification
router.delete(
    '/:notificationId',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.deleteNotification
);

// [PUT] /api/notifications/read-all - Mark all notifications as read
router.put(
    '/read-all',
    authMiddleware,
    roleMiddleware('seller'),
    sellerController.markAllNotificationsAsRead
);

module.exports = router;
