import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRecommendations } from '../services/api/recommendApi.js';
import BookCard from '../components/ui/BookCard.jsx';
import Section from '../components/home/Section';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Loading from '../components/common/Loading.jsx';

function DailyDiscover() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    // 📄 Lấy page từ query string (?page=2)
    const query = new URLSearchParams(location.search);
    const page = parseInt(query.get('page')) || 1;
    const limit = 12; // cố định mỗi trang 12 quyển

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                const response = await getUserRecommendations({ page });

                console.log('Response gợi ý:', response);
                if (response.success) {
                    setBooks(response.data);
                    setTotal(response.meta?.totalItems || 0);
                } else {
                    setError(response.message || 'Không thể tải dữ liệu.');
                }
            } catch (err) {
                console.error('⚠️ Lỗi khi tải sách gợi ý:', err);
                setError('Lỗi khi tải dữ liệu.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        navigate(`/daily-discover?page=${newPage}`);
    };

    return (
        <div className="space-y-10">
            <Section title="📖 Gợi ý hôm nay cho bạn">
                {loading ? (
                    <Loading context="Đang tải sách gợi ý..." />
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : books.length === 0 ? (
                    <p className="text-center text-gray-500">Không tìm thấy gợi ý nào.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {books.map((b, i) => (
                                <BookCard key={i} {...b} />
                            ))}
                        </div>

                        {/* 🔽 Phân trang */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 gap-4">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                    className={`p-2 rounded-full border text-lg ${
                                        page <= 1
                                            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'text-blue-500 border-blue-300 hover:bg-blue-100'
                                    }`}
                                >
                                    <FaChevronLeft />
                                </button>

                                <span className="font-medium text-gray-700">
                                    Trang {page} / {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages}
                                    className={`p-2 rounded-full border text-lg ${
                                        page >= totalPages
                                            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'text-blue-500 border-blue-300 hover:bg-blue-100'
                                    }`}
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </Section>
        </div>
    );
}

export default DailyDiscover;
