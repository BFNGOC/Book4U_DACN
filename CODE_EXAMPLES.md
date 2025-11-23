# 💡 Ví Dụ Sử Dụng & Code Samples

## 📍 Mục Đích

File này cung cấp các ví dụ code cụ thể để bạn hiểu cách các components hoạt động.

---

## 1️⃣ SellerStore Page (Public)

### Ví Dụ: Xem Cửa Hàng

```jsx
// URL: http://localhost:5173/seller/507f1f77bcf86cd799439011

import { useParams } from 'react-router-dom';
import { getSellerStore, getSellerProducts } from '../services/api/sellerApi';

function SellerStore() {
    const { sellerId } = useParams(); // Lấy sellerId từ URL

    useEffect(() => {
        // Gọi API lấy thông tin cửa hàng
        const sellerRes = await getSellerStore(sellerId);
        // Response:
        // {
        //   success: true,
        //   data: {
        //     storeName: "Cửa hàng sách XYZ",
        //     storeLogo: "/uploads/logo.png",
        //     rating: 4.5,
        //     totalSales: 1000,
        //     businessAddress: {...}
        //   }
        // }

        // Gọi API lấy sản phẩm
        const productsRes = await getSellerProducts(sellerId, {
            page: 1,
            limit: 12
        });
        // Response:
        // {
        //   success: true,
        //   data: [
        //     {
        //       _id: "...",
        //       title: "Sách A",
        //       price: 100000,
        //       images: [...],
        //       ratingAvg: 4.2
        //     }
        //   ],
        //   pagination: { current: 1, pages: 5, total: 50 }
        // }
    }, [sellerId]);
}
```

### API Response Chi Tiết

```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "userId": {
            "_id": "507f1f77bcf86cd799439010",
            "email": "seller@example.com"
        },
        "firstName": "Người",
        "lastName": "Bán",
        "profileType": "seller",
        "storeName": "Cửa hàng sách XYZ",
        "storeLogo": "/uploads/store-logo/logo.png",
        "storeDescription": "Chuyên bán các loại sách...",
        "rating": 4.5,
        "totalSales": 1000,
        "businessAddress": {
            "street": "123 Nguyễn Huệ",
            "ward": "Bến Nghé",
            "district": "1",
            "province": "TP HCM",
            "country": "Vietnam"
        },
        "warehouses": [
            {
                "street": "456 Lê Lợi",
                "ward": "Bến Thành",
                "district": "1",
                "province": "TP HCM",
                "managerName": "Nguyễn Văn A",
                "managerPhone": "0987654321"
            }
        ]
    }
}
```

---

## 2️⃣ SellerDashboard & Components

### Ví Dụ: Dashboard Stats

```jsx
// URL: http://localhost:5173/dashboard/seller

function SellerDashboard() {
    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        // Gọi API lấy dashboard
        const res = await getSellerDashboard();
        // Response:
        // {
        //   success: true,
        //   data: {
        //     seller: { ... },
        //     stats: {
        //       totalProducts: 45,
        //       totalOrders: 123,
        //       totalRevenue: 50000000,
        //       totalSales: 500
        //     }
        //   }
        // }
    }, []);

    return (
        <div>
            <h1>Stats: {dashboard?.stats?.totalProducts} sản phẩm</h1>
        </div>
    );
}
```

---

### Ví Dụ: Quản Lý Đơn Hàng

