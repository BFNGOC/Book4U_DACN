const stockService = require('../services/stockManagementService');

/**
 * STOCK VALIDATION MIDDLEWARE
 * ============================
 *
 * Middleware để validate stock trước khi:
 * - Tạo sách mới (stock phải > 0)
 * - Cập nhật sách (validate stock)
 */

// 1️⃣ MIDDLEWARE: Kiểm tra stock trước khi seller tạo/cập nhật sách
/**
 * Kiểm tra Book.stock > 0 mới được phép đăng bán
 * Nếu stock = 0 → Yêu cầu nhập kho trước
 */
exports.validateStockBeforePublish = async (req, res, next) => {
    try {
        const { stock } = req.body;

        // Nếu không có stock field → skip
        if (stock === undefined) {
            return next();
        }

        // Nếu stock <= 0 → Block
        if (!stock || stock <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Không thể đăng bán sản phẩm với stock = 0 hoặc âm. Vui lòng nhập kho trước khi đăng bán.',
                requiresStockImport: true,
            });
        }

        // OK - tiếp tục
        next();
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2️⃣ MIDDLEWARE: Kiểm tra sách có stock không
/**
 * Dùng khi cập nhật sách
 * Nếu đặt stock = 0 → Block
 */
exports.preventStockDecrease = async (req, res, next) => {
    try {
        const { bookId } = req.params || req.body;
        const { stock } = req.body;

        if (stock === undefined || stock === null) {
            return next();
        }

        if (stock === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Không thể set stock = 0 cho sản phẩm. Vui lòng xuất kho hoặc hủy đăng bán.',
            });
        }

        next();
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3️⃣ MIDDLEWARE: Kiểm tra stock trước tạo đơn
/**
 * Dùng trong order creation
 * Validate stock có đủ không
 */
exports.checkOrderStock = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Items không hợp lệ',
            });
        }

        // Check từng item
        for (const item of items) {
            const { bookId, quantity } = item;
            const result = await stockService.checkStockAvailability(
                bookId,
                quantity
            );

            if (!result.available) {
                return res.status(400).json({
                    success: false,
                    message: result.reason,
                    bookId,
                });
            }
        }

        // Tất cả items có stock đủ → tiếp tục
        next();
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
