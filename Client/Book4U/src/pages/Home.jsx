import CategoryList from '../components/home/CategoryList';
import Section from '../components/home/Section';
import BookCard from '../components/ui/cards/BookCard.jsx';

import { useEffect, useState } from 'react';
import { getUserRecommendations } from '../services/api/recommendApi.js';
import { getFeaturedBooks } from '../services/api/bookApi.js';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function Home() {
    const [recommendations, setRecommendations] = useState([]);
    const [featuredBooks, setFeaturedBooks] = useState([]);
    const [aiSuggested, setAiSuggested] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy gợi ý từ AI
                const recommendResponse = await getUserRecommendations();
                if (recommendResponse.success) {
                    const recs = recommendResponse.data || [];
                    setRecommendations(recs);
                    // Sách có rating cao được coi là AI suggested
                    setAiSuggested(recs.filter((b) => (b.ratingAvg || 0) >= 4.5));
                } else {
                    console.error('❌ Lỗi khi lấy đề xuất:', recommendResponse.message);
                }

                // Lấy sách nổi bật
                const featuredResponse = await getFeaturedBooks();
                if (featuredResponse.success) {
                    setFeaturedBooks(featuredResponse.data || []);
                } else {
                    console.error('❌ Lỗi khi lấy sách nổi bật:', featuredResponse.message);
                }
            } catch (error) {
                console.error('⚠️ Lỗi khi lấy dữ liệu:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCarouselPrev = () => {
        setCarouselIndex((prev) => (prev === 0 ? featuredBooks.length - 1 : prev - 1));
    };

    const handleCarouselNext = () => {
        setCarouselIndex((prev) => (prev === featuredBooks.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-12">
            {/* Danh mục thể loại */}
            <CategoryList />

            {/* Carousel sách nổi bật */}
            {featuredBooks.length > 0 && (
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl overflow-hidden h-96">
                    {/* Background banner */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-black opacity-30"></div>
                    </div>

                    {/* Nội dung carousel */}
                    <div className="relative h-full flex items-center">
                        {featuredBooks.map((book, idx) => (
                            <div
                                key={idx}
                                className={`absolute inset-0 transition-opacity duration-500 flex items-center justify-between px-8 ${
                                    idx === carouselIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                            >
                                {/* Hình ảnh sách - trái */}
                                <div className="w-1/3 flex justify-center">
                                    <div className="relative">
                                        <div className="absolute -inset-2 bg-white rounded-2xl blur-lg opacity-20"></div>
                                        <img
                                            src={
                                                book.images?.[0] ||
                                                'https://via.placeholder.com/250x350?text=No+Image'
                                            }
                                            alt={book.title}
                                            className="relative w-56 h-80 object-cover rounded-xl shadow-2xl"
                                        />
                                        {book.discount > 0 && (
                                            <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg">
                                                -{book.discount}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thông tin sách - phải */}
                                <div className="w-2/3 pl-8 text-white">
                                    <p className="text-sm font-semibold mb-2 opacity-80">
                                        📚 SÁCH NỔI BẬT THÁNG NÀY
                                    </p>
                                    <h2 className="text-4xl font-bold mb-4 line-clamp-2">
                                        {book.title}
                                    </h2>
                                    <p className="text-lg mb-2">
                                        ✍️ {book.sellerId?.firstName || 'Tác giả'}{' '}
                                        {book.sellerId?.lastName || ''}
                                    </p>
                                    {book.categoryId && (
                                        <p className="text-sm mb-4 opacity-90">
                                            📂 {book.categoryId?.name || 'Thể loại'}
                                        </p>
                                    )}
                                    <p className="text-base mb-6 line-clamp-3 opacity-90">
                                        {book.description || 'Một cuốn sách tuyệt vời'}
                                    </p>

                                    {/* Rating và giá */}
                                    <div className="flex items-center gap-8 mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⭐</span>
                                            <div>
                                                <p className="text-xl font-bold">
                                                    {(book.ratingAvg || 0).toFixed(1)}/5
                                                </p>
                                                <p className="text-xs opacity-80">
                                                    ({book.ratingCount || 0} đánh giá)
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {book.discount > 0 && (
                                                <p className="text-sm line-through opacity-80">
                                                    ₫{book.price.toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                            <p className="text-3xl font-bold">
                                                ₫
                                                {Math.round(
                                                    book.price * (1 - book.discount / 100)
                                                ).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nút hành động */}
                                    <Link
                                        to={`/book/${book.slug}`}
                                        className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all"
                                    >
                                        Xem chi tiết
                                        <FaArrowRight className="text-sm" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Nút điều hướng */}
                    <button
                        onClick={handleCarouselPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all z-10"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={handleCarouselNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all z-10"
                    >
                        <FaChevronRight />
                    </button>

                    {/* Chỉ báo trang */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {featuredBooks.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCarouselIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx === carouselIndex ? 'bg-white w-8' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Gợi ý từ AI */}
            {aiSuggested.length > 0 && (
                <Section
                    title="🤖 Gợi ý từ AI cho bạn"
                    viewAll={true}
                    viewAllLink="/daily-discover?page=1"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {aiSuggested.slice(0, 8).map((b, i) => (
                            <BookCard key={i} {...b} />
                        ))}
                    </div>
                </Section>
            )}

            {/* Sách nổi bật trong tháng */}
            {featuredBooks.length > 0 && (
                <Section
                    title="📚 Sách nổi bật trong tháng"
                    viewAll={true}
                    viewAllLink="/featured-books"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {featuredBooks.slice(0, 8).map((b, i) => (
                            <BookCard key={i} {...b} />
                        ))}
                    </div>
                </Section>
            )}

            {/* Chọn lọc sách nổi bật - Top Rated */}
            {featuredBooks.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            ⭐ Chọn lọc của tháng - Top Rated
                        </h2>
                        <Link
                            to="/featured-books"
                            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold transition-colors"
                        >
                            Xem tất cả
                            <FaArrowRight className="text-sm" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {featuredBooks
                            .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))
                            .slice(0, 4)
                            .map((book, idx) => (
                                <Link
                                    key={idx}
                                    to={`/book/${book.slug}`}
                                    className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 flex gap-5 cursor-pointer"
                                >
                                    {/* Hình ảnh sách */}
                                    <div className="flex-shrink-0 w-32 h-48 rounded-lg overflow-hidden bg-gray-200">
                                        <img
                                            src={
                                                book.images?.[0] ||
                                                'https://via.placeholder.com/150x200?text=No+Image'
                                            }
                                            alt={book.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>

                                    {/* Thông tin sách */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2 mb-2">
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                ✍️{' '}
                                                <span className="font-semibold">
                                                    {book.sellerId?.firstName || 'Tác giả'}
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                                {book.description || 'Không có mô tả'}
                                            </p>
                                        </div>

                                        {/* Rating và giá */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-yellow-500 text-lg">★</span>
                                                <span className="font-bold text-gray-900">
                                                    {(book.ratingAvg || 0).toFixed(1)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({book.ratingCount || 0} đánh giá)
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                {book.discount > 0 && (
                                                    <p className="text-xs text-red-500 line-through">
                                                        ₫{book.price.toLocaleString('vi-VN')}
                                                    </p>
                                                )}
                                                <p className="text-lg font-bold text-yellow-600">
                                                    ₫
                                                    {Math.round(
                                                        book.price * (1 - book.discount / 100)
                                                    ).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </div>
            )}

            {/* Gợi ý hôm nay */}
            {recommendations.length > 0 && (
                <Section
                    title="✨ Gợi ý hôm nay"
                    viewAll={true}
                    viewAllLink="/daily-discover?page=1"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {recommendations.slice(0, 8).map((b, i) => (
                            <BookCard key={i} {...b} />
                        ))}
                    </div>
                </Section>
            )}

            {/* Hành động cuối cùng */}
            {!loading && recommendations.length === 0 && (
                <div className="flex justify-center mt-6">
                    {token ? (
                        <Link
                            to="/daily-discover?page=1"
                            className="flex items-center justify-center w-auto gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all font-semibold"
                        >
                            <span>Xem thêm gợi ý</span>
                            <FaArrowRight className="text-sm" />
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center justify-center w-auto gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all font-semibold"
                        >
                            <span>Đăng nhập để nhận gợi ý cá nhân hóa!</span>
                            <FaArrowRight className="text-sm" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default Home;
