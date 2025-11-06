const Cart = require('../models/cartModel');
const Book = require('../models/bookModel');

// 🔹 Hàm dùng lại để populate giỏ hàng sau khi có dữ liệu
const populateCart = async (cart) => {
    if (!cart) return null;
    return await cart.populate([
        {
            path: 'items.bookId',
            select: 'title price images discount slug author',
        },
        {
            path: 'items.sellerId',
            select: 'firstName lastName',
        },
    ]);
};

// 🛒 Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId, quantity } = req.body;

        const book = await Book.findById(bookId).select('title price sellerId');
        if (!book) return res.status(404).json({ success: false, message: 'Không tìm thấy sách.' });

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = new Cart({ userId, items: [] });

        const existingItem = cart.items.find((item) => item.bookId.toString() === bookId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                bookId,
                quantity,
                price: book.price,
                sellerId: book.sellerId,
            });
        }

        await cart.save();
        const populatedCart = await populateCart(cart);

        res.status(200).json({
            success: true,
            data: populatedCart,
            message: 'Đã thêm vào giỏ hàng.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🧺 Lấy giỏ hàng người dùng
exports.getUserCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = await Cart.findOne({ userId });
        const populatedCart = await populateCart(cart);

        res.status(200).json({
            success: true,
            data: populatedCart || { items: [] },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 🔄 Cập nhật số lượng sản phẩm trong giỏ
exports.updateCartItemQuantity = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart)
            return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng.' });

        const item = cart.items.find((i) => i.bookId.toString() === bookId);
        if (!item)
            return res
                .status(404)
                .json({ success: false, message: 'Sản phẩm không có trong giỏ hàng.' });

        item.quantity = quantity;
        await cart.save();

        const populatedCart = await populateCart(cart);

        res.status(200).json({
            success: true,
            data: populatedCart,
            message: 'Đã cập nhật số lượng sản phẩm.',
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ❌ Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart)
            return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng.' });

        cart.items = cart.items.filter((item) => item.bookId.toString() !== bookId);
        await cart.save();

        const populatedCart = await populateCart(cart);

        res.status(200).json({
            success: true,
            data: populatedCart,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng.',
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
