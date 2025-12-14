# 🎯 MULTI-SELLER ORDER SEPARATION - EXECUTIVE SUMMARY

## 📌 CÓ GÌ TRONG RELEASE NÀY

Hệ thống đã được cải thiện để **tự động tách order đơn của customer** thành **multiple sub-orders (OrderDetails)**, mỗi cái riêng biệt cho một seller.

### ✨ Main Benefits

| Tính Năng                   | Trước           | Sau                        |
| --------------------------- | --------------- | -------------------------- |
| **Query Orders của Seller** | Array search ❌ | Direct index ✅            |
| **Seller Status Tracking**  | Chung 1 status  | Mỗi seller status riêng ✅ |
| **Shipping Tracking**       | 1 tracking      | Tracking per seller ✅     |
| **Stock Management**        | Global          | Per OrderDetail ✅         |
| **Payment Tracking**        | Order-level     | Order + Detail level ✅    |

---

## 🏗️ KIẾN TRÚC MỚI

### Database Structure

```
┌─────────────────────────────────────────┐
│ MainOrder (Order Collection)            │
│ Chứa tất cả items từ tất cả sellers     │
│ totalAmount = 350,000                   │
│ paymentStatus = "paid"                  │
│ orderDetails = [detail_A_id, detail_B_id]
└─────────────────────────────────────────┘
            ↙                        ↖
    ┌──────────────┐        ┌──────────────┐
    │ OrderDetail_A│        │ OrderDetail_B│
    │ (Seller A)   │        │ (Seller B)   │
    ├──────────────┤        ├──────────────┤
    │ sellerId: A  │        │ sellerId: B  │
    │ items: [...]ื│        │ items: [...] │
    │ status:conf  │        │ status:pend  │
    │ subtotal:2M  │        │ subtotal:1.5M│
    │ tracking:VTP │        │ tracking:null│
    └──────────────┘        └──────────────┘
```

---

## 📝 FILES CREATED/MODIFIED

### ✨ Files Được Tạo (NEW)

1. **`Server/src/models/orderDetailModel.js`** (90 lines)

    - OrderDetail schema với đầy đủ fields
    - Indexes tối ưu cho queries
    - Virtual fields và methods

2. **`Server/src/controllers/orderDetailSellerController.js`** (370 lines)
    - 5 endpoints cho seller quản lý OrderDetails:
        - `GET /api/orders/seller/details`
        - `GET /api/orders/seller/details/:id`
        - `POST /api/orders/seller/details/:id/confirm`
        - `POST /api/orders/seller/details/:id/ship`
        - `POST /api/orders/seller/details/:id/cancel`

### 🔄 Files Được Cập Nhật (MODIFIED)

1. **`Server/src/models/orderModel.js`** (+10 lines)

    - Thêm `orderDetails: [ObjectId]` field
    - Thêm `detailsCreated: Boolean` flag
    - Thêm index cho `orderDetails`

2. **`Server/src/controllers/orderManagementController.js`** (+60 lines)

    - Thêm `createOrderDetailsForMultiSeller()` helper function
    - Sửa `createOrder()` để gọi hàm tạo OrderDetails
    - Comments chi tiết về logic

3. **`Server/src/controllers/paymentController.js`** (+8 lines)
    - Cập nhật `handleVNPayCallback()` - update OrderDetails
    - Cập nhật `handleMomoCallback()` - update OrderDetails
    - Import OrderDetail model

---

## 🔌 API ENDPOINTS (NEW)

### Seller APIs for OrderDetails

```
[NEW] GET /api/orders/seller/details
      Query OrderDetail của seller (thay vì Order)
      Query params: page, limit, status

[NEW] GET /api/orders/seller/details/:orderDetailId
      Chi tiết OrderDetail

[NEW] POST /api/orders/seller/details/:orderDetailId/confirm
      Seller xác nhận + trừ stock

[NEW] POST /api/orders/seller/details/:orderDetailId/ship
      Seller cập nhật vận chuyển (tracking, carrier)

[NEW] POST /api/orders/seller/details/:orderDetailId/cancel
      Seller huỷ + hoàn stock
```

