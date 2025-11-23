import { useState } from 'react';
import { useUser } from '../../contexts/userContext';
import { getSellerProducts } from '../../services/api/sellerApi';
import { Plus, Edit2, Trash2, Eye, Search } from 'lucide-react';
import API_URL from '../../configs/api';
import { useEffect } from 'react';

function SellerProductsManagement() {
    const { user } = useUser();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (user?._id) {
            fetchProducts();
        }
    }, [page, user?._id]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await getSellerProducts(user._id, { page, limit: 10 });
            if (res.success) {
                setProducts(res.data);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(
        (product) =>
            product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading)
        return <p className="text-center text-gray-500">Đang tải...</p>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="ml-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5" />
                    Thêm sản phẩm
                </button>
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                    Không có sản phẩm nào.
                </p>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                    Sản phẩm
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                    Giá
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                    Tồn kho
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                    Đã bán
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                    Đánh giá
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProducts.map((product) => (
                                <tr
                                    key={product._id}
                                    className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`${API_URL}${product.images?.[0]}`}
                                                alt={product.title}
                                                className="w-12 h-16 object-cover rounded"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {product.title}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {product.author}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-blue-600">
                                        {product.price.toLocaleString()}₫
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                product.stock > 10
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.stock > 0
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">
                                        {product.soldCount}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">
                                        ⭐ {product.ratingAvg?.toFixed(1)} (
                                        {product.ratingCount})
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors">
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SellerProductsManagement;
