# 🎯 TÁCH ĐƠN HÀNG ĐA-SELLER | ORDER DETAIL SYSTEM

## ❓ PROBLEM

Khi customer đặt hàng từ **nhiều cửa hàng (sellers)**, hiện tại:

```
❌ 1 Order chứa items từ 2+ sellers
❌ Mỗi seller không có order riêng biệt
❌ Không track được: Seller A đã confirm/ship? Seller B thì sao?
❌ Query chậm: phải tìm kiếm trong items array
❌ Không thể chia tiền seller riêng biệt sau này
```

## ✅ SOLUTION

**Tự động tách 1 Order thành multiple OrderDetails** (1 per seller)

```
✅ Customer đặt 1 order → Hệ thống tạo 3 documents:
   1. MainOrder (chứa tất cả items)
   2. OrderDetail cho SellerA (items của A)
   3. OrderDetail cho SellerB (items của B)

✅ Mỗi OrderDetail có:
   - Status riêng (pending → confirmed → shipping → delivered)
   - Tracking number riêng
   - Warehouse riêng
   - Stock management riêng
   - Payment status (sync từ MainOrder)

✅ Query nhanh: OrderDetail.find({sellerId: 'seller_a'})
✅ Dễ tính tiền: Settlement.find({sellerId: 'seller_a'})
```

---

## 📊 BEFORE vs AFTER

### BEFORE (Cũ)

```javascript
// Order
{
  _id: "order_123",
  items: [
    { bookId: "book_1", sellerId: "seller_a", qty: 2 },
    { bookId: "book_2", sellerId: "seller_b", qty: 1 }
  ],
  totalAmount: 350000,
  paymentStatus: "paid",
  status: "pending"  // ← Chung 1 status cho cả A & B
}

// Seller A xem: phải filter items['sellerId'] → Chậm ❌
// Seller B xem: phải filter items['sellerId'] → Chậm ❌
// Track: Không biết SellerA đã confirm? SellerB? 🤷
```

### AFTER (Mới)

```javascript
// MainOrder (giống cũ nhưng có thêm references)
{
  _id: "order_123",
  items: [
    { bookId: "book_1", sellerId: "seller_a", qty: 2 },
    { bookId: "book_2", sellerId: "seller_b", qty: 1 }
  ],
  totalAmount: 350000,
  paymentStatus: "paid",
  orderDetails: ["detail_a_id", "detail_b_id"]  // ← THÊM MỚI
}

// OrderDetail cho SellerA (MỚI)
{
  _id: "detail_a_id",
  mainOrderId: "order_123",
  sellerId: "seller_a",
  items: [{ bookId: "book_1", qty: 2 }],
  subtotal: 200000,
  status: "confirmed",           // ← Status riêng
  trackingNumber: "VTP123456",   // ← Tracking riêng
  confirmedAt: "...",
  shippedAt: "..."
}

// OrderDetail cho SellerB (MỚI)
{
  _id: "detail_b_id",
  mainOrderId: "order_123",
  sellerId: "seller_b",
  items: [{ bookId: "book_2", qty: 1 }],
  subtotal: 150000,
  status: "pending",             // ← SellerB chưa confirm
  trackingNumber: null           // ← Chưa ship
}

// Seller A xem: OrderDetail.find({sellerId: 'seller_a'}) → NHANH ✅
// Seller B xem: OrderDetail.find({sellerId: 'seller_b'}) → NHANH ✅
// Track: Detail_A.status = confirmed, Detail_B.status = pending → RÕ RÀNG ✅
```

---

## 🔄 WORKFLOW

