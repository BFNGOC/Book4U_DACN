import { Star, ShoppingCart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_URL from '../../configs/api.js';

/**
 * RecommendationCard - Hiển thị thông tin sách được gợi ý bởi AI
 * Phong cách UI hiện đại, đồng nhất với trang home
 */
function RecommendationCard({ book, reason }) {
    const priceFormatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    const imageUrl = book.images?.[0] || 'https://via.placeholder.com/150x200?text=Book';

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
            {/* Image Section */}
            <div className="relative overflow-hidden bg-gray-100 h-48 flex items-center justify-center">
                <img
                    src={`${API_URL}${imageUrl}`}
                    alt={book.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x200?text=Book';
                    }}
                />
                {book.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        -{book.discount}%
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col">
                {/* Title */}
                <Link to={`/book/${book.slug}`} className="block">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-blue-600 transition-colors">
                        {book.title}
                    </h3>
                </Link>

                {/* Author */}
                <p className="text-xs text-gray-600 mt-1">✍️ {book.author}</p>

                {/* Publisher */}
                {book.publisher && (
                    <p className="text-xs text-gray-500 mt-0.5">🏢 {book.publisher}</p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                    <div className="flex items-center gap-0.5">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold text-gray-900">
                            {book.ratingAvg?.toFixed(1) || '0.0'}
                        </span>
                    </div>
                    {book.ratingCount > 0 && (
                        <span className="text-xs text-gray-500">({book.ratingCount})</span>
                    )}
                </div>

                {/* Reason (AI gợi ý) */}
                {reason && (
                    <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded">
                        <p className="text-xs text-blue-900 italic">💡 {reason}</p>
                    </div>
                )}

                {/* Price & Actions */}
                <div className="mt-auto pt-3 border-gray-200 space-y-2">
                    {/* Price */}
                    <div>
                        <p className="text-lg font-bold text-red-600">
                            {priceFormatter.format(book.price)}
                        </p>
                        {book.discount > 0 && (
                            <p className="text-xs text-gray-500 line-through">
                                {priceFormatter.format(
                                    Math.round(book.price / (1 - book.discount / 100))
                                )}
                            </p>
                        )}
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-1 gap-2">
                        <Link
                            to={`/book/${book.slug}`}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs rounded transition-colors text-center"
                        >
                            Xem chi tiết
                        </Link>
                    </div>
                </div>

                {/* Stock Status */}
                {book.stock <= 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 text-center font-semibold">
                        Hết hàng
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecommendationCard;
