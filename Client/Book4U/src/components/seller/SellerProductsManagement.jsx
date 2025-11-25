import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/userContext';
import { getSellerProducts } from '../../services/api/sellerApi';
import { createBook, updateBook, deleteBook } from '../../services/api/bookApi';
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    Search,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import API_URL from '../../configs/api';
import ProductModal from './ProductModal';

function SellerProductsManagement() {
    const { user } = useUser();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [sortBy, setSortBy] = useState('latest');
    const [sortOrder, setSortOrder] = useState('desc');

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

    const filteredAndSortedProducts = products
        .filter(
            (product) =>
                product.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                product.author.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let compareValue = 0;
            switch (sortBy) {
                case 'price':
                    compareValue = a.price - b.price;
                    break;
                case 'stock':
                    compareValue = a.stock - b.stock;
                    break;
                case 'rating':
                    compareValue = (a.ratingAvg || 0) - (b.ratingAvg || 0);
                    break;
                case 'latest':
                default:
                    compareValue =
                        new Date(b.createdAt) - new Date(a.createdAt);
            }
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

    const handleCreateProduct = async (formData) => {
        try {
            const res = await createBook(formData);
            if (res.success) {
                fetchProducts();
                setIsModalOpen(false);
                alert('Tạo sản phẩm thành công!');
            }
        } catch (err) {
            console.error('Lỗi:', err);
            alert('Có lỗi xảy ra khi tạo sản phẩm');
        }
    };

    const handleUpdateProduct = async (formData) => {
        if (!editingProduct) return;
        try {
            const res = await updateBook(editingProduct._id, formData);
            if (res.success) {
                fetchProducts();
                setIsModalOpen(false);
                setEditingProduct(null);
                alert('Cập nhật sản phẩm thành công!');
            }
        } catch (err) {
            console.error('Lỗi:', err);
            alert('Có lỗi xảy ra khi cập nhật sản phẩm');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
        try {
            const res = await deleteBook(productId);
            if (res.success) {
                fetchProducts();
                alert('Xóa sản phẩm thành công!');
            }
        } catch (err) {
            console.error('Lỗi:', err);
            alert('Có lỗi xảy ra khi xóa sản phẩm');
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    if (loading)
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all font-semibold whitespace-nowrap">
                    <Plus className="w-5 h-5" />
                    Thêm sản phẩm
                </button>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-semibold text-gray-700">
                    Sắp xếp:
                </span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="latest">Mới nhất</option>
                    <option value="price">Giá</option>
                    <option value="stock">Tồn kho</option>
                    <option value="rating">Đánh giá</option>
                </select>
                <button
                    onClick={() =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    {sortOrder === 'asc' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                </button>
            </div>

            {/* Products Grid */}
            {filteredAndSortedProducts.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                    <div className="text-gray-400 mb-4">
                        <svg
                            className="w-16 h-16 mx-auto opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                        Không có sản phẩm nào
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAndSortedProducts.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Product Image */}
                                <div className="flex-shrink-0 w-full sm:w-20 h-24 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                                    <img
                                        src={`${API_URL}${product.images?.[0]}`}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="flex-grow">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                                                {product.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {product.author}
                                            </p>
                                        </div>
                                        {product.discount > 0 && (
                                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                                                -{product.discount}%
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Giá
                                            </p>
                                            <p className="font-bold text-blue-600">
                                                {product.price.toLocaleString()}
                                                ₫
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Tồn kho
                                            </p>
                                            <div
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    product.stock > 10
                                                        ? 'bg-green-100 text-green-800'
                                                        : product.stock > 0
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                {product.stock}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Đã bán
                                            </p>
                                            <p className="font-bold text-gray-900">
                                                {product.soldCount || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Đánh giá
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-gray-900">
                                                    ⭐{' '}
                                                    {(
                                                        product.ratingAvg || 0
                                                    ).toFixed(1)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({product.ratingCount || 0})
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Ngôn ngữ
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {product.language}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex sm:flex-col gap-2 justify-end">
                                    <button
                                        className="p-2.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors border border-blue-200"
                                        title="Xem chi tiết">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(product)}
                                        className="p-2.5 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors border border-amber-200"
                                        title="Chỉnh sửa">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteProduct(product._id)
                                        }
                                        className="p-2.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors border border-red-200"
                                        title="Xóa">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                }}
                product={editingProduct}
                onSubmit={
                    editingProduct ? handleUpdateProduct : handleCreateProduct
                }
            />
        </div>
    );
}

export default SellerProductsManagement;
