const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const roleRequestController = require('../controllers/roleRequestController');

router.post('/', authMiddleware, roleRequestController.createRoleRequest);
router.get('/me', authMiddleware, roleRequestController.getMyRequests);

router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin'),
    roleRequestController.getAllRequests
);
router.patch(
    '/:id/approve',
    authMiddleware,
    roleMiddleware('admin'),
    roleRequestController.approveRequest
);
router.patch(
    '/:id/reject',
    authMiddleware,
    roleMiddleware('admin'),
    roleRequestController.rejectRequest
);

module.exports = router;
