import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { suggestBooks } from '../../services/api/searchApi';
import Loading from './Loading';
import API_URL from '../../configs/api';

function SearchBar() {
    const [searchTerm, setSearchTerm] = useState(() => {
        // 🔁 Lấy từ localStorage khi component mount
        return localStorage.getItem('searchTerm') || '';
    });
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isAllResults, setIsAllResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // 🔎 Gọi API gợi ý
    const handleFiltered = async () => {
        if (!searchTerm.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const result = await suggestBooks({ q: searchTerm });

        if (result.success) {
            setResults(result.data);
            setIsAllResults(result.meta?.total > 5);
        } else {
            console.error(result.message);
        }

        setLoading(false);
    };

    // 🕐 Debounce 500ms khi nhập
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            handleFiltered();
            localStorage.setItem('searchTerm', searchTerm);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // 🖱️ Click ra ngoài thì ẩn dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md">
            {/* 🔍 Ô nhập */}
            <div className="flex items-center border rounded-full overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400">
                <input
                    type="text"
                    value={searchTerm}
                    placeholder="Tìm kiếm sách..."
                    className="flex-1 px-4 py-2 outline-none bg-transparent text-sm"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowResults(true)}
                />
                <button
                    onClick={() => setShowResults(true)}
                    className="px-3 text-lg text-gray-600 hover:text-blue-600 transition"
                >
                    🔍
                </button>
            </div>

            {/* 📦 Dropdown kết quả */}
            {showResults && (
                <div className="absolute left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg max-h-96 overflow-y-auto z-50 text-left">
                    {loading ? (
                        <Loading context="Đang tìm kiếm..." />
                    ) : results.length > 0 ? (
                        <>
                            {results.map((book, index) => (
                                <Link
                                    to={`/book/${book.slug}`}
                                    key={index}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                                >
                                    <img
                                        src={`${API_URL}${book.images[0]}`}
                                        alt={book.title}
                                        className="w-10 h-14 object-cover rounded-md border"
                                    />
                                    <div className="overflow-hidden">
                                        <h4 className="font-semibold text-gray-800 truncate">
                                            {book.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 truncate">
                                            {book.author}
                                        </p>
                                        <p className="text-sm text-blue-600 font-semibold">
                                            {book.price.toLocaleString('vi-VN')}₫
                                        </p>
                                    </div>
                                </Link>
                            ))}

                            {/* Nút xem tất cả */}
                            {isAllResults && (
                                <Link
                                    to={`/search?q=${encodeURIComponent(
                                        searchTerm
                                    )}&page=1&limit=10`}
                                    className="block text-center py-2 text-blue-600 hover:bg-blue-50 font-medium"
                                >
                                    🔍 Xem tất cả kết quả cho “{searchTerm}”
                                </Link>
                            )}
                        </>
                    ) : searchTerm.trim() ? (
                        <div className="py-3 text-center text-gray-500 text-sm">
                            Không tìm thấy kết quả nào.
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

export default SearchBar;
