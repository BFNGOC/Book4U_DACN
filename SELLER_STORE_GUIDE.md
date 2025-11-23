# 🏪 Hướng Dẫn Trang Thông Tin Người Bán Hàng (Seller Store)

## 📖 Tổng Quan

Dự án Book4U đã được nâng cấp với tính năng trang thông tin người bán hàng hoàn chỉnh, bao gồm:

1. **Trang cửa hàng công khai** (SellerStore) - Khách hàng có thể xem thông tin cửa hàng và danh sách sản phẩm
2. **Bảng điều khiển người bán** (SellerDashboard) - Chủ cửa hàng quản lý đơn hàng, sản phẩm, kho hàng và thống kê doanh thu

---

## 🔧 BACKEND

### Các File Mới Tạo:

#### 1. **sellerController.js**

📁 `Server/src/controllers/sellerController.js`

**Các hàm chính:**

-   `getSellerStore(sellerId)` - Lấy thông tin cửa hàng (public)
-   `getSellerProducts(sellerId)` - Lấy danh sách sản phẩm của cửa hàng
-   `getSellerDashboard()` - Lấy dashboard info (private, chỉ owner)
-   `updateSellerProfile()` - Cập nhật thông tin cửa hàng
-   `getSellerStats(period)` - Lấy thống kê theo thời gian

#### 2. **orderSellerController.js**

📁 `Server/src/controllers/orderSellerController.js`

**Các hàm chính:**

-   `getSellerOrders(page, status)` - Danh sách đơn hàng của seller
-   `getSellerOrderDetail(orderId)` - Chi tiết đơn hàng
-   `updateOrderStatus(orderId, status)` - Cập nhật trạng thái đơn hàng
-   `getRevenueStats(period)` - Thống kê doanh thu

#### 3. **sellerRoutes.js**

📁 `Server/src/routes/sellerRoutes.js`

```javascript
// Public routes
GET  /api/sellers/:sellerId                    // Xem thông tin cửa hàng
GET  /api/sellers/:sellerId/products          // Xem sản phẩm của cửa hàng

// Private routes (seller only)
GET  /api/sellers/dashboard/info              // Lấy thông tin dashboard
GET  /api/sellers/dashboard/stats             // Lấy thống kê
PUT  /api/sellers/profile/update              // Cập nhật profile
```

#### 4. **orderSellerRoutes.js**

📁 `Server/src/routes/orderSellerRoutes.js`

```javascript
// Private routes (seller only)
GET    /api/seller-orders                     // Danh sách đơn hàng
GET    /api/seller-orders/:orderId            // Chi tiết đơn hàng
PUT    /api/seller-orders/:orderId/status     // Cập nhật trạng thái
GET    /api/seller-orders/stats/revenue       // Thống kê doanh thu
```

### Cập Nhật Models:

#### **orderModel.js** - Thêm sellerId

```javascript
const orderItemSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }, // ← MỚI
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
});
```

---

## 💻 FRONTEND

### Các File Mới Tạo:

#### 1. **Pages**

##### **SellerStore.jsx** (Public View)

📁 `Client/Book4U/src/pages/SellerStore.jsx`

-   Hiển thị thông tin cửa hàng (logo, tên, mô tả)
-   Hiển thị địa chỉ, rating, doanh số bán
-   Danh sách sản phẩm của cửa hàng (phân trang)
-   Có thể click vào sản phẩm để xem chi tiết

**Route:** `/seller/:sellerId`

##### **SellerDashboard.jsx** (Private - Owner Only)

📁 `Client/Book4U/src/pages/SellerDashboard.jsx`

-   4 tab chính:
    1. **Tổng quan** - Thống kê doanh thu với biểu đồ
    2. **Quản lý đơn hàng** - Xem và cập nhật đơn hàng
    3. **Quản lý sản phẩm** - Xem, sửa, xóa sản phẩm
    4. **Quản lý kho** - Theo dõi hàng tồn kho

**Route:** `/dashboard/seller` (Private)

#### 2. **Seller Components**

📁 `Client/Book4U/src/components/seller/`

##### **SellerOrdersManagement.jsx**

-   Danh sách đơn hàng với bộ lọc theo trạng thái
-   Tìm kiếm đơn hàng
-   Chi tiết đơn hàng khi nhấp vào
-   Cập nhật trạng thái đơn hàng (pending → processing → shipped → completed)

##### **SellerProductsManagement.jsx**

