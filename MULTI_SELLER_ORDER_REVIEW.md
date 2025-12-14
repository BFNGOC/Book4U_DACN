# KIỂM TRA HỆ THỐNG ĐỆT HÀNG ĐA-SELLER (Multi-Seller Order System)

## 📋 Tóm Tắt Kiến Trúc Hiện Tại

### ✅ Những Gì Đã Được Thực Hiện ĐÚNG:

#### 1. **Order Model Hỗ Trợ Multi-Seller**

```javascript
// orderModel.js - orderItemSchema
const orderItemSchema = new mongoose.Schema({
    bookId: mongoose.Schema.Types.ObjectId,
    sellerId: mongoose.Schema.Types.ObjectId, // ✅ Mỗi item có sellerId riêng
    quantity: Number,
    price: Number,
});

const orderSchema = {
    items: [orderItemSchema], // ✅ Array items từ nhiều sellers
    totalAmount: Number,
    paymentStatus: 'unpaid' | 'paid' | 'refunded',
};
```

#### 2. **Tách Thông Báo Theo Seller**

```javascript
// orderManagementController.js - createOrder()
const sellerItems = {};
for (const item of items) {
    const sellerId = item.sellerId?.toString();
    if (!sellerItems[sellerId]) {
        sellerItems[sellerId] = [];
    }
    sellerItems[sellerId].push(item);
}

// ✅ Gửi notification riêng cho mỗi seller
for (const [sellerId, itemsOfSeller] of Object.entries(sellerItems)) {
    await sendNewOrderNotification(io, sellerId, {
        items: itemsOfSeller, // Chỉ items của seller này
        // ...
    });
}
```

#### 3. **Thanh Toán Online Một Lần**

```javascript
// paymentController.js
createVNPayPaymentUrl(orderId, totalAmount) {
    // ✅ Thanh toán `totalAmount` cho TOÀN BỘ đơn
    // Một lần duy nhất, không tách payment per seller
}

handleVNPayCallback(vnp_TxnRef) {
    // ✅ Cập nhật paymentStatus = 'paid' cho cả order
}
```

#### 4. **Order Status Tracking**

```javascript
// ✅ Order có status riêng
paymentStatus: 'unpaid'|'paid'|'refunded',
status: 'pending'|'confirmed'|'processing'|...,
```

---

## ⚠️ Các Vấn Đề & Cần Cải Thiện:

### 🔴 Issue 1: Thiếu Tách Order Per Seller

**Hiện Tại:** Một Order chứa items từ nhiều sellers

```javascript
Order {
    _id: "order_123",
    items: [
        { bookId: "book_1", sellerId: "seller_A", quantity: 2 },
        { bookId: "book_2", sellerId: "seller_B", quantity: 1 }
    ]
}
```

**Vấn Đề:** Khi muốn query "Đơn hàng của seller_A", phải dùng:

```javascript
Order.find({
    'items.sellerId': sellerId, // ❌ Inefficient - array search
});
```

**Giải Pháp Khuyến Cáo:**
Tạo sub-order (OrderDetail) cho mỗi seller:

```javascript
// Model OrderDetail (mới)
{
    mainOrderId: "order_123",
    sellerId: "seller_A",
    items: [{bookId, quantity, price}],
    subtotal: 2000,
    shippingCost: 50,
    status: 'pending',
    warehouseId: 'warehouse_1',
    trackingNumber: 'VTP123456'
}
```

---

### 🔴 Issue 2: Thiếu Revenue Settlement (Đối Soát)

**Vấn Đề:** Hệ thống chưa có:

-   Cách chia tiền giữa platform & seller
-   Commission calculation (e.g., platform lấy 5%)
-   Settlement transaction log
-   Payout schedule cho sellers

**Giải Pháp:**

```javascript
// Model Settlement (mới)
{
    settlementId: 'settlement_1',
    sellerId: 'seller_A',
    orderIds: ['order_123', 'order_124'],
    totalRevenue: 5000,
    commission: 250,        // 5%
    platformFee: 100,       // Phí dịch vụ
    netAmount: 4650,        // Số tiền seller nhận
    status: 'pending'|'processed'|'paid',
    dueDate: '2025-01-15',
    paidDate: '2025-01-14'
}
```

---

### 🔴 Issue 3: Shipping & Logistics Per Seller

**Hiện Tại:** Mỗi item tìm warehouse riêng nhưng:

-   Không track vận chuyển per seller
-   Không có tracking number per seller order
-   Khó quản lý khi 1 delivery có items từ 2 sellers

**Cần:**

```javascript
// OrderDetail cần có:
{
    shippingMethod: 'standard'|'express',
    warehouseId: 'warehouse_1',
    trackingNumber: 'VTP123456',
    shippingCost: 50,
    estimatedDelivery: '2025-01-15',
    carrierInfo: {
        carrierName: 'ViettelPost',
        carrierPhone: '1234567890'
    }
}
```

---