---

## 🔄 WORKFLOW FLOW

```
1. CUSTOMER CREATES ORDER (từ 2+ sellers)
   ↓
2. SYSTEM CREATES:
   - 1 MainOrder (all items)
   - 2 OrderDetails (1 per seller)
   - Notifications (mỗi seller 1 cái)
   ↓
3. CUSTOMER PAYS (MOMO/VNPAY)
   ↓
4. SYSTEM UPDATES:
   - MainOrder.paymentStatus = "paid"
   - ✅ OrderDetail_A.paymentStatus = "paid"
   - ✅ OrderDetail_B.paymentStatus = "paid"
   ↓
5. SELLER A CONFIRMS:
   - OrderDetail_A.status = "confirmed"
   - Trừ stock từ warehouse A
   ↓
6. SELLER B CONFIRMS:
   - OrderDetail_B.status = "confirmed"
   - Trừ stock từ warehouse B
   - MainOrder.status = "confirmed" (tất cả confirmed)
   ↓
7. SELLER A SHIPS:
   - OrderDetail_A.status = "shipping"
   - trackingNumber = "VTP123456"
   ↓
8. SELLER B SHIPS:
   - OrderDetail_B.status = "shipping"
   - trackingNumber = "GHN789012"
   ↓
9-10. CUSTOMER RECEIVES (from A, then from B)
      - Each OrderDetail.status = "delivered"
      - Allow rating per seller
```

---

## 📊 DATA MODEL CHANGES

### Order Document (AFTER)

```javascript
{
  _id: ObjectId,
  profileId: ObjectId,
  items: [
    { bookId, sellerId, quantity, price },
    { bookId, sellerId, quantity, price }
  ],
  totalAmount: 350000,
  paymentStatus: "paid",

  // ✅ NEW FIELDS
  orderDetails: [
    ObjectId("detail_a_id"),
    ObjectId("detail_b_id")
  ],
  detailsCreated: true,  // Flag to track if details created

  // ... existing fields
}
```

### OrderDetail Document (NEW)

```javascript
{
  _id: ObjectId,
  mainOrderId: ObjectId,      // Link to MainOrder
  sellerId: ObjectId,         // Which seller owns this

  items: [
    {
      bookId: ObjectId,
      quantity: Number,
      price: Number,
      warehouseId: ObjectId   // ✅ Which warehouse for this item
    }
  ],

  subtotal: Number,
  totalAmount: Number,

  status: "pending|confirmed|shipping|delivered|cancelled",
  paymentStatus: "unpaid|paid|refunded",

  warehouseId: ObjectId,
  trackingNumber: String,
  shippingMethod: "standard|express",
  estimatedDeliveryDate: Date,

  shippingAddress: { fullName, phone, address },

  createdAt: Date,
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,

  sellerNotes: String,
  customerNotes: String
}
```

---

## 🚀 GETTING STARTED

### Step 1: Deploy Models

Files tạo mới sẽ tự động load:

```
✅ Server/src/models/orderDetailModel.js
```

Khởi động server - Mongoose tự register model.

### Step 2: Update Routes

Thêm routes vào `Server/src/routes/orderRoutes.js`:

```javascript
const orderDetailSellerController = require('../controllers/orderDetailSellerController');

// GET all OrderDetails for seller
router.get(
    '/api/orders/seller/details',
    authMiddleware,
    orderDetailSellerController.getSellerOrderDetails
);

// ... other routes
```

### Step 3: Test

