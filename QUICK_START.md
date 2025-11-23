# 🚀 Quick Start Guide - Seller Store Feature

## ⚡ Cài Đặt & Chạy (5 phút)

### Bước 1: Backend

```bash
cd Server
npm install
npm run dev
# Sẽ chạy trên http://localhost:5000
```

### Bước 2: Frontend

```bash
cd Client/Book4U
npm install  # Cài recharts + các dependencies
npm run dev
# Sẽ chạy trên http://localhost:5173
```

---

## 🧪 Test Tính Năng

### 1️⃣ Trang Cửa Hàng (Public)

Truy cập: **`http://localhost:5173/seller/{sellerId}`**

> **Thay `{sellerId}` bằng ID thực của một seller từ database**

```bash
# Ví dụ nếu seller ID là "507f1f77bcf86cd799439011"
http://localhost:5173/seller/507f1f77bcf86cd799439011
```

**Sẽ thấy:**

-   ✅ Logo cửa hàng
-   ✅ Tên + mô tả cửa hàng
-   ✅ Rating ⭐
-   ✅ Danh sách sản phẩm (12 item/trang)
-   ✅ Nút "Xem thêm sản phẩm"

---

### 2️⃣ Bảng Điều Khiển Seller (Private)

Bước 1: **Đăng nhập** với tài khoản seller

-   Truy cập: `http://localhost:5173/login`
-   Nhập email + password của seller

Bước 2: **Vào Dashboard**

-   Truy cập: `http://localhost:5173/dashboard/seller`

**Sẽ thấy 4 tabs:**

#### 📊 Tab "Tổng Quan"

-   4 thẻ thống kê: Sản phẩm, Đơn hàng, Doanh số, Doanh thu
-   Biểu đồ doanh thu (Recharts)
-   Bộ lọc: Hôm nay, Tuần này, Tháng này, Năm này

#### 📦 Tab "Quản Lý Đơn Hàng"

-   Danh sách đơn hàng với mã, khách, trạng thái, tiền
-   Tìm kiếm đơn hàng
-   Lọc theo trạng thái (pending, processing, shipped, completed, cancelled)
-   Nhấp để xem chi tiết
-   Cập nhật trạng thái (nút chuyển status)

#### 📚 Tab "Quản Lý Sản Phẩm"

-   Bảng danh sách sản phẩm
-   Tìm kiếm sản phẩm
-   Xem: Ảnh, tên, giá, tồn kho, đã bán, đánh giá
-   Nút hành động: View, Edit, Delete
-   Nút "Thêm sản phẩm"

#### 🏢 Tab "Quản Lý Kho"

-   Chọn kho hàng (ví dụ: Kho 1 - TP HCM, Kho 2 - Hà Nội)
-   Thông tin quản lý kho
-   Tổng hàng + hàng sắp hết
-   Danh sách hàng sắp hết (< 10 sản phẩm)
-   Nút "Nhập hàng"

---

## 🔗 API Endpoints Test (Postman/cURL)

### Public APIs

#### 1. Lấy thông tin cửa hàng

```bash
curl -X GET http://localhost:5000/api/sellers/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "storeName": "Cửa hàng sách XYZ",
    "storeLogo": "/uploads/store-logo/logo.png",
    "storeDescription": "Chuyên bán sách...",
    "rating": 4.5,
    "totalSales": 1000,
    "businessAddress": {...}
  }
}
```

#### 2. Lấy sản phẩm của cửa hàng

```bash
curl -X GET "http://localhost:5000/api/sellers/507f1f77bcf86cd799439011/products?page=1&limit=12"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Sách A",
      "author": "Tác giả A",
      "price": 100000,
      "images": [...],
      "stock": 50,
      "ratingAvg": 4.2
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

---

### Private APIs (Require Authentication)

#### 3. Lấy dashboard info

```bash
curl -X GET http://localhost:5000/api/sellers/dashboard/info \
  -H "Authorization: Bearer {token}"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "seller": {...},
    "stats": {
      "totalProducts": 45,
      "totalOrders": 123,
      "totalRevenue": 50000000,
      "totalSales": 500
    }
  }
}
```

#### 4. Lấy danh sách đơn hàng

```bash
curl -X GET "http://localhost:5000/api/seller-orders?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer {token}"
```

#### 5. Cập nhật trạng thái đơn hàng

```bash
curl -X PUT http://localhost:5000/api/seller-orders/60d5ec49c1234567890abcde/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

