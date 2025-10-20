import { useState, useEffect, useRef } from 'react';
import { products } from '../../data/products';
import { Link } from 'react-router-dom';

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

function HeroSection() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const inputRef = useRef(null);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

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

    // Click ra ngoài ẩn dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="text-center bg-white shadow rounded-2xl py-10 relative">
            <h1 className="text-3xl font-bold mb-2">
                Khám phá những cuốn sách tuyệt vời tiếp theo
            </h1>
            <p className="text-gray-500 mb-6">
                Tìm kiếm những cuốn sách truyền cảm hứng, mang đến kiến thức và niềm vui cho bạn
            </p>

            {/* Thanh tìm kiếm */}
            <div ref={inputRef} className="relative max-w-xl mx-auto">
                <div className="flex items-center border rounded-full overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400">
                    <input
                        type="text"
                        value={searchTerm}
                        placeholder="Tìm kiếm sách, tác giả hoặc thể loại..."
                        className="flex-1 px-4 py-2 outline-none bg-transparent"
                        onChange={handleInputChange}
                        onFocus={() => setShowResults(true)}
                    />
                    <button
                        onClick={() => setShowResults(true)}
                        className="px-4 text-xl text-gray-600 hover:text-blue-600 transition"
                    >
                        🔍
                    </button>
                </div>

                {/* Kết quả hiển thị */}
                {showResults && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg max-h-80 overflow-y-auto z-20 text-left">
                        {results.length > 0 ? (
                            results.map((book, index) => (
                                <Link
                                    to={`/product/${book.slug}`}
                                    key={index}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition border-b last:border-b-0"
                                >
                                    <img
                                        src={book.images[0]}
                                        alt={book.title}
                                        className="w-12 h-16 object-cover rounded-md border"
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
                            ))
                        ) : searchTerm.trim() ? (
                            <div className="py-3 text-center text-gray-500 text-sm">
                                Không tìm thấy kết quả nào.
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HeroSection;
