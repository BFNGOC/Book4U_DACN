/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import {
    getUserCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
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
            const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(total);
        } else {
            setCartCount(0);
        }
    }, [cart]);

    const addToCartContext = async (bookId, quantity) => {
        try {
            await addToCart(bookId, quantity);
            await fetchCart();
            toast.success('🛍️ Sản phẩm đã được thêm vào giỏ');
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
            } else toast.error('Cập nhật số lượng thất bại');
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
            } else toast.error('Xóa sản phẩm thất bại');
        } catch (err) {
            console.error('Lỗi xóa giỏ hàng:', err);
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
                loading,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
