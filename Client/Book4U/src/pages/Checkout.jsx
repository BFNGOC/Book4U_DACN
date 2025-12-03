import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createOrder } from '../services/api/orderApi.js';
import { useUser } from '@/contexts/userContext';
import ProgressSteps from '../components/ui/ProgressSteps.jsx';
function Checkout() {
    const { user } = useUser();
    const [checkoutItems, setCheckoutItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        phone: '',
        address: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [step, setStep] = useState(1); // 1: Confirm items, 2: Shipping, 3: Payment
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('checkoutItems');
        if (stored) {
            setCheckoutItems(JSON.parse(stored));
        } else {
            toast.error('Không có sản phẩm nào để thanh toán');
            navigate('/cart');
        }
    }, [navigate]);

    const total = checkoutItems.reduce((sum, item) => {
        const book = item.bookId;
        const price = book.discount
            ? book.price * (1 - book.discount / 100)
            : book.price;
        return sum + price * item.quantity;
    }, 0);

    const validateShipping = () => {
        if (!shippingAddress.fullName.trim()) {
            toast.error('Vui lòng nhập họ tên');
            return false;
        }
        if (!shippingAddress.phone.trim()) {
            toast.error('Vui lòng nhập số điện thoại');
            return false;
        }
        if (!shippingAddress.address.trim()) {
            toast.error('Vui lòng nhập địa chỉ giao hàng');
            return false;
        }
        if (!/^\d{10}$/.test(shippingAddress.phone)) {
            toast.error('Số điện thoại không hợp lệ');
            return false;
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        if (!validateShipping()) return;
        console.log(checkoutItems);
        setLoading(true);
        try {
            // Chuẩn bị data
            const orderData = {
                profileId: user._id,
                items: checkoutItems.map((item) => ({
                    bookId: item.bookId._id,
                    sellerId: item.sellerId._id,
                    quantity: item.quantity,
                    price: item.bookId.discount
                        ? item.bookId.price * (1 - item.bookId.discount / 100)
                        : item.bookId.price,
                })),
                totalAmount: total,
                paymentMethod,
                shippingAddress,
                // Pass address for geocoding on server
                customerLocation: {
                    address: shippingAddress.address,
                },
            };

            // Tạo đơn hàng
            const response = await createOrder(orderData);
            if (!response.success) {
                toast.error(response.message || 'Lỗi đặt hàng');
                return;
            }

            toast.success('Đặt hàng thành công!');
            localStorage.removeItem('checkoutItems');
            navigate(`/orders/${response.data._id}`);
        } catch (error) {
            toast.error('Lỗi đặt hàng');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!checkoutItems.length) return null;

    return (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow mt-8 mb-8">
            {/* Progress Steps Component */}
            <ProgressSteps
                steps={[
                    'Xác nhận sản phẩm',
                    'Địa chỉ giao hàng',
                    'Phương thức thanh toán',
                ]}
                currentStep={step - 1}
            />

            {/* Step 1: Confirm items */}
            {step === 1 && (
                <div className="animate-fadeIn">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">
                            📦 Xác nhận sản phẩm
                        </h2>
                        <div className="bg-blue-100 px-4 py-2 rounded-lg">
                            <p className="text-sm font-semibold text-blue-700">
                                {checkoutItems.length} sản phẩm
                            </p>
                        </div>
                    </div>

                    {/* Items grid */}
                    <div className="space-y-4 mb-8">
                        {checkoutItems.map((item) => {
                            const book = item.bookId;
                            const price = book.discount
                                ? book.price * (1 - book.discount / 100)
                                : book.price;
                            const discount = book.discount || 0;

                            return (
                                <div
                                    key={book._id}
                                    className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-white border-l-4 border-blue-500 rounded-lg hover:shadow-md transition-shadow">
                                    {/* Product image */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={`${
                                                import.meta.env.VITE_API_URL
                                            }${book.images[0]}`}
                                            alt={book.title}
                                            className="w-24 h-32 object-cover rounded-lg shadow-md"
                                        />
                                    </div>

                                    {/* Product info */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-800 mb-2">
                                            {book.title}
                                        </h3>
                                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                                            <p>
                                                <span className="font-semibold">
                                                    🏪 Shop:
                                                </span>{' '}
                                                {book.sellerId?.storeName ||
                                                    'Shop'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">
                                                    📚 Loại:
                                                </span>{' '}
                                                {book.category || 'Sách'}
                                            </p>
                                        </div>

                                        {/* Quantity selector */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-sm font-semibold text-gray-600">
                                                Số lượng:
                                            </span>
                                            <div className="bg-gray-200 px-3 py-1 rounded-lg font-bold text-gray-700">
                                                {item.quantity}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="flex-shrink-0 text-right">
                                        {discount > 0 && (
                                            <div className="mb-2 inline-block">
                                                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                    -{discount}%
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 line-through mb-1">
                                            {book.price.toLocaleString()}₫
                                        </p>
                                        <p className="text-lg font-bold text-blue-600 mb-2">
                                            {price.toLocaleString()}₫
                                        </p>
                                        <div className="bg-gray-100 px-3 py-2 rounded-lg">
                                            <p className="text-xs text-gray-600">
                                                Tổng
                                            </p>
                                            <p className="text-xl font-bold text-red-500">
                                                {(
                                                    price * item.quantity
                                                ).toLocaleString()}
                                                ₫
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200 mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-700">Tổng giá trị:</span>
                            <span className="text-2xl font-bold text-blue-600">
                                {total.toLocaleString()}₫
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Sản phẩm ({checkoutItems.length})</span>
                            <span>
                                {checkoutItems.reduce(
                                    (sum, item) => sum + item.quantity,
                                    0
                                )}{' '}
                                cái
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/cart')}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                            ← Quay lại giỏ hàng
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md">
                            Tiếp tục → Địa chỉ giao
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Shipping address */}
            {step === 2 && (
                <div className="animate-fadeIn">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">
                            📍 Địa chỉ giao hàng
                        </h2>
                        <div className="bg-blue-100 px-4 py-2 rounded-lg">
                            <p className="text-sm font-semibold text-blue-700">
                                Bước 2/3
                            </p>
                        </div>
                    </div>

                    <form className="space-y-6">
                        {/* Full Name Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Họ và tên{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <input
                                type="text"
                                value={shippingAddress.fullName}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        fullName: e.target.value,
                                    })
                                }
                                placeholder="Nhập tên đầy đủ của bạn"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition border-gray-300 focus:border-blue-500`}
                            />
                            {!shippingAddress.fullName.trim() && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Vui lòng nhập tên đầy đủ
                                </p>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Số điện thoại{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <input
                                type="tel"
                                value={shippingAddress.phone}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        phone: e.target.value,
                                    })
                                }
                                placeholder="Nhập số điện thoại (10 chữ số)"
                                maxLength="10"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition border-gray-300 focus:border-blue-500`}
                            />
                            {shippingAddress.phone &&
                                !shippingAddress.phone.match(/^\d{10}$/) && (
                                    <p className="text-xs text-red-500 mt-1">
                                        ⚠️ Số điện thoại phải có 10 chữ số
                                    </p>
                                )}
                        </div>

                        {/* Address Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Địa chỉ{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <textarea
                                value={shippingAddress.address}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        address: e.target.value,
                                    })
                                }
                                placeholder="Nhập địa chỉ giao hàng (ví dụ: Số nhà, tên đường, quận huyện, TP...)"
                                rows="3"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition resize-none border-gray-300 focus:border-blue-500
                                `}
                            />
                            {!shippingAddress.address.trim() && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Vui lòng nhập địa chỉ giao hàng
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Ghi rõ địa chỉ để hệ thống tìm kho gần nhất
                            </p>
                        </div>

                        {/* Validation summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                ✅ Trạng thái hoàn thành:
                            </p>
                            <ul className="space-y-1 text-xs text-gray-600">
                                <li className="flex items-center gap-2">
                                    {shippingAddress.fullName.trim() ? (
                                        <span className="text-green-600">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">○</span>
                                    )}
                                    Tên đầy đủ
                                </li>
                                <li className="flex items-center gap-2">
                                    {shippingAddress.phone.match(/^\d{10}$/) ? (
                                        <span className="text-green-600">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">○</span>
                                    )}
                                    Số điện thoại
                                </li>
                                <li className="flex items-center gap-2">
                                    {shippingAddress.address.trim() ? (
                                        <span className="text-green-600">
                                            ✓
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">○</span>
                                    )}
                                    Địa chỉ giao hàng
                                </li>
                            </ul>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                                ← Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    shippingAddress.fullName.trim() &&
                                    shippingAddress.phone.match(/^\d{10}$/) &&
                                    shippingAddress.address.trim() &&
                                    setStep(3)
                                }
                                disabled={
                                    !shippingAddress.fullName.trim() ||
                                    !shippingAddress.phone.match(/^\d{10}$/) ||
                                    !shippingAddress.address.trim()
                                }
                                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md disabled:cursor-not-allowed">
                                Tiếp tục → Thanh toán
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Payment method */}
            {step === 3 && (
                <div className="animate-fadeIn">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">
                            💳 Phương thức thanh toán
                        </h2>
                        <div className="bg-blue-100 px-4 py-2 rounded-lg">
                            <p className="text-sm font-semibold text-blue-700">
                                Bước 3/3 (Cuối cùng)
                            </p>
                        </div>
                    </div>

                    {/* Order summary box */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200 mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            📋 Tóm tắt đơn hàng
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">
                                    👤 Người nhận
                                </p>
                                <p className="font-bold text-gray-800">
                                    {shippingAddress.fullName}
                                </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">
                                    📞 Điện thoại
                                </p>
                                <p className="font-bold text-gray-800">
                                    {shippingAddress.phone}
                                </p>
                            </div>
                            <div className="col-span-2 bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">
                                    🏠 Địa chỉ
                                </p>
                                <p className="font-bold text-gray-800">
                                    {shippingAddress.address}
                                </p>
                            </div>
                        </div>
                        <div className="border-t-2 border-blue-200 pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-semibold">
                                    Sản phẩm ({checkoutItems.length}):
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                    {checkoutItems.reduce(
                                        (sum, item) => sum + item.quantity,
                                        0
                                    )}{' '}
                                    cái
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-gray-700 font-semibold">
                                    Tổng tiền:
                                </span>
                                <span className="text-2xl font-bold text-red-500">
                                    {total.toLocaleString()}₫
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment methods */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Chọn phương thức thanh toán:
                        </h3>
                        <div className="space-y-3">
                            {[
                                {
                                    value: 'COD',
                                    label: '💵 Thanh toán khi nhận hàng (COD)',
                                    desc: 'Thanh toán tiền mặt khi nhận sản phẩm - An toàn và tiện lợi',
                                    icon: '💰',
                                },
                                {
                                    value: 'VNPAY',
                                    label: '🏦 Thanh toán qua VNPay',
                                    desc: 'Chuyển khoản ngân hàng trực tuyến - Nhanh chóng và bảo mật',
                                    icon: '🏧',
                                },
                                {
                                    value: 'MOMO',
                                    label: '📱 Thanh toán qua Momo',
                                    desc: 'Ví điện tử Momo - Thanh toán tức thì',
                                    icon: '📲',
                                },
                            ].map((method) => (
                                <label
                                    key={method.value}
                                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition transform hover:scale-102 ${
                                        paymentMethod === method.value
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                    }`}>
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={method.value}
                                            checked={
                                                paymentMethod === method.value
                                            }
                                            onChange={(e) =>
                                                setPaymentMethod(e.target.value)
                                            }
                                            className="w-5 h-5 cursor-pointer"
                                        />
                                        {paymentMethod === method.value && (
                                            <div className="absolute inset-0 border-2 border-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xl">
                                                {method.icon}
                                            </span>
                                            <p className="font-bold text-gray-800">
                                                {method.label}
                                            </p>
                                            {paymentMethod === method.value && (
                                                <span className="ml-auto bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    ✓ Đã chọn
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {method.desc}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Terms & conditions */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-8">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">⚠️ Lưu ý:</span>{' '}
                            Bằng cách nhấn "Đặt hàng", bạn đồng ý với các điều
                            khoản dịch vụ và chính sách bảo mật của chúng tôi.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                            ← Quay lại
                        </button>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || !paymentMethod}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <span className="inline-block animate-spin">
                                        ⏳
                                    </span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>✓ Đặt hàng</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Checkout;
