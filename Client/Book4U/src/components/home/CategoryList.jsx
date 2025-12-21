import { categories } from '../../data/categories';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllCategories } from '../../services/api/categoryApi';

function CategoryList() {
    const [categoryList, setCategoryList] = useState([]);
    const [loading, setLoading] = useState(true);

    const categoryEmojis = {
        'tieu-thuyet': '📖',
        'kinh-doanh': '💼',
        'tam-ly-hoc': '🧠',
        'khoa-hoc-vien-tuong': '🚀',
        'van-hoc-viet-nam': '✍️',
        'thieu-nhi': '🎀',
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getAllCategories();
                if (response.success) {
                    setCategoryList(response.data || []);
                } else {
                    console.error('❌ Lỗi khi lấy danh mục:', response.message);
                    setCategoryList(categories); // Fallback to fake data
                }
            } catch (error) {
                console.error('⚠️ Lỗi khi gọi API danh mục:', error);
                setCategoryList(categories); // Fallback to fake data
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-6">🏷️ Khám phá theo thể loại</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-gray-200 rounded-xl p-4 h-32 animate-pulse"
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">🏷️ Khám phá theo thể loại</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categoryList.map((c, i) => (
                    <Link key={i} to={`/category/${c.slug}`} className="group">
                        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-300 h-full flex flex-col justify-center items-center">
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                {categoryEmojis[c.slug] || '📚'}
                            </div>
                            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm md:text-base">
                                {c.name}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default CategoryList;
