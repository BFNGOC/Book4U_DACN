# 🚀 IMPLEMENTATION GUIDE: Multi-Seller Order Separation System

## 📋 TÓM TẮT CÁC THAY ĐỔI

Toàn bộ hệ thống đã được cập nhật để **tách order thành sub-orders (OrderDetails) per seller** để mỗi seller quản lý độc lập.

### ✅ Các File Được Tạo/Cập Nhật

| File                             | Loại        | Mô Tả                                              |
| -------------------------------- | ----------- | -------------------------------------------------- |
| `orderDetailModel.js`            | 🆕 MỚI      | OrderDetail schema (sub-order per seller)          |
| `orderDetailSellerController.js` | 🆕 MỚI      | API endpoints cho seller quản lý OrderDetails      |
| `orderModel.js`                  | ✏️ CẬP NHẬT | Thêm `orderDetails[]` reference                    |
| `orderManagementController.js`   | ✏️ CẬP NHẬT | Thêm `createOrderDetailsForMultiSeller()` function |
| `paymentController.js`           | ✏️ CẬP NHẬT | Update payment callbacks để cập nhật OrderDetails  |

---

## 🏗️ DATABASE ARCHITECTURE

### 1. MainOrder (Order Collection)

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  profileId: ObjectId(...),           // Customer
  items: [
    {
      bookId: ObjectId(...),
      sellerId: ObjectId(...),        // Seller A
      quantity: 2,
      price: 100000
    },
    {
      bookId: ObjectId(...),
      sellerId: ObjectId(...),        // Seller B
      quantity: 1,
      price: 150000
    }
  ],
  totalAmount: 350000,
  paymentMethod: "MOMO",
  paymentStatus: "paid",              // ✅ Order-level payment status

  // ✅ MỚI: References tới OrderDetails
  orderDetails: [
    ObjectId("507f1f77bcf86cd799439012"),  // OrderDetail for Seller A
    ObjectId("507f1f77bcf86cd799439013")   // OrderDetail for Seller B
  ],
  detailsCreated: true,

  shippingAddress: {...},
  createdAt: ...,
  paymentStatus: "paid"
}
```

### 2. OrderDetail (OrderDetail Collection) - MỚI

**OrderDetail cho Seller A:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),

  // Link tới MainOrder
  mainOrderId: ObjectId("507f1f77bcf86cd799439011"),

  // Seller quản lý sub-order này
  sellerId: ObjectId("seller_a_id"),

  // Chỉ items của seller này
  items: [
    {
      bookId: ObjectId(...),
      quantity: 2,
      price: 100000,
      warehouseId: ObjectId("warehouse_123")  // ✅ Warehouse của seller A
    }
  ],

  // Tiền tệ
  subtotal: 200000,
  shippingCost: 0,
  totalAmount: 200000,

  // Status riêng cho Seller A
  status: "confirmed",                // 'pending' → 'confirmed' → 'shipping' → 'delivered'
  paymentStatus: "paid",              // Nếu main order đã thanh toán

  // Vận chuyển
  warehouseId: ObjectId("warehouse_123"),
  trackingNumber: "VTP123456",
  shippingMethod: "standard",
  estimatedDeliveryDate: Date(...),
  carrierInfo: {
    carrierName: "ViettelPost"
  },

  // Address (copy từ MainOrder)
  shippingAddress: {
    fullName: "Nguyễn Văn A",
    phone: "0123456789",
    address: "123 Đường ABC, TP.HCM"
  },

  // Timeline
  createdAt: ...,
  confirmedAt: ...,
  shippedAt: ...,
  deliveredAt: ...
}
```

