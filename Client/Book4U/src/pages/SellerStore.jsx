import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Clock } from 'lucide-react';
import { getSellerStore, getSellerProducts } from '../services/api/sellerApi';
import Loading from '../components/common/Loading';
import API_URL from '../configs/api';

function SellerStore() {
    const { sellerId } = useParams();
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
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
    }, [sellerId]);

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
    if (error)
        return (
            <p className="text-center text-red-500 mt-10 font-medium">
                {error}
            </p>
        );
    if (!seller)
        return (
            <p className="text-center mt-10 text-gray-500">
                Không tìm thấy cửa hàng.
            </p>
        );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header Cửa hàng */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {/* Logo */}
                        <div className="flex justify-center md:justify-start">
                            <img
                                src={`${API_URL}${seller.storeLogo}`}
                                alt={seller.storeName}
                                className="w-40 h-40 object-cover rounded-lg shadow-sm"
                            />
                        </div>

                        {/* Thông tin cửa hàng */}
                        <div className="md:col-span-2">
                            <h1 className="text-3xl font-bold mb-4">
                                {seller.storeName}
                            </h1>
                            <p className="text-gray-600 mb-6">
                                {seller.storeDescription}
                            </p>

                            <div className="space-y-3">
                                {/* Rating */}
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">
                                        {seller.rating?.toFixed(1)} / 5.0
                                    </span>
                                </div>

                                {/* Địa chỉ */}
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                                    <div className="text-gray-600">
                                        <p>
                                            {seller.businessAddress?.street},{' '}
                                            {seller.businessAddress?.ward},{' '}
                                            {seller.businessAddress?.district},{' '}
                                            {seller.businessAddress?.province}
                                        </p>
                                    </div>
                                </div>

                                {/* Thống kê */}
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-gray-600 text-sm">
                                            Doanh số bán
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {seller.totalSales || 0}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-gray-600 text-sm">
                                            Tổng doanh thu
                                        </p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {(
                                                seller.totalSales * 1000
                                            )?.toLocaleString()}
                                            ₫
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">
                        Sản phẩm của cửa hàng
                    </h2>

                    {products.length === 0 ? (
                        <div className="bg-white rounded-lg p-8 text-center">
                            <p className="text-gray-500">
                                Cửa hàng chưa có sản phẩm.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map((product) => {
                                    const discountedPrice = product.discount
                                        ? product.price *
                                          (1 - product.discount / 100)
                                        : product.price;

                                    return (
                                        <Link
                                            to={`/product/${product.slug}`}
                                            key={product._id}
                                            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                            <div className="relative overflow-hidden bg-gray-100 h-48">
                                                <img
                                                    src={`${API_URL}${product.images?.[0]}`}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                {product.discount > 0 && (
                                                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                        -{product.discount}%
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                                                    {product.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mb-3">
                                                    {product.author}
                                                </p>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm font-semibold">
                                                        {product.ratingAvg?.toFixed(
                                                            1
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {discountedPrice.toLocaleString()}
                                                        ₫
                                                    </span>
                                                    {product.discount > 0 && (
                                                        <span className="text-sm line-through text-gray-400">
                                                            {product.price.toLocaleString()}
                                                            ₫
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {pagination &&
                                pagination.current < pagination.pages && (
                                    <div className="text-center mt-8">
                                        <button
                                            onClick={handleLoadMore}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
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