```jsx
// Component: SellerOrdersManagement.jsx

function SellerOrdersManagement() {
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');

    // Lấy danh sách đơn hàng
    useEffect(() => {
        const res = await getSellerOrders({
            page: 1,
            limit: 10,
            status: statusFilter || undefined
        });
        // Response:
        // {
        //   success: true,
        //   data: [
        //     {
        //       _id: "60d5ec49c1234567890abcde",
        //       profileId: {
        //         firstName: "Khách",
        //         lastName: "Hàng",
        //         primaryPhone: "0123456789"
        //       },
        //       items: [
        //         {
        //           bookId: {
        //             _id: "...",
        //             title: "Sách A",
        //             slug: "sach-a",
        //             images: [...]
        //           },
        //           sellerId: "507f1f77bcf86cd799439011",
        //           quantity: 2,
        //           price: 100000
        //         }
        //       ],
        //       totalAmount: 200000,
        //       status: "pending",
        //       paymentMethod: "COD",
        //       paymentStatus: "unpaid",
        //       shippingAddress: {
        //         fullName: "Khách Hàng",
        //         phone: "0123456789",
        //         address: "123 Nguyễn Huệ, TP HCM"
        //       },
        //       createdAt: "2024-11-23T10:00:00Z"
        //     }
        //   ],
        //   pagination: { current: 1, pages: 5, total: 45 }
        // }
    }, [statusFilter]);

    // Cập nhật trạng thái đơn hàng
    const handleStatusChange = async (orderId, newStatus) => {
        const res = await updateOrderStatus(orderId, newStatus);
        // Request:
        // PUT /api/seller-orders/60d5ec49c1234567890abcde/status
        // { "status": "shipped" }

        // Response:
        // {
        //   success: true,
        //   message: "Cập nhật trạng thái đơn hàng thành công.",
        //   data: { ...order với status mới }
        // }
    };

    return (
        <div>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipped">Đã gửi</option>
                <option value="completed">Hoàn thành</option>
            </select>

            {orders.map(order => (
                <div key={order._id}>
                    <p>#{order._id.slice(-6).toUpperCase()}</p>
                    <p>Khách: {order.profileId.firstName} {order.profileId.lastName}</p>
                    <p>Tiền: {order.totalAmount.toLocaleString()}₫</p>
                    <p>Trạng thái: {order.status}</p>

                    <button onClick={() => handleStatusChange(order._id, 'shipped')}>
                        Cập nhật thành "Đã gửi"
                    </button>
                </div>
            ))}
        </div>
    );
}
```

---

### Ví Dụ: Quản Lý Sản Phẩm

```jsx
// Component: SellerProductsManagement.jsx

function SellerProductsManagement() {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Lấy danh sách sản phẩm
    useEffect(() => {
        const res = await getAllBooks({ page: 1, limit: 10 });
        // Response:
        // {
        //   success: true,
        //   data: [
        //     {
        //       _id: "507f1f77bcf86cd799439012",
        //       title: "Sách Lập Trình Python",
        //       author: "Guido van Rossum",
        //       price: 250000,
        //       discount: 10,
        //       stock: 50,
        //       soldCount: 100,
        //       ratingAvg: 4.7,
        //       ratingCount: 25,
        //       images: ["/uploads/books/python.jpg"],
        //       categoryId: { name: "Lập Trình" }
        //     }
        //   ]
        // }
    }, []);

    // Tìm kiếm sản phẩm
    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <table>
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Tồn kho</th>
                        <th>Đã bán</th>
                        <th>Đánh giá</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map(product => (
                        <tr key={product._id}>
                            <td>{product.title}</td>
                            <td>{product.price.toLocaleString()}₫</td>
                            <td>{product.stock}</td>
                            <td>{product.soldCount}</td>
                            <td>⭐ {product.ratingAvg?.toFixed(1)}</td>
                            <td>
                                <button>Xem</button>
                                <button>Sửa</button>
                                <button>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

---

### Ví Dụ: Thống Kê Doanh Thu

```jsx
// Component: SellerRevenueStats.jsx

