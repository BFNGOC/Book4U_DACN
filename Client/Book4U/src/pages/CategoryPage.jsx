import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAllCategories } from '../services/api/categoryApi';
import { getBooksByCategorySlug } from '../services/api/bookApi';
import BookCard from '../components/ui/cards/BookCard';
import Loading from '../components/common/Loading';
import { FaArrowLeft, FaFilter } from 'react-icons/fa';

function CategoryPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categoryBooks, setCategoryBooks] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState([0, 1000000]);

    useEffect(() => {
        const fetchCategoryAndBooks = async () => {
            try {
                // Lấy tất cả category để tìm category hiện tại
                const categoriesResponse = await getAllCategories();
                let category = null;

                if (categoriesResponse.success) {
                    category = categoriesResponse.data?.find((c) => c.slug === slug);
                }

                if (!category) {
                    navigate('/');
                    return;
                }

                setCurrentCategory(category);

                // Lấy sách theo category slug
                const booksResponse = await getBooksByCategorySlug(slug);
                let filtered = [];

                if (booksResponse.success) {
                    filtered = booksResponse.data || [];
                } else {
                    console.error('❌ Lỗi khi lấy sách:', booksResponse.message);
                }

                // Lọc theo giá
                filtered = filtered.filter(
                    (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
                );

                // Sắp xếp
                if (sortBy === 'price-asc') {
                    filtered.sort((a, b) => a.price - b.price);
                } else if (sortBy === 'price-desc') {
                    filtered.sort((a, b) => b.price - a.price);
                } else if (sortBy === 'rating') {
                    filtered.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
                } else {
                    // newest (mặc định)
                    filtered.reverse();
                }

                setCategoryBooks(filtered);
                setLoading(false);
            } catch (error) {
                console.error('⚠️ Lỗi khi lấy dữ liệu:', error);
                navigate('/');
            }
        };

        fetchCategoryAndBooks();
    }, [slug, navigate, sortBy, priceRange]);

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

                <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl p-8">
                    <h1 className="text-4xl font-bold mb-2">{currentCategory?.name}</h1>
                    <p className="text-blue-100">{currentCategory?.description}</p>
                    <p className="text-blue-100 mt-2">Tìm thấy {categoryBooks.length} sản phẩm</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Lọc */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
                        <div className="flex items-center gap-2 mb-6">
                            <FaFilter />
                            <h2 className="text-lg font-bold">Bộ lọc</h2>
                        </div>

                        {/* Sắp xếp */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3 text-gray-900">Sắp xếp theo</h3>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="price-asc">Giá: Thấp đến Cao</option>
                                <option value="price-desc">Giá: Cao đến Thấp</option>
                                <option value="rating">Đánh giá cao nhất</option>
                            </select>
                        </div>

                        {/* Giá */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3 text-gray-900">Khoảng giá</h3>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="1000000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>₫0</span>
                                    <span>₫{priceRange[1].toLocaleString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách sách */}
                <div className="lg:col-span-3">
                    {categoryBooks.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {categoryBooks.map((book, idx) => (
                                <BookCard key={idx} {...book} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <p className="text-xl text-gray-500">Không tìm thấy sách phù hợp</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CategoryPage;
