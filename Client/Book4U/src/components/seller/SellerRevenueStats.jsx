import { useEffect, useState } from 'react';
import {
    getRevenueStats,
    getTopProducts,
    getRevenueBreakdown,
} from '../../services/api/sellerOrderApi';
import API_URL from '../../configs/api.js';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    Calendar,
} from 'lucide-react';

function SellerRevenueStats() {
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [period, setPeriod] = useState('month');
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        fetchStats();
    }, [period, selectedMonth, selectedYear]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch revenue stats
            const statsRes = await getRevenueStats(
                period,
                period === 'month' ? selectedMonth : undefined,
                period === 'month' ? selectedYear : undefined
            );

            if (statsRes.success) {
                setStats(statsRes.data);
            }

            // ✅ Fetch actual breakdown data
            const breakdownRes = await getRevenueBreakdown(
                period,
                period === 'month' ? selectedMonth : undefined,
                period === 'month' ? selectedYear : undefined
            );

            if (breakdownRes.success) {
                setChartData(breakdownRes.data.chartData || []);
            }

            // Fetch top products
            const productsRes = await getTopProducts(
                period,
                period === 'month' ? selectedMonth : undefined,
                period === 'month' ? selectedYear : undefined,
                10
            );

            if (productsRes.success) {
                setTopProducts(productsRes.data.products || []);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    if (loading)
        return <p className="text-center text-gray-500">Đang tải...</p>;

    const periodLabels = {
        day: 'Hôm nay',
        week: 'Tuần này',
        month: 'Tháng này',
        year: 'Năm này',
    };

    // Generate months list
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - i
    );

    return (
        <div className="space-y-6">
            {/* Period & Month/Year Selector */}
            <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                    {['day', 'week', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                period === p
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}>
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>

                {/* Month/Year picker for month view */}
                {period === 'month' && (
                    <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <select
                            value={selectedMonth}
                            onChange={(e) =>
                                setSelectedMonth(parseInt(e.target.value))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                            {months.map((m) => (
                                <option key={m} value={m}>
                                    Tháng {m}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(parseInt(e.target.value))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 font-semibold text-sm">
                                Doanh thu
                            </p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">
                                {formatPrice(stats?.revenue || 0)}
                            </p>
                        </div>
                        <DollarSign className="w-10 h-10 text-blue-500" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 font-semibold text-sm">
                                Số đơn hàng
                            </p>
                            <p className="text-3xl font-bold text-green-900 mt-2">
                                {stats?.ordersCount || 0}
                            </p>
                        </div>
                        <ShoppingCart className="w-10 h-10 text-green-500" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-600 font-semibold text-sm">
                                AOV (Giá trung bình)
                            </p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">
                                {formatPrice(
                                    stats?.ordersCount > 0
                                        ? Math.floor(
                                              stats.revenue / stats.ordersCount
                                          )
                                        : 0
                                )}
                            </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4">Biểu đồ doanh thu</h3>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={chartData.map((item) => {
                                // Format tên theo period
                                let name = '';
                                if (period === 'day') {
                                    name = item.hour;
                                } else if (period === 'week') {
                                    name = item.day;
                                } else if (period === 'month') {
                                    name = `${item.date}/${selectedMonth}`;
                                } else {
                                    name = `T${item.month}`;
                                }
                                return {
                                    name,
                                    revenue: item.revenue,
                                    orders: item.orders,
                                };
                            })}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                                formatter={(value) =>
                                    typeof value === 'number'
                                        ? value.toLocaleString()
                                        : value
                                }
                                labelFormatter={(label) => `${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                name="Doanh thu (₫)"
                            />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', r: 4 }}
                                name="Số đơn hàng"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        Không có dữ liệu để hiển thị
                    </p>
                )}
            </div>

            {/* Top Products Section */}
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6 text-amber-600" />
                        Sản phẩm bán chạy nhất
                    </h2>
                    <span className="text-sm text-gray-600">
                        {topProducts.length} sản phẩm
                    </span>
                </div>

                {topProducts.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top 3 Featured */}
                        {topProducts.slice(0, 3).map((product, idx) => (
                            <div
                                key={product.bookId}
                                className={`relative bg-gradient-to-br rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                                    idx === 0
                                        ? 'from-amber-50 to-orange-100 border-amber-300 shadow-lg'
                                        : idx === 1
                                        ? 'from-gray-50 to-slate-100 border-gray-300'
                                        : 'from-orange-50 to-yellow-100 border-orange-300'
                                }`}>
                                {/* Rank Badge */}
                                <div
                                    className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                        idx === 0
                                            ? 'bg-amber-500'
                                            : idx === 1
                                            ? 'bg-gray-400'
                                            : 'bg-orange-500'
                                    }`}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                </div>

                                {/* Product Image */}
                                <div className="h-40 bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {product.image ? (
                                        <img
                                            src={`${API_URL}${product.image}`}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-4 space-y-3">
                                    <p className="font-bold text-sm line-clamp-2 text-gray-900">
                                        {product.title}
                                    </p>

                                    {/* Metrics */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">
                                                Số lượng bán:
                                            </span>
                                            <span className="font-bold text-blue-600 text-sm">
                                                {product.quantity} cái
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">
                                                Đơn hàng:
                                            </span>
                                            <span className="font-bold text-green-600 text-sm">
                                                {product.orders}
                                            </span>
                                        </div>
                                        <div className="border-t pt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-600 font-semibold">
                                                Doanh thu:
                                            </span>
                                            <span className="font-bold text-amber-600">
                                                {formatPrice(product.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                            Không có dữ liệu bán hàng trong khoảng thời gian này
                        </p>
                    </div>
                )}

                {/* All Products Table */}
                {topProducts.length > 3 && (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                            Xếp hạng
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                            Sản phẩm
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                            Số lượng
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                            Đơn hàng
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                            Doanh thu
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {topProducts
                                        .slice(3)
                                        .map((product, idx) => (
                                            <tr
                                                key={product.bookId}
                                                className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                                                        {idx + 4}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {product.image && (
                                                            <img
                                                                src={`${API_URL}${product.image}`}
                                                                alt={
                                                                    product.title
                                                                }
                                                                className="w-8 h-10 object-cover rounded"
                                                            />
                                                        )}
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                            {product.title}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-blue-600">
                                                        {product.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {product.orders}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatPrice(
                                                            product.revenue
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Top 5 Bar Chart */}
                {topProducts.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border">
                        <h3 className="text-lg font-bold mb-4">
                            Biểu đồ so sánh Top 5 sản phẩm
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={topProducts.slice(0, 5).map((p, idx) => ({
                                    rank: `#${idx + 1}`,
                                    name:
                                        p.title.substring(0, 20) +
                                        (p.title.length > 20 ? '...' : ''),
                                    quantity: p.quantity,
                                    revenue: p.revenue,
                                }))}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />
                                <XAxis dataKey="rank" tick={{ fontSize: 11 }} />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 11 }}
                                    label={{
                                        value: 'Số lượng',
                                        angle: -90,
                                        position: 'insideLeft',
                                    }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 11 }}
                                    label={{
                                        value: 'Doanh thu (₫)',
                                        angle: 90,
                                        position: 'insideRight',
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value) =>
                                        typeof value === 'number'
                                            ? value.toLocaleString()
                                            : value
                                    }
                                />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="quantity"
                                    fill="#3b82f6"
                                    name="Số lượng bán"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="revenue"
                                    fill="#10b981"
                                    name="Doanh thu"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SellerRevenueStats;