```
┌─ Customer đặt hàng ─────────────────────────────────┐
│ Sản phẩm từ SellerA & SellerB                      │
│ POST /api/orders/create                             │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ System auto tạo ──────────────────────────────────┐
│ ✅ MainOrder                                        │
│ ✅ OrderDetail (SellerA)                            │
│ ✅ OrderDetail (SellerB)                            │
│ ✅ Notification cho SellerA (chỉ items của A)      │
│ ✅ Notification cho SellerB (chỉ items của B)      │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ Customer thanh toán MOMO/VNPAY ──────────────────┐
│ Thanh toán 1 lần cho toàn bộ: 350,000             │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ Callback thanh toán ──────────────────────────────┐
│ ✅ MainOrder.paymentStatus = "paid"                │
│ ✅ OrderDetail_A.paymentStatus = "paid"            │
│ ✅ OrderDetail_B.paymentStatus = "paid"            │
│ ✅ Notification: "Thanh toán thành công"           │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ SellerA xác nhận ─────────────────────────────────┐
│ POST /api/orders/seller/details/detail_a/confirm  │
│ ✅ OrderDetail_A.status = "confirmed"              │
│ ✅ Trừ stock từ warehouse của SellerA              │
│ ✅ Notification: "SellerA xác nhận"                │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ SellerB vẫn pending ──────────────────────────────┐
│ OrderDetail_B.status = "pending" (chưa xác nhận)  │
│ ❌ Stock chưa trừ                                  │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ SellerB xác nhận ─────────────────────────────────┐
│ POST /api/orders/seller/details/detail_b/confirm  │
│ ✅ OrderDetail_B.status = "confirmed"              │
│ ✅ Trừ stock từ warehouse của SellerB              │
│ ✅ MainOrder.status = "confirmed" (tất cả OK)     │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ SellerA ship ─────────────────────────────────────┐
│ POST /api/orders/seller/details/detail_a/ship     │
│ ✅ OrderDetail_A.status = "shipping"               │
│ ✅ trackingNumber = "VTP123456"                    │
│ ✅ Notification: "SellerA đã giao cho ViettelPost" │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ SellerB ship (độc lập) ───────────────────────────┐
│ ✅ OrderDetail_B.status = "shipping"               │
│ ✅ trackingNumber = "GHN789012"                    │
│ ✅ 2 sellers, 2 tracking numbers                   │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ Customer nhận hàng từ A ──────────────────────────┐
│ ✅ OrderDetail_A.status = "delivered"              │
│ ✅ Cho phép rate SellerA                           │
│ ⏳ OrderDetail_B vẫn shipping                       │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─ Customer nhận hàng từ B ──────────────────────────┐
│ ✅ OrderDetail_B.status = "delivered"              │
│ ✅ Cho phép rate SellerB                           │
│ ✅ Hoàn thành 100%                                 │
└────────────────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS (MỚI)

### Seller quản lý OrderDetails

```bash
# 1️⃣ Danh sách OrderDetails
GET /api/orders/seller/details?page=1&limit=10&status=pending
Authorization: Bearer <token>

Response:
{
  data: [
    {
      _id: "detail_a_id",
      mainOrderId: "order_123",
      status: "pending",
      subtotal: 200000,
      items: [...],
      shippingAddress: {...}
    }
  ]
}

---

# 2️⃣ Chi tiết OrderDetail
GET /api/orders/seller/details/:orderDetailId
Authorization: Bearer <token>

Response:
{
  data: {
    _id: "detail_a_id",
    mainOrderId: {...},        // Full MainOrder object
    items: [...],
    status: "pending",
    // ... tất cả info
  }
}

---

# 3️⃣ Seller xác nhận (quan trọng ⭐)
POST /api/orders/seller/details/:orderDetailId/confirm
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  customerLocation: {
    address: "123 Đường ABC, TP.HCM"  // Optional
  }
}

Response:
{
  success: true,
  data: {
    _id: "detail_a_id",
    status: "confirmed",
    confirmedAt: "2025-01-14T10:30:00Z"
  }
}

Side effects:
- ✅ Trừ stock từ warehouse
- ✅ OrderDetail.status = "confirmed"
- ✅ Notification sent

---

# 4️⃣ Seller cập nhật vận chuyển
POST /api/orders/seller/details/:orderDetailId/ship
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  trackingNumber: "VTP123456",
  shippingMethod: "standard",
  carrierName: "ViettelPost",
  estimatedDeliveryDate: "2025-01-20"
}

Response:
{
  data: {
    status: "shipping",
    trackingNumber: "VTP123456",
    shippedAt: "2025-01-14T11:00:00Z"
  }
}

---

# 5️⃣ Seller huỷ OrderDetail
POST /api/orders/seller/details/:orderDetailId/cancel
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  reason: "Hết hàng"
}

Response:
{
  data: {
    status: "cancelled",
    cancelledAt: "2025-01-14T12:00:00Z"
  }
}

Side effects:
- ✅ Hoàn lại stock (nếu đã trừ)
- ✅ Notification sent
```

---

## 📦 FILES THAY ĐỔI

### ✨ Files Mới Tạo

```
✅ Server/src/models/orderDetailModel.js
   - OrderDetail schema (200 lines)
   - Indexes + methods + hooks