**OrderDetail cho Seller B:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  mainOrderId: ObjectId("507f1f77bcf86cd799439011"),
  sellerId: ObjectId("seller_b_id"),

  items: [
    {
      bookId: ObjectId(...),
      quantity: 1,
      price: 150000,
      warehouseId: ObjectId("warehouse_456")
    }
  ],

  subtotal: 150000,
  totalAmount: 150000,
  status: "pending",  // ← Seller B chưa confirm
  paymentStatus: "paid",

  // ... (tương tự)
}
```

### 3. Workflow Hoàn Chỉnh

```
┌─────────────────────────────────────────────────┐
│ Step 1: Customer tạo order                      │
│ - Chọn sản phẩm từ SellerA & SellerB           │
│ - POST /api/orders/create                       │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 2: Tạo MainOrder + OrderDetails            │
│ - MainOrder chứa tất cả items                   │
│ - OrderDetail_A chứa items của SellerA          │
│ - OrderDetail_B chứa items của SellerB          │
│ - paymentStatus: 'unpaid'                       │
│ - Gửi notification cho mỗi seller               │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 3: Customer thanh toán                     │
│ - Thanh toán 1 lần cho toàn bộ order            │
│ - Payment gateway: MOMO/VNPAY                   │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 4: Callback thanh toán                     │
│ - MainOrder.paymentStatus = 'paid'              │
│ - Tất cả OrderDetail.paymentStatus = 'paid'    │
│ - Gửi notification: "Payment successful"        │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 5: Seller A xác nhận                       │
│ - POST /api/orders/seller/details/{detailId}/confirm
│ - OrderDetail_A.status = 'confirmed'           │
│ - Trừ stock từ warehouse của SellerA           │
│ - Notification: "Order confirmed by SellerA"   │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 6: Seller B chưa xác nhận                  │
│ - OrderDetail_B.status vẫn = 'pending'          │
│ - Notification: "Waiting for SellerB confirm"   │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 7: Seller B xác nhận (cuối cùng)          │
│ - OrderDetail_B.status = 'confirmed'           │
│ - Tất cả OrderDetails confirmed ✅              │
│ - MainOrder.status = 'confirmed'               │
│ - Notification: "All sellers confirmed"         │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 8: Seller A ship                           │
│ - POST /api/orders/seller/details/{detailId}/ship
│ - OrderDetail_A.status = 'shipping'            │
│ - OrderDetail_A.trackingNumber = 'VTP123456'   │
│ - Notification: "SellerA shipped with tracking" │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 9: Seller B ship (đơc lập)                │
│ - OrderDetail_B.status = 'shipping'            │
│ - Notification: "SellerB shipped"               │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 10: Customer nhận hàng từ A                │
│ - OrderDetail_A.status = 'delivered'           │
│ - OrderDetail_B vẫn = 'shipping'               │
│ - Cho phép customer review/rate SellerA        │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Step 11: Customer nhận hàng từ B                │
│ - OrderDetail_B.status = 'delivered'           │
│ - Toàn bộ order hoàn tất                       │
│ - Cho phép customer review/rate SellerB        │
└─────────────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS (MỚI)

### Seller APIs

#### 1️⃣ Danh sách OrderDetail của Seller

```
GET /api/orders/seller/details
  ?page=1&limit=10&status=pending

Response:
{
  success: true,
  data: [
    {
      _id: "order_detail_id",
      mainOrderId: {...},
      sellerId: "...",
      items: [...],
      status: "pending",
      subtotal: 200000,
      totalAmount: 200000,
      createdAt: ...
    },
    ...
  ],
  pagination: {...}
}
```

#### 2️⃣ Chi tiết OrderDetail

```
GET /api/orders/seller/details/{orderDetailId}

Response:
{
  success: true,
  data: {
    _id: "...",
    mainOrderId: {...},
    items: [...],
    status: "pending",
    shippingAddress: {...},
    ...
  }
}
```

#### 3️⃣ Seller Xác Nhận OrderDetail

```
POST /api/orders/seller/details/{orderDetailId}/confirm
Body: {
  customerLocation?: {
    address: "Địa chỉ giao",
    latitude?: 10.77,
    longitude?: 106.70
  }
}

Response:
{
  success: true,
  message: "Xác nhận đơn hàng thành công",
  data: {
    _id: "...",
    status: "confirmed",
    confirmedAt: "2025-01-14T10:30:00Z"
  }
}

Side effects:
- Trừ stock từ warehouse
- Update OrderDetail.status = 'confirmed'
- Nếu tất cả OrderDetails confirmed → MainOrder.status = 'confirmed'
```

#### 4️⃣ Seller Ship OrderDetail

```
POST /api/orders/seller/details/{orderDetailId}/ship
Body: {
  trackingNumber: "VTP123456",
  shippingMethod: "standard",
  carrierName: "ViettelPost",
  estimatedDeliveryDate: "2025-01-20"
}

Response:
{
  success: true,
  message: "Cập nhật vận chuyển thành công",
  data: {
    _id: "...",
    status: "shipping",
    trackingNumber: "VTP123456",
    shippedAt: "2025-01-14T11:00:00Z"
  }
}
```

#### 5️⃣ Seller Huỷ OrderDetail

```
POST /api/orders/seller/details/{orderDetailId}/cancel
Body: {
  reason: "Hết hàng"
}

Response:
{
  success: true,
  message: "Huỷ OrderDetail thành công",
  data: {...}
}

Side effects:
- Hoàn lại stock (nếu đã trừ)
- Update OrderDetail.status = 'cancelled'
```

---

## 🔄 Integration Points

### 1. Frontend: Seller Confirmation Page

**Thay thế logic cũ:**

```javascript
// CŨ: Query Order và filter items
const orders = await Order.find({ 'items.sellerId': sellerId });

// MỚI: Query OrderDetail
const orderDetails = await fetch('/api/orders/seller/details?status=pending');
```

### 2. Frontend: Seller Orders Dashboard

**Cấu trúc dữ liệu mới:**

```javascript
// Hiển thị OrderDetails thay vì Orders
orderDetails.map((detail) => (
    <OrderCard
        key={detail._id}
        orderDetail={detail} // ← OrderDetail object
        mainOrder={detail.mainOrderId}
        onConfirm={() => confirmOrderDetail(detail._id)}
        onShip={() => shipOrderDetail(detail._id)}
    />
));
```

