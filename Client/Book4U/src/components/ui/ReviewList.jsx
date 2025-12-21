import { useState, useEffect } from 'react';
import { getBookReviews } from '../../services/api/reviewApi.js';
import API_URL from '../../configs/api';

function ReviewList({ bookId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchReviews();
    }, [bookId, page]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await getBookReviews(bookId, { page, limit: 5 });

            if (response.success) {
                setReviews(response.data || []);
                setPagination(response.pagination || {});
            }
        } catch (error) {
            console.error('Lỗi tải đánh giá:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && reviews.length === 0) {
        return <div className="text-center py-4">Đang tải đánh giá...</div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Chưa có đánh giá nào cho sản phẩm này
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div
                    key={review._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    {/* Header: Avatar + Tên + Rating + Ngày */}
                    <div className="flex items-start gap-3 mb-3">
                        {console.log('Review :', review)}
                        <div className="flex-shrink-0">
                            <img
                                src={
                                    review.profileId?.avatar
                                        ? `${API_URL}${review.profileId.avatar}`
                                        : 'https://via.placeholder.com/40'
                                }
                                alt={review.profileId?.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-gray-900">
                                    {review.profileId?.firstName}{' '}
                                    {review.profileId?.lastName}
                                </h4>
                                <span className="text-xs text-gray-500">
                                    {new Date(
                                        review.createdAt
                                    ).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            {/* Rating Stars */}
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`text-lg ${
                                            i < review.rating
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                        }`}>
                                        ★
                                    </span>
                                ))}
                                <span className="text-sm text-gray-600 ml-2">
                                    {review.rating}/5
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {review.comment}
                    </p>
                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {review.images.map((image, idx) => (
                                <div
                                    key={idx}
                                    className="relative overflow-hidden rounded-lg">
                                    <img
                                        src={`${API_URL}${image}`}
                                        alt={`Review ${idx}`}
                                        className="w-full h-60 object-contain cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6 pb-4">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">
                        ← Trước
                    </button>

                    {[...Array(pagination.pages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setPage(i + 1)}
                            className={`px-3 py-2 rounded-lg transition ${
                                page === i + 1
                                    ? 'bg-blue-500 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                            }`}>
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() =>
                            setPage(Math.min(pagination.pages, page + 1))
                        }
                        disabled={page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">
                        Sau →
                    </button>
                </div>
            )}
        </div>
    );
}

export default ReviewList;
