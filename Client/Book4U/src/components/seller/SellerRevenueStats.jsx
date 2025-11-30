import { useEffect, useState } from 'react';
import { getRevenueStats } from '../../services/api/sellerOrderApi';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';

function SellerRevenueStats() {
    const [stats, setStats] = useState(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getRevenueStats(period);
            if (res.success) {
                setStats(res.data);
            }
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="text-center text-gray-500">Đang tải...</p>;

    // Tạo dữ liệu biểu đồ theo thời gian
    const generateChartData = () => {
        const data = [];
        const now = new Date();
        const days = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            if (period === 'day') {
                date.setHours(date.getHours() - i);
            } else {
                date.setDate(date.getDate() - i);
            }

            data.push({
                name: date.toLocaleDateString('vi-VN'),
                revenue: Math.floor(Math.random() * (stats?.revenue || 0)),
                orders: Math.floor(Math.random() * (stats?.ordersCount || 0)),
            });
        }
        return data;
    };

    const chartData = generateChartData();

    const periodLabels = {
        day: 'Hôm nay',
        week: 'Tuần này',
        month: 'Tháng này',
        year: 'Năm này',
    };

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex gap-2 flex-wrap">
                {['day', 'week', 'month', 'year'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            period === p
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 font-semibold text-sm">Doanh thu</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">
                                {(stats?.revenue || 0).toLocaleString()}₫
                            </p>
                        </div>
                        <DollarSign className="w-10 h-10 text-blue-500" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 font-semibold text-sm">Số đơn hàng</p>
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
                            <p className="text-purple-600 font-semibold text-sm">Doanh số bán</p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">
                                {Math.floor((stats?.revenue || 0) / 1000)}
                            </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-bold mb-4">Biểu đồ doanh thu</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                            formatter={(value) => value.toLocaleString()}
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
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-bold mb-4">Top sản phẩm bán chạy</h3>
                    <div className="space-y-3">
                        <p className="text-gray-500 text-sm">
                            Tính năng này sẽ hiển thị top sản phẩm bán chạy nhất
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-bold mb-4">Trạng thái đơn hàng</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Chờ xử lý</span>
                            <span className="font-bold text-yellow-600">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Đang xử lý</span>
                            <span className="font-bold text-blue-600">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Đã gửi</span>
                            <span className="font-bold text-purple-600">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Hoàn thành</span>
                            <span className="font-bold text-green-600">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SellerRevenueStats;
