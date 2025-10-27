import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSearchResults } from '../services/api/searchApi.js';
import BookCard from '../components/home/BookCard';
import Section from '../components/home/Section';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Loading from '../components/common/Loading.jsx';

function Search() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    const query = new URLSearchParams(location.search);
    const q = query.get('q') || '';
    const page = parseInt(query.get('page'));
    const limit = parseInt(query.get('limit'));

    useEffect(() => {
        const handleFiltered = async () => {
            try {
                setLoading(true);
                const result = await getSearchResults({ q, page, limit });
                if (result.success) {
                    setResults(result.data);
                    setTotal(result.meta?.total || 0);
                } else {
                    setError(result.message || 'Không thể tải kết quả.');
                }
            } catch (err) {
                console.error(err);
                setError('Lỗi khi tìm kiếm.');
            } finally {
                setLoading(false);
            }
        };

        handleFiltered();
    }, [q, page, limit]);

    // 👉 Xử lý đổi trang
    const totalPages = Math.ceil(total / limit);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        navigate(`/search?q=${q}&page=${newPage}&limit=${limit}`);
    };

    return (
        <div className="space-y-10">
            <Section title={`🔎 Kết quả tìm kiếm cho: "${q}"`}>
                {loading ? (
                    <Loading context="Đang tải kết quả..." />
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : results.length === 0 ? (
                    <p className="text-center text-gray-500">Không tìm thấy sách nào phù hợp.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {results.map((b, i) => (
                                <BookCard key={i} {...b} />
                            ))}
                        </div>

                        {/* 🔽 Phân trang mũi tên */}
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

export default Search;
