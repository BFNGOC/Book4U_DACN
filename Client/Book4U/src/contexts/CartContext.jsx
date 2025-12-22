/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import {
    getUserCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    removeMultipleFromCart,
} from '../services/api/cartApi.js';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [] });
    const [loading, setLoading] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const res = await getUserCart();
            setCart(res.data);
        } catch (err) {
            console.error('Lỗi lấy giỏ hàng:', err);
            toast.error('Không thể tải giỏ hàng 😢');
        } finally {
            setLoading(false);
        }
    };

    // Load cart khi đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetchCart();
    }, []);

    useEffect(() => {
        if (cart?.items?.length > 0) {
            const total = cart.items.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            setCartCount(total);
        } else {
            setCartCount(0);
        }
    }, [cart]);

    const addToCartContext = async (bookId, quantity) => {
        try {
            const res = await addToCart(bookId, quantity);
            if (res.success) {
                setCart(res.data);
                toast.success('🛒 Thêm vào giỏ hàng thành công');
            } else toast.error(res.message || 'Thêm vào giỏ hàng thất bại');
        } catch (err) {
            console.error('Lỗi thêm giỏ hàng:', err);
        }
    };

    const updateCartItemQuantityContext = async (bookId, quantity) => {
        try {
            const res = await updateCartItemQuantity(bookId, quantity);

            if (res.success) {
                setCart(res.data);
                toast.success('🔄 Cập nhật số lượng thành công');
            } else toast.error(res.message || 'Cập nhật số lượng thất bại');
        } catch (err) {
            console.error('Lỗi cập nhật giỏ hàng:', err);
        }
    };

    const removeFromCartContext = async (bookId) => {
        try {
            const res = await removeFromCart(bookId);

            if (res.success) {
                setCart(res.data);
                toast.success('🗑️ Đã xóa sản phẩm khỏi giỏ hàng');
            } else toast.error(res.message || 'Xóa sản phẩm thất bại');
        } catch (err) {
            console.error('Lỗi xóa giỏ hàng:', err);
        }
    };

    // ✅ Xóa multiple sản phẩm cùng lúc (dùng khi đặt hàng thành công)
    const removeMultipleFromCartContext = async (bookIds) => {
        try {
            if (!bookIds || bookIds.length === 0) {
                console.warn('Không có sản phẩm để xóa');
                return;
            }

            const res = await removeMultipleFromCart(bookIds);

            if (res.success) {
                setCart(res.data);
                console.log(`✅ Xóa ${bookIds.length} sản phẩm khỏi giỏ hàng`);
            } else {
                console.error('Lỗi xóa multiple sản phẩm:', res.message);
            }
        } catch (err) {
            console.error('Lỗi xóa multiple sản phẩm từ giỏ hàng:', err);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                setCart,
                addToCartContext,
                removeFromCartContext,
                updateCartItemQuantityContext,
                removeMultipleFromCartContext,
                loading,
                cartCount,
            }}>
            {children}
        </CartContext.Provider>
    );
};