✅ Server/src/controllers/orderDetailSellerController.js
   - 5 hàm xử lý OrderDetail
   - getSellerOrderDetails()
   - getSellerOrderDetailInfo()
   - confirmOrderDetail()
   - shipOrderDetail()
   - cancelOrderDetail()
```

### ✏️ Files Cập Nhật

```
✏️ Server/src/models/orderModel.js
   + orderDetails: [ObjectId]
   + detailsCreated: Boolean

✏️ Server/src/controllers/orderManagementController.js
   + createOrderDetailsForMultiSeller()
   - Sửa createOrder() gọi hàm mới

✏️ Server/src/controllers/paymentController.js
   - Sửa handleVNPayCallback()
   - Sửa handleMomoCallback()
   + Cập nhật OrderDetails khi payment success
```

---

## 🚀 INSTALL & TEST

### 1. Ensure Files Are in Place

```
Server/src/models/orderDetailModel.js       ✅ NEW
Server/src/controllers/orderDetailSellerController.js   ✅ NEW
```

### 2. Register Routes (nếu chưa)

Thêm vào `Server/src/routes/orderRoutes.js`:

```javascript
const orderDetailSellerController = require('../controllers/orderDetailSellerController');

// OrderDetail routes
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

### 3. Test

```bash
# Restart server
npm start

# Test: Create order từ 2 sellers
POST /api/orders/create
{
  "profileId": "customer_123",
  "items": [
    {
      "bookId": "book_1",
      "sellerId": "seller_a",
      "quantity": 2,
      "price": 100000
    },
    {
      "bookId": "book_2",
      "sellerId": "seller_b",
      "quantity": 1,
      "price": 150000
    }
  ],
  "totalAmount": 350000,
  "paymentMethod": "MOMO",
  "shippingAddress": {...}
}

Response sẽ có:
{
  "success": true,
  "data": {
    "_id": "order_123",
    "orderDetails": ["detail_a", "detail_b"],  ← MỚI
    "detailsCreated": true,                     ← MỚI
    ...
  }
}

# Test: Get seller orders (MỚI endpoint)
GET /api/orders/seller/details
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "_id": "detail_a",
      "mainOrderId": "order_123",
      "sellerId": "seller_a",
      "status": "pending",
      ...
    }
  ]
}
```

---

## ✅ BENEFITS

| Mục Tiêu                   | Result                               |
| -------------------------- | ------------------------------------ |
| Mỗi seller có order riêng  | ✅ OrderDetail model                 |
| Query nhanh                | ✅ Direct index không array search   |
| Status tracking per seller | ✅ Mỗi OrderDetail có status riêng   |
| Tracking per seller        | ✅ trackingNumber per OrderDetail    |
| Stock per warehouse        | ✅ warehouseId per OrderDetail       |
| Dễ chia tiền               | ✅ Settlement.find({sellerId})       |
| Auto tạo                   | ✅ createOrder() tự động tạo         |
| Auto update payment        | ✅ Callback tự update tất cả Details |

---

## 🎯 NEXT PHASE (Sau này)

1. **Settlement System** - Tính chia tiền seller
2. **Advanced Refund** - Hoàn tiền per seller
3. **Return Management** - Hoàn hàng per seller
4. **Analytics** - Revenue reports per seller

---

## ❓ FAQ

**Q: Có breaking changes không?**
A: Không. MainOrder vẫn tồn tại, chỉ thêm references mới.

**Q: Customer thấy gì thay đổi?**
A: Không có thay đổi gì (UX giống), nội bộ tốt hơn.

**Q: Old orders có affected không?**
A: Không. Chỉ new orders tạo OrderDetails.

**Q: Migration existing orders?**
A: Optional. Có script nếu cần, nhưng không bắt buộc.

---

## 📚 DOCUMENTATION

-   `MULTI_ORDER_SYSTEM_ANALYSIS.md` - Chi tiết technical
-   `IMPLEMENTATION_GUIDE_ORDERDETAIL.md` - Step-by-step
-   `MULTI_SELLER_ORDER_SEPARATION_SYSTEM.md` - Tổng quan

---

## ✨ READY TO DEPLOY

Tất cả files đã được tạo/cập nhật. Hệ thống sẵn sàng! 🚀
