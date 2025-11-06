import { useContext } from 'react';
import useRequireAuth from '../../../hooks/useRequireAuth';
import { CartContext } from '../../../contexts/CartContext.jsx';

function AddToCartButton({ bookId, quantity = 1 }) {
    const { requireLogin } = useRequireAuth();
    const { addToCartContext } = useContext(CartContext);

    const handleAddToCart = () => {
        requireLogin(async () => {
            await addToCartContext(bookId, quantity);
        });
    };
    return (
        <button
            onClick={handleAddToCart}
            className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 w-full h-full cursor-pointer transition"
        >
            Thêm vào giỏ
        </button>
    );
}

export default AddToCartButton;
