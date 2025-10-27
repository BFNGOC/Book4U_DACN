import CategoryList from '../components/home/CategoryList';
import Section from '../components/home/Section';
import BookCard from '../components/ui/BookCard.jsx';

import { useEffect, useState } from 'react';
import { getUserRecommendations } from '../services/api/recommendApi.js';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

// Dữ liệu fake (import từ file seed hoặc tạm dán vào)
import { products } from '../data/products';

function Home() {
    const [recommendations, setRecommendations] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await getUserRecommendations();

                if (response.success) {
                    setRecommendations(response.data);
                } else {
                    console.error('❌ Lỗi khi lấy đề xuất:', response.message);
                }
            } catch (error) {
                console.error('⚠️ Lỗi khi gọi API đề xuất:', error);
            }
        };

        fetchRecommendations();
    }, []);

    console.log('Đề xuất người dùng:', recommendations);
    const featuredBooks = products.filter((p) => p.isFeatured);
    const aiSuggested = products.filter((p) => p.rating >= 4.5);

    return (
        <div className="space-y-10">
            <CategoryList />
            <Section title="🤖 Gợi ý từ AI cho bạn" viewAll>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {aiSuggested.map((b, i) => (
                        <BookCard key={i} {...b} />
                    ))}
                </div>
            </Section>
            <Section title="📚 Sách nổi bật trong tháng">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {featuredBooks.map((b, i) => (
                        <BookCard key={i} {...b} />
                    ))}
                </div>
            </Section>

            <Section title="✨ Gợi ý hôm nay">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {recommendations.slice(0, 8).map((b, i) => (
                        <BookCard key={i} {...b} />
                    ))}
                </div>

                {token ? (
                    <div className="flex justify-center mt-6">
                        <Link
                            to="/daily-discover?page=1"
                            className="flex items-center justify-center w-auto gap-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-all"
                        >
                            <span>Xem thêm</span>
                            <FaArrowRight className="text-sm" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex justify-center mt-6">
                        <Link
                            to="/daily-discover?page=1"
                            className="flex items-center justify-center w-auto gap-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-all"
                        >
                            <span>Đăng nhập để nhận được gợi ý cá nhân hóa!</span>
                            <FaArrowRight className="text-sm" />
                        </Link>
                    </div>
                )}
            </Section>
        </div>
    );
}

export default Home;