### 🟡 Issue 4: Refund Logic Cho Multi-Seller

**Vấn Đề:** Nếu customer muốn hoàn một item từ seller A, nhưng đã thanh toán cho cả đơn:

```javascript
// Cần logic:
// 1. Xác định hoàn tiền cho seller A bao nhiêu
// 2. Update mainOrder.totalAmount
// 3. Ghi transaction refund
```

**Giải Pháp:**

```javascript
// Thêm returnSchema per item
{
    mainOrderId: 'order_123',
    sellerId: 'seller_A',
    returnedItems: [
        { bookId, quantity, refundAmount }
    ],
    status: 'pending'|'approved'|'refunded',
    refundMethod: 'wallet'|'original_payment'
}
```

---

## 📊 Kiến Trúc Được Khuyến Cáo (Recommended Architecture)

```
┌─────────────────────────────────────────┐
│ Customer tạo đơn (nhiều sellers)       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ MainOrder (Chứa items từ nhiều sellers) │
│ {                                       │
│   _id: "order_123"                     │
│   items: [{seller_A: [...]}, ...]      │
│   totalAmount: 5000,                   │
│   paymentStatus: 'unpaid'              │
│   paymentMethod: 'MOMO'                │
│ }                                       │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      ▼                ▼
┌──────────────┐  ┌──────────────┐
│ OrderDetail  │  │ OrderDetail   │
│ (Seller A)   │  │ (Seller B)    │
│ {            │  │ {             │
│   status:    │  │   status:     │
│   'pending'  │  │   'pending'   │
│   subtotal:  │  │   subtotal:   │
│   2000       │  │   3000        │
│   warehouse: │  │   warehouse:  │
│   W1         │  │   W2          │
│ }            │  │ }             │
└──────────────┘  └──────────────┘
      │                │
      ▼                ▼
  [Payment Gateway: MOMO/VNPAY]
  ✅ Thanh toán 1 lần: 5000
      │
      ├─► Update MainOrder.paymentStatus = 'paid'
      ├─► Update OrderDetail_A.paymentStatus = 'paid'
      └─► Update OrderDetail_B.paymentStatus = 'paid'
      │
      ▼
┌──────────────────────────────────┐
│ Revenue Settlement              │
│ {                                │
│   seller_A: 2000 - commission   │
│   seller_B: 3000 - commission   │
│   platform: commission total    │
│ }                                │
└──────────────────────────────────┘
```

---

## ✅ Action Items Cần Làm

### Phase 1: Tách Order (Medium Priority)

-   [ ] Tạo OrderDetail schema
-   [ ] Modify createOrder() để tạo OrderDetail per seller
-   [ ] Update payment callback xử lý OrderDetail
-   [ ] Update seller dashboard query (lọc OrderDetail by sellerId)

### Phase 2: Settlement System (High Priority)

-   [ ] Tạo Settlement model
-   [ ] Auto-generate settlement per month/week
-   [ ] Create payout system
-   [ ] Add settlement tracking to admin dashboard

### Phase 3: Advanced Refund (Medium Priority)

-   [ ] Implement partial refund (refund 1 seller's items)
-   [ ] Handle refund to wallet vs original payment
-   [ ] Track refund in settlement

### Phase 4: Advanced Shipping (Low Priority)

-   [ ] Track shipping per OrderDetail
-   [ ] Support multi-carrier
-   [ ] Real-time tracking updates

---

## 📝 Code Examples - Quick Implementation

### Example: Tạo OrderDetail khi Order created

```javascript
exports.createOrder = async (req, res) => {
    const { items, totalAmount, ... } = req.body;

    // 1. Tạo MainOrder
    const mainOrder = new Order({
        items, totalAmount, ...
    });
    await mainOrder.save();

    // 2. Tạo OrderDetail per seller
    const sellerGroups = {};
    for (const item of items) {
        if (!sellerGroups[item.sellerId]) {
            sellerGroups[item.sellerId] = [];
        }
        sellerGroups[item.sellerId].push(item);
    }

    // 3. Create OrderDetail for each seller
    const OrderDetail = require('../models/orderDetailModel');
    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
        const subtotal = sellerItems.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );

        await OrderDetail.create({
            mainOrderId: mainOrder._id,
            sellerId,
            items: sellerItems,
            subtotal,
            status: 'pending'
        });
    }

    return res.json({ success: true, data: mainOrder });
};
```

---

## 🎯 Kết Luận

**Hệ thống hiện tại ĐÚNG về:**

-   ✅ Tách items per seller trong một Order
-   ✅ Gửi notification per seller
-   ✅ Thanh toán một lần cho tất cả

**Cần cải thiện:**

-   ❌ Thiếu OrderDetail (sub-order) model - khó query per seller
-   ❌ Thiếu settlement/payout system - chưa có đối soát tiền
-   ❌ Thiếu shipping tracking per seller
-   ❌ Thiếu advanced refund logic

**Ưu tiên:** Settlement System > Order Detail tách riêng > Advanced refund
