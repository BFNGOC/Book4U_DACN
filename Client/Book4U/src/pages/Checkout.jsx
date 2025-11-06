import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL from '../configs/api.js';

function Checkout() {
    const [checkoutItems, setCheckoutItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('checkoutItems');
        if (stored) {
            setCheckoutItems(JSON.parse(stored));
        } else {
            toast.error('Không có sản phẩm nào để thanh toán');
            navigate('/cart');
        }
    }, []);

    const total = checkoutItems.reduce((sum, item) => {
        const book = item.bookId;
        const price = book.discount ? book.price * (1 - book.discount / 100) : book.price;
        return sum + price * item.quantity;
    }, 0);

    const handlePlaceOrder = () => {
        // ✅ Sau này sẽ gửi API ở đây
        toast.success('Đặt hàng thành công!');
        localStorage.removeItem('checkoutItems');
        navigate('/orders');
    };

    if (!checkoutItems.length) return null;

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow mt-8">
            <h2 className="text-2xl font-semibold mb-6">Xác nhận đơn hàng</h2>

            <div className="space-y-4">
                {checkoutItems.map((item) => {
                    const book = item.bookId;
                    const price = book.discount
                        ? book.price * (1 - book.discount / 100)
                        : book.price;

                    return (
                        <div
                            key={book._id}
                            className="flex justify-between items-center border-b pb-3"
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={`${API_URL}${book.images[0]}`}
                                    alt={book.title}
                                    className="w-20 h-24 object-cover rounded-md"
                                />
                                <div>
                                    <p className="font-semibold">{book.title}</p>
                                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-semibold text-blue-600">
                                {(price * item.quantity).toLocaleString()}₫
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center mt-6">
                <p className="text-lg font-semibold">
                    Tổng cộng:{' '}
                    <span className="text-red-500 text-xl">{total.toLocaleString()}₫</span>
                </p>
                <button
                    onClick={handlePlaceOrder}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                    Đặt hàng
                </button>
            </div>
        </div>
    );
}

export default Checkout;
