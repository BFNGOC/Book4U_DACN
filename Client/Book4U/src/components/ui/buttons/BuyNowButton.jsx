import { useNavigate } from 'react-router-dom';

function BuyNowButton({ product }) {
    const navigate = useNavigate();

    const handleBuyNow = () => {
        // ✅ Sau này bạn có thể thay bằng API "tạo đơn hàng nhanh"
        // Hiện tại chỉ chuyển hướng sang trang thanh toán với thông tin sách
        // navigate(`/checkout?bookId=${product._id}`);
        console.log('🚀 Mua ngay:', product);
    };

    return (
        <button
            onClick={handleBuyNow}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full h-full cursor-pointer transition"
        >
            Mua ngay
        </button>
    );
}

export default BuyNowButton;