-   Bảng danh sách sản phẩm
-   Tìm kiếm sản phẩm
-   Xem thông tin: giá, tồn kho, đã bán, đánh giá
-   Nút để xem chi tiết, chỉnh sửa, xóa sản phẩm

##### **SellerInventoryManagement.jsx**

-   Chọn kho hàng
-   Thông tin quản lý kho
-   Danh sách hàng sắp hết (dưới 10 sản phẩm)
-   Thông báo cảnh báo kho hàng

##### **SellerRevenueStats.jsx**

-   Lọc theo thời gian: Hôm nay, Tuần này, Tháng này, Năm này
-   Thẻ thống kê: Doanh thu, Số đơn hàng, Doanh số bán
-   Biểu đồ doanh thu (Recharts)
-   Trạng thái đơn hàng

#### 3. **API Services**

##### **sellerApi.js**

📁 `Client/Book4U/src/services/api/sellerApi.js`

```javascript
export const getSellerStore(sellerId)           // Lấy info cửa hàng
export const getSellerProducts(sellerId, params) // Lấy danh sách sản phẩm
export const getSellerDashboard()               // Lấy dashboard
export const getSellerStats(period)             // Lấy thống kê
export const updateSellerProfile(data)          // Cập nhật profile
```

##### **sellerOrderApi.js**

📁 `Client/Book4U/src/services/api/sellerOrderApi.js`

```javascript
export const getSellerOrders(params)            // Lấy danh sách đơn hàng
export const getSellerOrderDetail(orderId)      // Lấy chi tiết đơn hàng
export const updateOrderStatus(orderId, status) // Cập nhật trạng thái
export const getRevenueStats(period)            // Lấy thống kê doanh thu
```

#### 4. **Routes Update**

📝 `Client/Book4U/src/routes/index.jsx`

```jsx
// Public route
<Route path="/seller/:sellerId" element={<SellerStore />} />

// Private route
<Route
  path="/dashboard/seller"
  element={
    <PrivateRoute>
      <SellerDashboard />
    </PrivateRoute>
  }
/>
```

---

## 🎯 Luồng Sử Dụng

### Khách Truy Cập Cửa Hàng (Public)

```
1. Nhấp vào tên cửa hàng hoặc link /seller/:sellerId
   ↓
2. Xem trang SellerStore
   - Thông tin cửa hàng (logo, tên, mô tả, địa chỉ)
   - Rating và doanh số bán
   - Danh sách sản phẩm (phân trang)
   ↓
3. Nhấp vào sản phẩm để xem chi tiết hoặc thêm vào giỏ hàng
```

### Chủ Cửa Hàng (Seller)

```
1. Đăng nhập → Vào /dashboard/seller
   ↓
2. Xem Tổng Quan
   - Stats cards: Sản phẩm, Đơn hàng, Doanh số, Doanh thu
   - Biểu đồ doanh thu theo thời gian
   - Lọc theo ngày/tuần/tháng/năm
   ↓
3. Quản Lý Đơn Hàng
   - Xem danh sách đơn hàng
   - Lọc theo trạng thái
   - Tìm kiếm đơn hàng
   - Nhấp để xem chi tiết
   - Cập nhật trạng thái (pending → processing → shipped → completed)
   ↓
4. Quản Lý Sản Phẩm
   - Xem bảng danh sách sản phẩm
   - Tìm kiếm sản phẩm
   - Xem, chỉnh sửa, xóa sản phẩm
   - Thêm sản phẩm mới
   ↓
5. Quản Lý Kho
   - Chọn kho hàng
   - Xem hàng tồn kho
   - Danh sách hàng sắp hết (cảnh báo)
   - Nhấp "Nhập hàng" để bổ sung
```

---

## 📊 Các Trạng Thái Đơn Hàng

| Trạng Thái     | Mô Tả      | Màu Sắc    |
| -------------- | ---------- | ---------- |
| **pending**    | Chờ xử lý  | Vàng 🟨    |
| **processing** | Đang xử lý | Xanh 🔵    |
| **shipped**    | Đã gửi     | Tím 🟣     |
| **completed**  | Hoàn thành | Xanh lá 🟢 |
| **cancelled**  | Đã hủy     | Đỏ 🔴      |

---

## 🔐 Bảo Mật

-   **Các route private** (`/dashboard/seller`, `/api/seller-orders`, vv) yêu cầu:

    -   Đăng nhập (token hợp lệ)
    -   Role = 'seller'
    -   Người dùng chỉ có thể xem dữ liệu của cửa hàng của họ

