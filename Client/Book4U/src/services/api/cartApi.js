import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const CART_API_URL = 'api/cart';

export const addToCart = (bookId, quantity) =>
    fetchHandler(
        axiosPrivate,
        `${CART_API_URL}/add`,
        { bookId, quantity },
        'Lỗi khi thêm sách vào giỏ hàng.',
        'POST'
    );

export const getUserCart = () =>
    fetchHandler(
        axiosPrivate,
        CART_API_URL,
        {},
        'Lỗi khi lấy giỏ hàng của người dùng.'
    );

export const updateCartItemQuantity = (bookId, quantity) =>
    fetchHandler(
        axiosPrivate,
        `${CART_API_URL}/update/${bookId}`,
        { quantity },
        'Lỗi khi cập nhật số lượng sách trong giỏ hàng.',
        'PUT'
    );

export const removeFromCart = (bookId) =>
    fetchHandler(
        axiosPrivate,
        `${CART_API_URL}/remove/${bookId}`,
        {},
        'Lỗi khi xóa sách khỏi giỏ hàng.',
        'DELETE'
    );

/**
 * ✅ Xóa multiple sản phẩm khỏi giỏ hàng
 * Dùng khi order thành công để xóa tất cả sản phẩm đã đặt
 * POST /api/cart/remove-multiple
 * Body: { bookIds: ['id1', 'id2', 'id3'] }
 */
export const removeMultipleFromCart = (bookIds) =>
    fetchHandler(
        axiosPrivate,
        `${CART_API_URL}/remove-multiple`,
        { bookIds },
        'Lỗi khi xóa sản phẩm khỏi giỏ hàng.',
        'POST'
    );
