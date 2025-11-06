import { useContext, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import { CartContext } from '../contexts/CartContext.jsx';
import API_URL from '../configs/api.js';
import Loading from '../components/common/Loading.jsx';
import CheckoutButton from '../components/ui/buttons/CheckoutButton.jsx';
import ConfirmModal from '../components/ui/modals/ConfirmModal.jsx';

function Cart() {
    const { cart, removeFromCartContext, updateCartItemQuantityContext, loading } =
        useContext(CartContext);
    const [selectedItems, setSelectedItems] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ open: false, bookIds: [] }); // ✅ hỗ trợ xóa nhiều

    // ✅ Toggle chọn sản phẩm
    const toggleSelect = (bookId) =>
        setSelectedItems((prev) =>
            prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
        );

    // ✅ Chọn / bỏ chọn tất cả
    const toggleSelectAll = (checked) =>
        setSelectedItems(checked ? cart.items.map((i) => i.bookId._id) : []);

    // ✅ Mở modal xác nhận xóa (1 hoặc nhiều)
    const confirmRemove = (bookIds) => {
        const ids = Array.isArray(bookIds) ? bookIds : [bookIds];
        setConfirmModal({ open: true, bookIds: ids });
    };

    // ✅ Thực hiện xóa khi người dùng xác nhận
    const handleRemoveConfirmed = async () => {
        const { bookIds } = confirmModal;
        for (const id of bookIds) {
            await removeFromCartContext(id);
        }
        setSelectedItems((prev) => prev.filter((id) => !bookIds.includes(id)));
        setConfirmModal({ open: false, bookIds: [] });
    };

    // ✅ Hủy modal
    const handleCancelRemove = () => setConfirmModal({ open: false, bookIds: [] });

    // ✅ Cập nhật số lượng
    const handleQuantityChange = async (bookId, newQty) => {
        if (newQty < 0) return;
        if (newQty === 0) confirmRemove(bookId);
        else await updateCartItemQuantityContext(bookId, newQty);
    };

    // ✅ Tổng tiền
    const totalPrice = useMemo(() => {
        return cart.items
            .filter((item) => selectedItems.includes(item.bookId._id))
            .reduce((sum, item) => {
                const book = item.bookId;
                const price = book.discount ? book.price * (1 - book.discount / 100) : book.price;
                return sum + price * item.quantity;
            }, 0);
    }, [selectedItems, cart]);

    // 🌀 Loading
    if (loading) return <Loading content="Đang tải giỏ hàng của bạn..." />;

    // 🛒 Giỏ hàng trống
    if (!cart?.items?.length)
        return (
            <div className="max-w-4xl mx-auto text-center bg-white p-8 rounded-2xl shadow">
                <h2 className="text-xl font-semibold mb-4">Giỏ hàng trống</h2>
                <Link to="/" className="text-blue-500 hover:underline font-medium">
                    Tiếp tục mua sắm
                </Link>
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto relative">
            {/* ✅ Modal xác nhận */}
            <ConfirmModal
                open={confirmModal.open}
                title="Xóa sản phẩm"
                message={
                    confirmModal.bookIds.length > 1
                        ? `Bạn có chắc chắn muốn xóa ${confirmModal.bookIds.length} sản phẩm đã chọn?`
                        : 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?'
                }
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={handleRemoveConfirmed}
                onCancel={handleCancelRemove}
            />

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-13 font-semibold text-gray-600 bg-[#F6F8FB] p-4 text-sm">
                    <div className="col-span-6 flex items-center gap-5">
                        <input
                            type="checkbox"
                            className="accent-blue-500 cursor-pointer"
                            checked={selectedItems.length === cart.items.length}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                        />
                        <span>Sản phẩm</span>
                    </div>
                    <div className="col-span-2 text-center">Đơn giá</div>
                    <div className="col-span-2 text-center">Số lượng</div>
                    <div className="col-span-2 text-center">Thành tiền</div>
                    <div className="col-span-1 text-center">Thao tác</div>
                </div>

                {/* Danh sách sản phẩm */}
                <div>
                    {cart.items.map((item) => {
                        const book = item.bookId;
                        const price = book.discount
                            ? book.price * (1 - book.discount / 100)
                            : book.price;

                        return (
                            <div
                                key={book._id}
                                className="grid grid-cols-13 items-center p-4 border-t hover:bg-[#F9FBFF] transition"
                            >
                                {/* Checkbox + info */}
                                <div className="col-span-6 flex items-center gap-5">
                                    <input
                                        type="checkbox"
                                        className="accent-blue-500 cursor-pointer"
                                        checked={selectedItems.includes(book._id)}
                                        onChange={() => toggleSelect(book._id)}
                                    />
                                    <img
                                        src={`${API_URL}${book.images[0]}`}
                                        alt={book.title}
                                        className="w-20 h-24 object-cover rounded-md"
                                    />
                                    <div>
                                        <Link
                                            to={`/product/${book.slug}`}
                                            className="font-semibold hover:text-blue-600 transition line-clamp-1"
                                        >
                                            {book.title}
                                        </Link>
                                        <p className="text-gray-500 text-sm mt-1">{book.author}</p>
                                    </div>
                                </div>

                                {/* Giá */}
                                <div className="col-span-2 text-center">
                                    {book.discount > 0 ? (
                                        <>
                                            <p className="text-blue-600 font-semibold">
                                                {price.toLocaleString()}₫
                                            </p>
                                            <p className="text-gray-400 line-through text-sm">
                                                {book.price.toLocaleString()}₫
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-blue-600 font-semibold">
                                            {book.price.toLocaleString()}₫
                                        </p>
                                    )}
                                </div>

                                {/* Số lượng */}
                                <div className="col-span-2 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() =>
                                            handleQuantityChange(book._id, item.quantity - 1)
                                        }
                                        className="border rounded-full p-1 hover:bg-gray-100"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="px-3 py-1 border rounded-lg bg-gray-50">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleQuantityChange(book._id, item.quantity + 1)
                                        }
                                        className="border rounded-full p-1 hover:bg-gray-100"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Thành tiền */}
                                <div className="col-span-2 text-center font-semibold text-blue-600">
                                    {(price * item.quantity).toLocaleString()}₫
                                </div>

                                {/* Xóa */}
                                <button
                                    onClick={() => confirmRemove(book._id)}
                                    className="col-span-1 flex justify-center items-center text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ✅ Thanh công cụ phía dưới */}
            <div className="bg-white shadow-md rounded-2xl mt-6 p-4 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="text-gray-600 text-sm">
                        {' '}
                        Đã chọn{' '}
                        <span className="font-semibold text-blue-600">
                            {selectedItems.length}
                        </span>{' '}
                        sản phẩm{' '}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => confirmRemove(selectedItems)}
                            disabled={selectedItems.length === 0}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-red-500 cursor-pointer hover:text-white hover:bg-red-500 transition ${
                                selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Trash2 size={16} />
                            <span>Xóa các sản phẩm đã chọn</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold">
                        Tổng thanh toán:{' '}
                        <span className="text-blue-600 text-xl">
                            {totalPrice.toLocaleString()}₫
                        </span>
                    </p>
                    <CheckoutButton
                        items={cart.items.filter((item) => selectedItems.includes(item.bookId._id))}
                    />
                </div>
            </div>
        </div>
    );
}

export default Cart;