-   **Kiểm tra quyền truy cập:**
    -   Seller chỉ có thể xem đơn hàng chứa sản phẩm của mình
    -   Seller chỉ có thể cập nhật đơn hàng của mình

---

## 📦 Phụ Thuộc Mới

### Frontend

-   **recharts** - Biểu đồ doanh thu

Cài đặt:

```bash
cd Client/Book4U
npm install recharts
```

---

## 🚀 Cách Chạy

### Backend

```bash
cd Server
npm install
npm run dev
```

### Frontend

```bash
cd Client/Book4U
npm install
npm run dev
```

---

## 📝 API Endpoints Chi Tiết

### Seller Store (Public)

```bash
# Lấy thông tin cửa hàng
GET /api/sellers/:sellerId
Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "storeName": "Cửa hàng sách XYZ",
    "storeLogo": "/uploads/logo.png",
    "storeDescription": "...",
    "rating": 4.5,
    "totalSales": 1000,
    "businessAddress": { ... }
  }
}

# Lấy sản phẩm của cửa hàng
GET /api/sellers/:sellerId/products?page=1&limit=12
Response:
{
  "success": true,
  "data": [ {...}, {...} ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

### Seller Dashboard (Private)

```bash
# Lấy thông tin dashboard
GET /api/sellers/dashboard/info
Authorization: Bearer {token}
Response:
{
  "success": true,
  "data": {
    "seller": { ... },
    "stats": {
      "totalProducts": 45,
      "totalOrders": 123,
      "totalRevenue": 50000000,
      "totalSales": 500
    }
  }
}

# Lấy thống kê theo thời gian
GET /api/sellers/dashboard/stats?period=month
Authorization: Bearer {token}
Response:
{
  "success": true,
  "data": {
    "period": "month",
    "revenue": 15000000,
    "totalOrders": 45,
    "soldCount": 150,
    "statusStats": {
      "pending": 5,
      "processing": 8,
      "shipped": 12,
      "completed": 20,
      "cancelled": 0
    }
  }
}
```

### Seller Orders (Private)

```bash
# Lấy danh sách đơn hàng
GET /api/seller-orders?page=1&limit=10&status=pending
Authorization: Bearer {token}
Response:
{
  "success": true,
  "data": [ {...}, {...} ],
  "pagination": { ... }
}

# Cập nhật trạng thái đơn hàng
PUT /api/seller-orders/:orderId/status
Authorization: Bearer {token}
Body: { "status": "shipped" }
Response:
{
  "success": true,
  "message": "Cập nhật thành công",
  "data": { ... }
}

# Lấy thống kê doanh thu
GET /api/seller-orders/stats/revenue?period=month
Authorization: Bearer {token}
Response:
{
  "success": true,
  "data": {
    "period": "month",
    "revenue": 15000000,
    "ordersCount": 45
  }
}
```

---

## 🐛 Troubleshooting

### Lỗi: "Bạn không có quyền truy cập"

-   Kiểm tra token đã hết hạn hay chưa
-   Kiểm tra role của user có phải 'seller' không

### Lỗi: "Không tìm thấy cửa hàng"

-   Kiểm tra sellerId có tồn tại không
-   Kiểm tra user đã hoàn tất đăng ký seller chưa

### Lỗi: "Biểu đồ không hiển thị"

-   Kiểm tra recharts đã được cài đặt: `npm list recharts`
-   Kiểm tra dữ liệu từ API có đúng format không

---

## 📞 Hỗ Trợ

Nếu có vấn đề, vui lòng kiểm tra:

1. Backend có chạy không (http://localhost:5000)
2. Frontend có chạy không (http://localhost:5173)
3. Đã login với tài khoản seller chưa
4. Browser console có lỗi gì không
5. Network tab xem response từ API

---

## ✅ Checklist Triển Khai

-   [ ] Cài đặt recharts: `npm install recharts`
-   [ ] Backend chạy bình thường
-   [ ] Frontend chạy bình thường
-   [ ] Đăng nhập với tài khoản seller
-   [ ] Vào /dashboard/seller xem dashboard
-   [ ] Test các tab (Orders, Products, Inventory, Stats)
-   [ ] Test update order status
-   [ ] Test lọc đơn hàng
-   [ ] Vào /seller/:sellerId để xem public store
