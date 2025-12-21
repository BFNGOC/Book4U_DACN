import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedBooks } from '../services/api/bookApi';
import BookCard from '../components/ui/cards/BookCard';
import Loading from '../components/common/Loading';
import { FaArrowLeft, FaFilter } from 'react-icons/fa';

function FeaturedBooksPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [featuredBooks, setFeaturedBooks] = useState([]);
    const [allFeaturedBooks, setAllFeaturedBooks] = useState([]);
    const [sortBy, setSortBy] = useState('rating');

    useEffect(() => {
        const fetchFeaturedBooks = async () => {
            try {
                const response = await getFeaturedBooks();
                if (response.success) {
                    setAllFeaturedBooks(response.data || []);
                } else {
                    console.error('❌ Lỗi khi lấy sách nổi bật:', response.message);
                    setAllFeaturedBooks([]);
                }
            } catch (error) {
                console.error('⚠️ Lỗi khi gọi API sách nổi bật:', error);
                setAllFeaturedBooks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedBooks();
    }, []);

    // Cập nhật sắp xếp khi sortBy thay đổi
    useEffect(() => {
        let featured = [...allFeaturedBooks];

        // Sắp xếp
        if (sortBy === 'price-asc') {
            featured.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            featured.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'newest') {
            featured.reverse();
        } else {
            // rating (mặc định)
            featured.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
        }

        setFeaturedBooks(featured);
    }, [sortBy, allFeaturedBooks]);

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors"
                >
                    <FaArrowLeft className="text-sm" />
                    Quay lại
                </button>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white rounded-2xl p-8">
                    <h1 className="text-4xl font-bold mb-2">📚 Sách nổi bật trong tháng</h1>
                    <p className="text-yellow-100">
                        Khám phá những cuốn sách được yêu thích nhất trong tháng
                    </p>
                    <p className="text-yellow-100 mt-2">
                        Tìm thấy {featuredBooks.length} sách nổi bật
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Sắp xếp */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
                        <div className="flex items-center gap-2 mb-6">
                            <FaFilter />
                            <h2 className="text-lg font-bold">Sắp xếp</h2>
                        </div>

                        <div className="space-y-2">
                            {[
                                { value: 'rating', label: '⭐ Đánh giá cao nhất' },
                                { value: 'newest', label: '🆕 Mới nhất' },
                                { value: 'price-asc', label: '💰 Giá: Thấp đến Cao' },
                                { value: 'price-desc', label: '💎 Giá: Cao đến Thấp' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <input
                                        type="radio"
                                        value={option.value}
                                        checked={sortBy === option.value}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="mr-3 w-4 h-4"
                                    />
                                    <span className="text-gray-800">{option.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Thống kê */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="font-semibold mb-4 text-gray-900">Thống kê</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    📊 Tổng sách:{' '}
                                    <span className="font-bold text-gray-900">
                                        {featuredBooks.length}
                                    </span>
                                </p>
                                <p>
                                    ⭐ Đánh giá trung bình:{' '}
                                    <span className="font-bold text-gray-900">
                                        {featuredBooks.length > 0
                                            ? (
                                                  featuredBooks.reduce(
                                                      (sum, b) => sum + (b.ratingAvg || 0),
                                                      0
                                                  ) / featuredBooks.length
                                              ).toFixed(1)
                                            : 0}
                                    </span>
                                </p>
                                <p>
                                    💵 Giá trung bình:{' '}
                                    <span className="font-bold text-gray-900">
                                        ₫
                                        {featuredBooks.length > 0
                                            ? Math.round(
                                                  featuredBooks.reduce(
                                                      (sum, b) => sum + b.price,
                                                      0
                                                  ) / featuredBooks.length
                                              ).toLocaleString('vi-VN')
                                            : 0}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách sách */}
                <div className="lg:col-span-3">
                    {featuredBooks.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {featuredBooks.map((book, idx) => (
                                <BookCard key={idx} {...book} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <p className="text-xl text-gray-500">Không có sách nổi bật</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FeaturedBooksPage;
