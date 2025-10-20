import { categories } from '../../data/categories';

function CategoryList() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">🏷️ Khám phá theo thể loại</h2>
            <div className="flex flex-wrap gap-3">
                {categories.map((c, i) => (
                    <button
                        key={i}
                        className="px-4 py-2 bg-white shadow-sm border border-gray-100 rounded-xl cursor-pointer hover:bg-blue-50 hover:shadow-md transition"
                    >
                        <span className="mr-1">📖</span>
                        {c.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CategoryList;
