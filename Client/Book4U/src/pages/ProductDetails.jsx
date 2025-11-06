import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getBookBySlug } from '../services/api/bookApi';
import Loading from '../components/common/Loading.jsx';
import API_URL from '../configs/api';

import AddToCartButton from '../components/ui/buttons/AddToCartButton.jsx';
import BuyNowButton from '../components/ui/buttons/BuyNowButton.jsx';

function ProductDetails() {
    const { slug } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    if (loading) return <Loading context="Đang tải chi tiết sách..." />;
    if (error) return <p className="text-center text-red-500 mt-10 font-medium">{error}</p>;
    if (!book) return null;

    const discountedPrice = book.discount ? book.price * (1 - book.discount / 100) : book.price;

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
                        <h1 className="text-2xl font-semibold mb-2">{book.title}</h1>
                        <p className="text-gray-600 text-sm mb-4">
                            Tác giả: <span className="font-medium">{book.author}</span>
                        </p>
                        <div className="flex items-center mb-3">
                            <span className="text-yellow-500 text-lg mr-2">⭐</span>
                            <span className="font-medium">{book.rating?.toFixed(1)}</span>
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
                            {book.description || 'Không có mô tả cho cuốn sách này.'}
                        </p>
                    </div>

                    {/* Nút thêm giỏ hàng + mua ngay */}
                    <div className="mt-6 flex gap-3">
                        <AddToCartButton bookId={book._id} product={book} />
                        <BuyNowButton product={book} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetails;