#### 6. Lấy thống kê doanh thu

```bash
curl -X GET "http://localhost:5000/api/seller-orders/stats/revenue?period=month" \
  -H "Authorization: Bearer {token}"
```

---

## 🧠 Cấu Trúc Thư Mục

```
Book4U_DACN/
├── Server/
│   └── src/
│       ├── controllers/
│       │   ├── sellerController.js          ✨ MỚI
│       │   └── orderSellerController.js      ✨ MỚI
│       ├── routes/
│       │   ├── sellerRoutes.js               ✨ MỚI
│       │   ├── orderSellerRoutes.js          ✨ MỚI
│       │   └── index.js                      🔄 SỬA
│       └── models/
│           └── orderModel.js                 🔄 SỬA
│
├── Client/
│   └── Book4U/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── SellerStore.jsx           ✨ MỚI
│       │   │   └── SellerDashboard.jsx       ✨ MỚI
│       │   ├── components/
│       │   │   └── seller/                   ✨ MỚI (4 files)
│       │   ├── services/api/
│       │   │   ├── sellerApi.js              ✨ MỚI
│       │   │   └── sellerOrderApi.js         ✨ MỚI
│       │   └── routes/
│       │       └── index.jsx                 🔄 SỬA
│       └── package.json                      🔄 SỬA (thêm recharts)
│
├── SELLER_STORE_GUIDE.md                     ✨ MỚI
└── IMPLEMENTATION_SUMMARY.md                 ✨ MỚI
```

---

## ✅ Checklist Kiểm Tra

### Backend

-   [ ] Server chạy bình thường (port 5000)
-   [ ] Không có lỗi khi import sellerController
-   [ ] Không có lỗi khi import orderSellerController
-   [ ] Routes `/api/sellers` hoạt động
-   [ ] Routes `/api/seller-orders` hoạt động

### Frontend

-   [ ] Frontend chạy bình thường (port 5173)
-   [ ] Recharts đã cài đặt (`npm list recharts`)
-   [ ] Trang `/seller/:sellerId` hiển thị đúng
-   [ ] Trang `/dashboard/seller` hiển thị đúng (nếu login)
-   [ ] 4 tabs trong dashboard hoạt động

### Features

-   [ ] Hiển thị thông tin cửa hàng trên SellerStore
-   [ ] Phân trang sản phẩm hoạt động
-   [ ] Dashboard stats hiển thị số liệu đúng
-   [ ] Lọc đơn hàng theo status hoạt động
-   [ ] Cập nhật trạng thái đơn hàng hoạt động
-   [ ] Biểu đồ doanh thu hiển thị đúng
-   [ ] Quản lý kho hiển thị cảnh báo hàng sắp hết

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Không tìm thấy cửa hàng"

```bash
# Kiểm tra sellerId có tồn tại không
# Vào MongoDB xem có bản ghi seller nào không
db.profiles.find({profileType: "seller"})
```

### Lỗi: "Bạn không có quyền truy cập"

```bash
# Kiểm tra:
1. Token đã hết hạn?
2. User có role 'seller' không?
3. Truy cập vào /dashboard/seller mà chưa login?
```

### Lỗi: "Recharts not found"

```bash
# Cài lại dependencies
cd Client/Book4U
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Lỗi: "CORS error"

```bash
# Kiểm tra backend có chạy không
# Kiểm tra .env file có config đúng không
```

---

## 📞 Support

Xem file `SELLER_STORE_GUIDE.md` để biết thêm chi tiết.

---

## 🎉 Hoàn Thành!

Bạn đã triển khai thành công tính năng Seller Store!

**Chúc mừng! 🎊**