function SellerRevenueStats() {
    const [stats, setStats] = useState(null);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        // Lấy thống kê theo thời gian
        const res = await getRevenueStats(period);
        // Request: GET /api/seller-orders/stats/revenue?period=month

        // Response:
        // {
        //   success: true,
        //   data: {
        //     period: "month",
        //     revenue: 15000000,        // 15 triệu đồng
        //     ordersCount: 45,           // 45 đơn hàng
        //     soldCount: 150             // 150 sản phẩm bán được
        //   }
        // }
    }, [period]);

    return (
        <div>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="day">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm này</option>
            </select>

            <div className="stats-card">
                <h3>Doanh thu</h3>
                <p>{stats?.revenue?.toLocaleString()}₫</p>
            </div>

            <div className="stats-card">
                <h3>Số đơn hàng</h3>
                <p>{stats?.ordersCount}</p>
            </div>

            <LineChart data={generateChartData(stats)}>
                {/* Biểu đồ doanh thu */}
            </LineChart>
        </div>
    );
}
```

---

## 3️⃣ API Services Usage

### sellerApi.js

```javascript
// Lấy thông tin cửa hàng
import { getSellerStore, getSellerProducts } from '../services/api/sellerApi';

// Public
const sellerInfo = await getSellerStore('507f1f77bcf86cd799439011');
const products = await getSellerProducts('507f1f77bcf86cd799439011', {
    page: 1,
    limit: 12,
});

// Private (cần token)
const dashboard = await getSellerDashboard();
const stats = await getSellerStats('month');
const updated = await updateSellerProfile({
    storeName: 'Cửa hàng mới',
    storeDescription: 'Mô tả mới',
});
```

### sellerOrderApi.js

```javascript
import {
    getSellerOrders,
    getSellerOrderDetail,
    updateOrderStatus,
    getRevenueStats,
} from '../services/api/sellerOrderApi';

// Lấy danh sách đơn hàng
const orders = await getSellerOrders({
    page: 1,
    limit: 10,
    status: 'pending',
});

// Lấy chi tiết đơn hàng
const order = await getSellerOrderDetail('60d5ec49c1234567890abcde');

// Cập nhật trạng thái
const result = await updateOrderStatus('60d5ec49c1234567890abcde', 'shipped');

// Thống kê doanh thu
const revenue = await getRevenueStats('month');
```

---

## 4️⃣ Routes Usage

### Frontend Routes

```jsx
// Tất cả routes trong: src/routes/index.jsx

// Public route - Xem cửa hàng
<Route path="/seller/:sellerId" element={<SellerStore />} />

// Private route - Dashboard seller
<Route
  path="/dashboard/seller"
  element={
    <PrivateRoute>
      <SellerDashboard />
    </PrivateRoute>
  }
/>

// Navigation example
import { Link, useNavigate } from 'react-router-dom';

// Link đến cửa hàng
<Link to={`/seller/${sellerId}`}>Xem cửa hàng</Link>

// Navigate bằng code
const navigate = useNavigate();
navigate('/dashboard/seller');
```

### Backend Routes

```javascript
// server.js
const express = require('express');
const route = require('./src/routes');

const app = express();
route(app);

// Trong routes/index.js
app.use('/api/sellers', sellerRoutes);
app.use('/api/seller-orders', orderSellerRoutes);

// Endpoints:
GET    /api/sellers/:sellerId
GET    /api/sellers/:sellerId/products
GET    /api/sellers/dashboard/info          (auth)
GET    /api/sellers/dashboard/stats         (auth)
PUT    /api/sellers/profile/update          (auth)

GET    /api/seller-orders                   (auth)
GET    /api/seller-orders/:orderId          (auth)
PUT    /api/seller-orders/:orderId/status   (auth)
GET    /api/seller-orders/stats/revenue     (auth)
```

---

## 5️⃣ Data Flow Examples

### Flow 1: Xem Cửa Hàng

```
User clicks /seller/:sellerId
  ↓
SellerStore.jsx loads
  ↓
useEffect runs getSellerStore(sellerId)
  ↓
sellerApi.js → axiosPublic.get('/api/sellers/:sellerId')
  ↓
Backend: sellerController.getSellerStore()
  ↓
Response: { success, data: { storeName, storeLogo, ... } }
  ↓
setState(seller)
  ↓
Render: hiển thị logo, tên, mô tả, rating
```

### Flow 2: Cập Nhật Trạng Thái Đơn Hàng

```
Seller click button "Cập nhật thành Shipped"
  ↓
