import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { useUser } from '../../contexts/userContext';
import { getSellerStore, getSellerProducts } from '../../services/api/sellerApi';
import Loading from '../../components/common/Loading';
import API_URL from '../../configs/api';

function SellerStore() {
    const { sellerId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        // Kiểm tra nếu sellerId là của user hiện tại thì chuyển hướng đến dashboard
        // if (user?._id === sellerId) {
        //     navigate('/dashboard/seller', { replace: true });
        //     return;
        // }

        const fetchSellerData = async () => {
            try {
                setLoading(true);
                const [sellerRes, productsRes] = await Promise.all([
                    getSellerStore(sellerId),
                    getSellerProducts(sellerId, { page: 1, limit: 12 }),
                ]);

                if (sellerRes.success) {
                    setSeller(sellerRes.data);
                }
                if (productsRes.success) {
                    setProducts(productsRes.data);
                    setPagination(productsRes.pagination);
                }
            } catch (err) {
                console.error('Lỗi:', err);
                setError('Không thể tải thông tin cửa hàng.');
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, [sellerId, user?._id, navigate]);

    const handleLoadMore = async () => {
        try {
            const nextPage = page + 1;
            const res = await getSellerProducts(sellerId, {
                page: nextPage,
                limit: 12,
            });
            if (res.success) {
                setProducts([...products, ...res.data]);
                setPagination(res.pagination);
                setPage(nextPage);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        }
    };

    if (loading) return <Loading context="Đang tải thông tin cửa hàng..." />;
    if (error) return <p className="text-center text-red-500 mt-10 font-medium">{error}</p>;
    if (!seller) return <p className="text-center mt-10 text-gray-500">Không tìm thấy cửa hàng.</p>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-12 z-40 shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Logo */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={`${API_URL}${seller.storeLogo}`}
                                alt={seller.storeName}
                                className="w-24 h-24 object-cover rounded-xl shadow-xl border-4 border-white"
                            />
                        </div>

                        {/* Thông tin cửa hàng */}
                        <div className="flex-grow">
                            <h1 className="text-4xl font-bold mb-2">{seller.storeName}</h1>

                            {/* Mô tả cửa hàng */}
                            {seller.storeDescription && (
                                <p className="text-blue-100 text-sm mb-4 line-clamp-2">
                                    {seller.storeDescription}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-6 mt-4">
                                {/* Rating */}
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${
                                                    i < Math.floor(seller.rating || 0)
                                                        ? 'fill-yellow-300 text-yellow-300'
                                                        : 'text-white/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-sm">
                                        {(seller.rating || 0).toFixed(1)}
                                    </span>
                                </div>

                                {/* Địa chỉ */}
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">
                                        {seller.businessAddress?.province}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div>
                    <h2 className="text-3xl font-bold mb-8 text-gray-900">Danh sách sản phẩm</h2>

                    {products.length === 0 ? (
                        <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                            <div className="text-gray-400 mb-4">
                                <svg
                                    className="w-16 h-16 mx-auto opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg font-medium">
                                Cửa hàng chưa có sản phẩm
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {products.map((product) => {
                                    const discountedPrice = product.discount
                                        ? product.price * (1 - product.discount / 100)
                                        : product.price;

                                    return (
                                        <Link
                                            to={`/book/${product.slug}`}
                                            key={product._id}
                                            className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-40">
                                                <img
                                                    src={`${API_URL}${product.images?.[0]}`}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                {product.discount > 0 && (
                                                    <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                                                        -{product.discount}%
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3">
                                                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm h-10">
                                                    {product.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                                                    {product.author}
                                                </p>

                                                <div className="flex items-center gap-1 mb-3">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3 h-3 ${
                                                                    i <
                                                                    Math.floor(
                                                                        product.ratingAvg || 0
                                                                    )
                                                                        ? 'fill-yellow-400 text-yellow-400'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700 ml-1">
                                                        {(product.ratingAvg || 0).toFixed(1)}
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-sm font-bold text-blue-600">
                                                        {discountedPrice.toLocaleString()}₫
                                                    </span>
                                                    {product.discount > 0 && (
                                                        <span className="text-xs line-through text-gray-400">
                                                            {product.price.toLocaleString()}₫
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {pagination && pagination.current < pagination.pages && (
                                <div className="text-center mt-12">
                                    <button
                                        onClick={handleLoadMore}
                                        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all font-semibold"
                                    >
                                        Xem thêm sản phẩm
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SellerStore;
