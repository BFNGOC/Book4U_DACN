import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { getBookBySlug } from '../services/api/bookApi';
import Loading from '../components/common/Loading.jsx';
import API_URL from '../configs/api';

import AddToCartButton from '../components/ui/buttons/AddToCartButton.jsx';
import BuyNowButton from '../components/ui/buttons/BuyNowButton.jsx';
import StartChat from '../components/chat/StartChat.jsx';
import ReviewForm from '../components/ui/ReviewForm.jsx';
import ReviewList from '../components/ui/ReviewList.jsx';

function ProductDetails() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    console.log('ProductDetails: book =', book);
    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                setLoading(true);
                const data = await getBookBySlug(slug);

                if (data.success) {
                    setBook(data.data);
                } else {
                    setError(data.message || 'Không thể tải chi tiết sách.');
                }
            } catch (error) {
                console.error('Lỗi khi lấy chi tiết sách:', error);
                setError('Lỗi khi tải chi tiết sách.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookDetails();
    }, [slug]);

    const handleSellerClick = () => {
        if (book?.sellerId?._id) {
            navigate(`/seller/${book.sellerId._id}`);
        }
    };

    if (loading) return <Loading context="Đang tải chi tiết sách..." />;
    if (error)
        return (
            <p className="text-center text-red-500 mt-10 font-medium">
                {error}
            </p>
        );
    if (!book) return null;

    const discountedPrice = book.discount
        ? book.price * (1 - book.discount / 100)
        : book.price;

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 max-w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Ảnh sách */}
                <div>
                    <img
                        src={`${API_URL}${book.images?.[0]}`}
                        alt={book.title}
                        className="w-full h-[420px] object-cover rounded-xl shadow-sm"
                    />
                </div>

                {/* Thông tin sách */}
                <div className="flex flex-col justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold mb-2">
                            {book.title}
                        </h1>
                        <p className="text-gray-600 text-sm mb-4">
                            Tác giả:{' '}
                            <span className="font-medium">{book.author}</span>
                        </p>
                        <div className="flex items-center mb-3">
                            <span className="text-yellow-500 text-lg mr-2">
                                ⭐
                            </span>
                            <span className="font-medium">
                                {book?.ratingCount > 0
                                    ? `${book.ratingAvg.toFixed(1)} ( ${
                                          book.ratingCount
                                      } đánh giá )`
                                    : 'Chưa có đánh giá'}
                            </span>
                        </div>

                        {/* Giá */}
                        <div className="mb-4">
                            <span className="text-blue-600 text-2xl font-bold">
                                {discountedPrice.toLocaleString()}₫
                            </span>
                            {book.discount > 0 && (
                                <span className="text-gray-400 line-through text-sm ml-2">
                                    {book.price.toLocaleString()}₫
                                </span>
                            )}
                        </div>

                        {/* Thể loại + người bán */}
                        <div className="text-sm text-gray-700 mb-2">
                            <p>
                                <span className="font-medium">Thể loại:</span>{' '}
                                {book.categoryId?.name}
                            </p>
                            <p>
                                <span className="font-medium">Người bán:</span>{' '}
                                {book.sellerId
                                    ? `${book.sellerId.firstName} ${book.sellerId.lastName}`
                                    : 'Không rõ'}
                            </p>
                        </div>

                        {/* Mô tả */}
                        <p className="mt-4 text-gray-600 leading-relaxed">
                            {book.description ||
                                'Không có mô tả cho cuốn sách này.'}
                        </p>
                    </div>

                    {/* Nút thêm giỏ hàng + mua ngay */}
                    <div className="mt-6 flex gap-3">
                        {!orderId && (
                            <>
                                <AddToCartButton
                                    bookId={book._id}
                                    product={book}
                                />
                                <BuyNowButton product={book} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 🏪 Thông tin Cửa hàng */}
            {book.sellerId && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Người bán
                    </h3>

                    <div className="space-y-4">
                        {/* Store Card */}
                        <div
                            onClick={handleSellerClick}
                            className="group flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
                            {/* Left: Avatar + Quick Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={`${API_URL}${
                                            book.sellerId.storeLogo ||
                                            book.sellerId.avatar
                                        }`}
                                        alt={book.sellerId.storeName}
                                        className="w-14 h-14 rounded-full object-cover border border-gray-200 group-hover:border-indigo-400 transition-colors"
                                    />
                                </div>

                                {/* Store Info */}
                                <div className="flex-grow min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                        {book.sellerId.storeName}
                                    </h4>

                                    {/* Rating & Sales */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-0.5 text-xs">
                                            <span className="text-yellow-400">
                                                ★
                                            </span>
                                            <span className="font-semibold text-gray-700">
                                                {book.sellerId.rating?.toFixed(
                                                    1
                                                ) || '0'}
                                            </span>
                                            <span className="text-gray-500 ml-1">
                                                |
                                            </span>
                                            <span className="text-gray-600 ml-1">
                                                {(
                                                    book.sellerId.totalSales ||
                                                    0
                                                ).toLocaleString()}{' '}
                                                đơn
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Arrow Icon */}
                            <div className="flex-shrink-0 text-indigo-600 group-hover:translate-x-1 transition-transform">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Chat Button */}
                        <StartChat
                            sellerId={book.sellerId._id}
                            sellerInfo={{
                                _id: book.sellerId._id,
                                firstName: book.sellerId.firstName,
                                lastName: book.sellerId.lastName,
                                storeLogo: book.sellerId.storeLogo,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* 📝 Form đánh giá (chỉ hiển thị khi đến từ đơn hàng đã giao) */}
            {orderId && book._id && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <ReviewForm
                        bookId={book._id}
                        orderId={orderId}
                        onSuccess={() => {
                            window.location.href = '/orders';
                        }}
                    />
                </div>
            )}

            {/* 💬 Danh sách đánh giá */}
            {book._id && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span>💬 Đánh giá từ khách hàng</span>
                        <span className="text-sm text-gray-500 font-normal">
                            ({book.ratingCount || 0})
                        </span>
                    </h3>
                    <ReviewList bookId={book._id} />
                </div>
            )}
        </div>
    );
}

export default ProductDetails;