handleStatusChange(orderId, 'shipped')
  ↓
updateOrderStatus(orderId, 'shipped')
  ↓
sellerOrderApi.js → axiosPrivate.put(
    `/api/seller-orders/${orderId}/status`,
    { status: 'shipped' }
)
  ↓
Backend: orderSellerController.updateOrderStatus()
  ↓
Kiểm tra quyền truy cập (user.id phải là owner)
  ↓
order.status = 'shipped'
  ↓
response: { success, data: updatedOrder }
  ↓
Update local state: orders[index].status = 'shipped'
  ↓
Render: cập nhật giao diện
```

### Flow 3: Lấy Thống Kê Doanh Thu

```
Seller select "Tháng này"
  ↓
setPeriod('month')
  ↓
useEffect runs getRevenueStats('month')
  ↓
sellerOrderApi.js → axiosPrivate.get(
    `/api/seller-orders/stats/revenue?period=month`
)
  ↓
Backend: orderSellerController.getRevenueStats()
  ↓
Query:
  - Lấy tất cả books của seller
  - Find orders chứa books của seller
  - Filter by createdAt >= startDate
  - Sum totalAmount
  ↓
response: { revenue: 15000000, ordersCount: 45, ... }
  ↓
setState(stats)
  ↓
Render: thẻ stats + biểu đồ với dữ liệu mới
```

---

## 6️⃣ Error Handling

### Ví Dụ Xử Lý Lỗi

```jsx
// sellerApi.js có sẵn error handling

// Nếu có lỗi:
const res = await getSellerStore(sellerId);

if (res.success) {
    // Thành công
    setSeller(res.data);
} else {
    // Lỗi
    setError(res.message);
    console.error(res);
}

// Ví dụ trong component:
try {
    const res = await getSellerOrders({
        page: 1,
        limit: 10,
        status: statusFilter,
    });

    if (res.success) {
        setOrders(res.data);
        setPagination(res.pagination);
    } else {
        setError('Lỗi khi lấy danh sách đơn hàng');
    }
} catch (err) {
    console.error('Lỗi:', err);
    setError('Lỗi kết nối');
}
```

---

## 7️⃣ Common Patterns

### Pattern 1: Pagination

```jsx
const [page, setPage] = useState(1);

useEffect(() => {
    fetchOrders({ page, limit: 10 });
}, [page]);

// Trong render:
<button onClick={() => setPage(page - 1)} disabled={page === 1}>
    Trước
</button>;

{
    [...Array(pagination.pages)].map((_, i) => (
        <button
            key={i + 1}
            onClick={() => setPage(i + 1)}
            className={page === i + 1 ? 'active' : ''}>
            {i + 1}
        </button>
    ));
}

<button onClick={() => setPage(page + 1)} disabled={page === pagination.pages}>
    Sau
</button>;
```

### Pattern 2: Search & Filter

```jsx
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('');

const filteredOrders = orders.filter((order) => {
    const matchSearch =
        searchTerm === '' ||
        order._id.includes(searchTerm) ||
        order.profileId.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === '' || order.status === statusFilter;

    return matchSearch && matchStatus;
});
```

### Pattern 3: Modal / Expand

```jsx
const [expandedOrder, setExpandedOrder] = useState(null);

// Toggle expand
const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
};

// Render
{
    orders.map((order) => (
        <div key={order._id}>
            <button onClick={() => toggleExpand(order._id)}>{order._id}</button>

            {expandedOrder === order._id && (
                <div>{/* Chi tiết đơn hàng */}</div>
            )}
        </div>
    ));
}
```

---

## 🎯 Summary

Với các ví dụ trên, bạn có thể:

-   ✅ Hiểu cách các components hoạt động
-   ✅ Biết cách gọi API
-   ✅ Xử lý response và error
-   ✅ Implement pagination, search, filter
-   ✅ Cập nhật dữ liệu khi user thực hiện hành động

**Happy coding! 🚀**