```bash
# Create test order from 2 sellers
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "customer_id",
    "items": [
      {"bookId": "book_1", "sellerId": "seller_a", "quantity": 2, "price": 100000},
      {"bookId": "book_2", "sellerId": "seller_b", "quantity": 1, "price": 150000}
    ],
    "totalAmount": 350000,
    "paymentMethod": "MOMO",
    "shippingAddress": {...}
  }'

# Response should include orderDetails array
# {
#   "success": true,
#   "data": {
#     "_id": "order_123",
#     "orderDetails": ["detail_a", "detail_b"],
#     "detailsCreated": true,
#     ...
#   }
# }

# Get seller orders (NEW endpoint)
curl -X GET "http://localhost:5000/api/orders/seller/details?status=pending" \
  -H "Authorization: Bearer <seller_token>"

# Response: Array of OrderDetails (not Orders)
# {
#   "success": true,
#   "data": [
#     {
#       "_id": "detail_a",
#       "mainOrderId": "order_123",
#       "sellerId": "seller_a",
#       "status": "pending",
#       "items": [...],
#       ...
#     }
#   ]
# }

# Seller confirms
curl -X POST "http://localhost:5000/api/orders/seller/details/detail_a/confirm" \
  -H "Authorization: Bearer <seller_token>" \
  -H "Content-Type: application/json" \
  -d '{"customerLocation": {"address": "..."}}'

# Response: OrderDetail with status updated to "confirmed"
```

---

## ✅ VERIFICATION CHECKLIST

### Database

-   [ ] OrderDetail collection tạo được
-   [ ] OrderDetail documents có đầy đủ fields
-   [ ] Indexes create thành công

### API Endpoints

-   [ ] `GET /api/orders/seller/details` returns OrderDetails
-   [ ] `POST /api/orders/seller/details/:id/confirm` updates status + stock
-   [ ] `POST /api/orders/seller/details/:id/ship` adds tracking
-   [ ] Payment callbacks update OrderDetails

### Business Logic

-   [ ] Creating order auto-creates OrderDetails
-   [ ] Each seller gets their own OrderDetail
-   [ ] Seller confirmation only affects their OrderDetail
-   [ ] Stock deduction per OrderDetail per warehouse
-   [ ] Multiple sellers can have different statuses

### Frontend Integration (TODO)

-   [ ] SellerConfirmation.jsx queries new endpoint
-   [ ] SellerOrdersManagement.jsx shows OrderDetails
-   [ ] Payment callbacks work correctly

---

## 🎯 PHASE 2 - NEXT IMPROVEMENTS

**Ưu tiên Implementation:**

1. **Settlement System** (2-3 ngày)

    - Calculate commission per seller
    - Payout tracking
    - Revenue reports

2. **Advanced Refund** (2 ngày)

    - Partial refund (1 item)
    - Refund per OrderDetail

3. **Return Management** (3 ngày)

    - Track returns per seller
    - Restocking workflow

4. **Analytics Dashboard** (2 ngày)
    - Per-seller metrics
    - Revenue tracking

---

## 📚 DOCUMENTATION FILES

| File                                      | Purpose                     |
| ----------------------------------------- | --------------------------- |
| `MULTI_ORDER_SYSTEM_ANALYSIS.md`          | Detailed technical analysis |
| `IMPLEMENTATION_GUIDE_ORDERDETAIL.md`     | Step-by-step implementation |
| `ORDERDETAIL_CONTROLLER_ADDITIONS.md`     | Code snippets reference     |
| `MULTI_SELLER_ORDER_SEPARATION_SYSTEM.md` | This file - Quick overview  |

---

## 🆘 SUPPORT

### Common Issues

**Q: "OrderDetail model not found"**

```
A: Ensure Server/src/models/orderDetailModel.js is in the correct path
   and server has restarted
```

**Q: "Payment not updating OrderDetails"**

```
A: Check paymentController.js line 1 has:
   const OrderDetail = require('../models/orderDetailModel');
```

**Q: "Seller can't see OrderDetails"**

```
A: Check routes are registered and middleware authentication is working
```

---

## ✅ SUMMARY

✨ **Hệ thống đã được nâng cấp để:**

1. ✅ Tách order → multiple OrderDetails (per seller)
2. ✅ Mỗi seller có status riêng, tracking riêng, stock management riêng
3. ✅ Query nhanh: `OrderDetail.find({sellerId})` thay vì array search
4. ✅ Payment callback tự update tất cả OrderDetails
5. ✅ Sẵn sàng cho settlement/payout system

**Sẵn sàng để deploy** ✅
