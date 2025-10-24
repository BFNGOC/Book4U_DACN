import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../data/products';

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

function SearchBar() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef(null);

    // Lọc sản phẩm
    const handleFiltered = () => {
        const term = removeVietnameseTones(searchTerm.trim().toLowerCase());
        if (term === '') {
            setResults([]);
            return;
        }

        const filtered = products.filter((p) => {
            const title = removeVietnameseTones(p.title.toLowerCase());
            const author = removeVietnameseTones(p.author.toLowerCase());
            const tags = p.tags.map((t) => removeVietnameseTones(t.toLowerCase()));
            return (
                title.includes(term) ||
                author.includes(term) ||
                tags.some((tag) => tag.includes(term))
            );
        });

        setResults(filtered);
    };

    useEffect(() => {
        handleFiltered();
    }, [searchTerm]);

    // Click ra ngoài thì ẩn dropdown
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

            {/* Dropdown kết quả */}
            {showResults && (
                <div className="absolute left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg max-h-80 overflow-y-auto z-50 text-left">
                    {results.length > 0 ? (
                        <>
                            {results.slice(0, 5).map((book, index) => (
                                <Link
                                    to={`/product/${book.slug}`}
                                    key={index}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                                >
                                    <img
                                        src={book.images[0]}
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
                            <Link
                                to={`/search?keyword=${encodeURIComponent(searchTerm)}`}
                                className="block text-center py-2 text-blue-600 hover:bg-blue-50 font-medium"
                            >
                                🔍 Xem tất cả kết quả cho “{searchTerm}”
                            </Link>
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
