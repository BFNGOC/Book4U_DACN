import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function CheckoutButton({ items }) {
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (!items?.length) {
            toast.error('Vui lòng chọn sản phẩm để mua');
            return;
        }

        // ✅ Lưu dữ liệu sang localStorage
        localStorage.setItem('checkoutItems', JSON.stringify(items));

        // ✅ Chuyển sang trang xác nhận
        navigate('/checkout');
    };

    return (
        <button
            onClick={handleCheckout}
            className={`px-6 py-2 rounded-lg text-white font-semibold transition cursor-pointer ${
                items.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={items.length === 0}
        >
            Mua hàng
        </button>
    );
}

export default CheckoutButton;
