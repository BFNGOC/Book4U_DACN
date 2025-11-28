const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

/**
 * WAREHOUSE ROUTES
 * ================
 *
 * Endpoints:
 * POST   /warehouses          - Tạo kho
 * GET    /warehouses          - Lấy danh sách kho
 * POST   /import-stock        - Nhập kho
 * POST   /export-stock        - Xuất kho
 * GET    /logs                - Lịch sử
 * GET    /product/:bookId/stock - Tồn kho sản phẩm
 */

// 1️⃣ Tạo kho
router.post(
    '/warehouses',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.createWarehouse
);

// 2️⃣ Lấy danh sách kho
router.get(
    '/warehouses',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.getWarehousesBySellergetWarehousesBySeller
);

// 3️⃣ Nhập kho
router.post(
    '/import-stock',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.importStock
);

// 4️⃣ Xuất kho
router.post(
    '/export-stock',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.exportStock
);

// 5️⃣ Lấy lịch sử
router.get(
    '/logs',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.getWarehouseLogs
);

// 6️⃣ Lấy tồn kho sản phẩm
router.get(
    '/product/:bookId/stock',
    roleMiddleware('seller'),
    authMiddleware,
    warehouseController.getProductTotalStock
);

module.exports = router;