### 3. Payment System

**Callback handlers:**

```javascript
// Khi payment thành công
handlePaymentSuccess(orderId) {
  // 1. Update MainOrder.paymentStatus = 'paid'
  // 2. ✅ Update tất cả OrderDetails.paymentStatus = 'paid'
  // 3. Gửi notification cho tất cả sellers
}
```

---

## ⚙️ Installation Steps

### 1. Database Migration (Nếu cần)

```javascript
// Chạy 1 lần để update các Order cũ (optional)
// Server/scripts/migrate-to-orderdetails.js

db.orders.updateMany(
    { detailsCreated: { $exists: false } },
    { $set: { detailsCreated: false, orderDetails: [] } }
);
```

### 2. Routes Configuration

**Thêm vào Server/src/routes/orderRoutes.js:**

```javascript
const orderDetailSellerController = require('../controllers/orderDetailSellerController');

// Seller Order Detail Routes
router.get(
    '/api/orders/seller/details',
    authMiddleware,
    orderDetailSellerController.getSellerOrderDetails
);

router.get(
    '/api/orders/seller/details/:orderDetailId',
    authMiddleware,
    orderDetailSellerController.getSellerOrderDetailInfo
);

router.post(
    '/api/orders/seller/details/:orderDetailId/confirm',
    authMiddleware,
    orderDetailSellerController.confirmOrderDetail
);

router.post(
    '/api/orders/seller/details/:orderDetailId/ship',
    authMiddleware,
    orderDetailSellerController.shipOrderDetail
);

router.post(
    '/api/orders/seller/details/:orderDetailId/cancel',
    authMiddleware,
    orderDetailSellerController.cancelOrderDetail
);
```

### 3. Server Startup

```bash
# Install dependencies (nếu cần)
npm install

# Start server
npm start

# Test với curl
curl -X GET http://localhost:5000/api/orders/seller/details \
  -H "Authorization: Bearer <token>"
```

---

## 🧪 Testing Checklist

### ✅ Order Creation

-   [ ] Customer tạo order từ 2+ sellers
-   [ ] MainOrder được tạo với tất cả items
-   [ ] 2 OrderDetails được tạo (1 per seller)
-   [ ] Notification được gửi cho từng seller riêng

### ✅ Payment Processing

-   [ ] Customer thanh toán MOMO/VNPAY
-   [ ] MainOrder.paymentStatus = 'paid'
-   [ ] ✅ Tất cả OrderDetails.paymentStatus = 'paid'
-   [ ] Notification: "Payment successful"

### ✅ Seller Confirmation

-   [ ] Seller A xác nhận
    -   OrderDetail_A.status = 'confirmed'
    -   Stock trừ từ warehouse
-   [ ] Seller B vẫn pending
    -   OrderDetail_B.status = 'pending'
    -   Stock chưa trừ
-   [ ] Khi SellerB confirm
    -   Tất cả confirmed → MainOrder.status = 'confirmed'

### ✅ Shipping

-   [ ] Seller A ship với tracking
-   [ ] OrderDetail_A.status = 'shipping', trackingNumber set
-   [ ] Seller B ship độc lập
-   [ ] Mỗi seller có tracking riêng

### ✅ Cancellation

-   [ ] Seller A cancel
    -   Stock hoàn lại
    -   OrderDetail_A.status = 'cancelled'
    -   MainOrder vẫn có OrderDetail_B
-   [ ] Seller B có thể vẫn confirm/ship

---

## 🐛 Troubleshooting

### Q: Lỗi "OrderDetail Model not found"

**A:** Kiểm tra:

```javascript
// server/index.js hoặc initialization code
require('../models/orderDetailModel'); // Ensure model is registered
```

### Q: Payment callback không update OrderDetails

**A:** Kiểm tra:

```javascript
// paymentController.js
const OrderDetail = require('../models/orderDetailModel');

// Ensure this line exists in callback
await OrderDetail.updateMany({ mainOrderId: order._id }, ...)
```

### Q: Seller không thấy OrderDetails

**A:**

```javascript
// Check route is registered correctly
GET / api / orders / seller / details;

// Check authentication middleware
console.log('Seller ID:', req.user.userId);
```

---

## 📊 Database Indices

Đã thêm vào orderDetailModel.js:

```javascript
orderDetailSchema.index({ sellerId: 1, createdAt: -1 });
orderDetailSchema.index({ sellerId: 1, status: 1 });
orderDetailSchema.index({ mainOrderId: 1 });
orderDetailSchema.index({ mainOrderId: 1, sellerId: 1 });
```

---

## 🎯 NEXT STEPS (Phase 2)

1. **Settlement System** - Tính chia tiền per seller
2. **Advanced Refund** - Hoàn tiền partial (1 item từ seller A)
3. **Return Management** - Quản lý hoàn hàng per OrderDetail
4. **Advanced Shipping** - Multi-carrier, real-time tracking
5. **Analytics** - Per-seller revenue, performance metrics
