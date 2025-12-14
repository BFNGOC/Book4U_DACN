# 🔍 PHÂN TÍCH TOÀN DIỆN: HỆ THỐNG ĐƠN HÀNG ĐA-SELLER

## 📊 TÓM TẮT HIỆN TRẠNG

### ✅ Những Gì Đã Hoạt Động Tốt

1. **Order Model hỗ trợ Multi-Seller**

    - Mỗi item có `sellerId` riêng
    - `items` là array chứa products từ nhiều sellers

2. **Notification tách per seller**

    - Gửi thông báo riêng cho mỗi seller
    - Mỗi seller chỉ nhìn thấy items của mình

3. **Payment xử lý tổng tiền**
    - Thanh toán 1 lần cho toàn bộ đơn
    - Tất cả items được thanh toán cùng lúc

### ❌ Các Vấn Đề Lớn Cần Sửa

| Vấn Đề                              | Tác Động                                           | Độ Ưu Tiên |
| ----------------------------------- | -------------------------------------------------- | ---------- |
| **Không tách Order per Seller**     | Seller không có đơn hàng riêng, query inefficient  | 🔴 Cao     |
| **Không tracking riêng per seller** | Không biết seller A đã ship chưa, seller B thì sao | 🔴 Cao     |
| **Không có settlement/payout**      | Không chia tiền giữa platform và seller            | 🔴 Cao     |
| **Refund khó xử lý**                | Hoàn tiền 1 item từ seller A → ảnh hưởng toàn đơn  | 🟡 Trung   |

---

## 🏗️ KIẾN TRÚC HIỆN TẠI (PROBLEM)

```
┌──────────────────────────────────────────────────────┐
│ Order #123 (Customer John đặt hàng)                 │
├──────────────────────────────────────────────────────┤
│ items: [                                             │
│   {                                                  │
│     bookId: "Book_1",                               │
│     sellerId: "SellerA",  ← Item này từ SellerA    │
│     quantity: 2,                                    │
│     price: 100,000                                  │
│   },                                                │
│   {                                                  │
│     bookId: "Book_2",                               │
│     sellerId: "SellerB",  ← Item này từ SellerB    │
│     quantity: 1,                                    │
│     price: 150,000                                  │
│   }                                                  │
│ ]                                                    │
│ totalAmount: 350,000                                │
│ paymentStatus: "paid"                               │
│ status: "pending" (Chung cho cả SellerA & SellerB) │
│ shippingAddress: {...}  ← Chung 1 address          │
└──────────────────────────────────────────────────────┘

⚠️ PROBLEMS:
1. SellerA không biết order này của mình, chỉ biết là có 1 order chứa item của mình
2. SellerA xác nhận → status = "pending" → toàn bộ order là pending
   Nhưng SellerB chưa xác nhận, nên không thể proceed
3. Không track: SellerA đã ship? SellerB chưa ship?
4. Refund khó: Customer muốn hoàn item từ SellerA 150,000
   → Phải tính lại toàn bộ order totalAmount, refundAmount khó xác định
```

---

## ✅ KIẾN TRÚC ĐỀ XUẤT (SOLUTION)

### Cấp độ 1: MainOrder (Không đổi)

```javascript
{
  _id: "order_123",
  profileId: "customer_john",
  totalAmount: 350000,
  paymentMethod: "MOMO",
  paymentStatus: "paid",  ✅ Status thanh toán toàn bộ
  shippingAddress: {...},
  items: [
    // Items vẫn giữ nguyên để reference
    { bookId: "book_1", sellerId: "seller_a", qty: 2, price: 100000 },
    { bookId: "book_2", sellerId: "seller_b", qty: 1, price: 150000 }
  ],
  createdAt: "2025-01-14"
}
```

### Cấp độ 2: OrderDetail (MỚI) - Sub-Order per Seller

Khi customer đặt hàng, tự động tạo 1 OrderDetail cho mỗi seller:

```javascript
// OrderDetail cho SellerA
{
  _id: "order_detail_a1",
  mainOrderId: "order_123",  ← Link tới parent order
  sellerId: "seller_a",      ← Seller này quản lý
  items: [
    { bookId: "book_1", qty: 2, price: 100000, warehouseId: "warehouse_123" }
  ],
  subtotal: 200000,          ← Chỉ tính cho items của SellerA
  shippingCost: 0,
  totalAmount: 200000,       ← SellerA nhận bao nhiêu
  status: "pending",         ← Status của SellerA riêng (chưa xác nhận)
  warehouseId: "warehouse_123",
  trackingNumber: null,      ← SellerA ship sẽ có tracking
  paymentStatus: "paid",     ← Đã thanh toán cho phần này
  shippingAddress: {...},    ← Copy từ MainOrder
  createdAt: "2025-01-14"
}

// OrderDetail cho SellerB
{
  _id: "order_detail_b1",
  mainOrderId: "order_123",
  sellerId: "seller_b",
  items: [
    { bookId: "book_2", qty: 1, price: 150000, warehouseId: "warehouse_456" }
  ],
  subtotal: 150000,
  totalAmount: 150000,
  status: "pending",         ← SellerB chưa xác nhận
  warehouseId: "warehouse_456",
  trackingNumber: null,
  paymentStatus: "paid",
  shippingAddress: {...},
  createdAt: "2025-01-14"
}
```

### Workflow Chi Tiết

```
Step 1: Customer thanh toán
┌────────────────────────────────────────┐
│ Customer: Đặt hàng từ SellerA & SellerB│
│ Thanh toán: 350,000 (MOMO/VNPAY)      │
└────────────────────────────────────────┘
           ↓
Step 2: Tạo MainOrder
┌────────────────────────────────────────┐
│ MainOrder {                             │
│   _id: order_123                       │
│   totalAmount: 350,000                 │
│   paymentStatus: paid                  │
│   items: [item_A, item_B]              │
│ }                                       │
└────────────────────────────────────────┘
           ↓
Step 3: Tạo OrderDetail per seller
┌──────────────────────┬──────────────────────┐
│ OrderDetail_A        │ OrderDetail_B        │
├──────────────────────┼──────────────────────┤
│ mainOrderId:order123 │ mainOrderId:order123 │
│ sellerId: seller_a   │ sellerId: seller_b   │
│ items: [item_A]      │ items: [item_B]      │
│ totalAmount: 200k    │ totalAmount: 150k    │
│ status: pending      │ status: pending      │
│ trackingNumber: null │ trackingNumber: null │
└──────────────────────┴──────────────────────┘
           ↓
Step 4: Seller xác nhận riêng
┌──────────────────────────┐
│ SellerA xác nhận:        │
│ OrderDetail_A.status ='confirmed'
│ ⇒ Kho trừ stock          │
│ ⇒ Chuẩn bị hàng          │
└──────────────────────────┘
┌──────────────────────────┐
│ SellerB vẫn pending:     │
│ OrderDetail_B.status ='pending'
│ ⇒ SellerB chưa xác nhận  │
│ ⇒ Hàng chưa trừ stock    │
└──────────────────────────┘
           ↓
Step 5: Seller ship riêng
┌──────────────────────────┐
│ SellerA ship:            │
│ OrderDetail_A.status ='shipped'
│ OrderDetail_A.trackingNumber = 'VTP123456'
│                          │
│ SellerB chưa ship:       │
│ OrderDetail_B.status ='confirmed' (xác nhận nhưng chưa ship)
└──────────────────────────┘
           ↓
Step 6: Customer nhận hàng
┌──────────────────────────┐
│ SellerA hàng đã tới:     │
│ OrderDetail_A.status ='delivered'
│                          │
│ SellerB hàng đang ship:  │
│ OrderDetail_B.status ='shipping'
└──────────────────────────┘
           ↓
Step 7: Settlement (sau 7-14 ngày)
┌──────────────────────────┐
│ Settlement cho SellerA:  │
│ totalRevenue: 200,000    │
│ commission (5%): 10,000  │
│ netAmount: 190,000       │
│ ⇒ Transfer tiền cho SellerA
│                          │
│ Settlement cho SellerB:  │
│ totalRevenue: 150,000    │
│ commission: 7,500        │
│ netAmount: 142,500       │
└──────────────────────────┘
```

---

## 🗂️ CẤU TRÚC DATABASE MỚI

### 1. OrderDetail Schema (MỚI TẠO)

```javascript
// Server/src/models/orderDetailModel.js
const orderDetailSchema = new mongoose.Schema(
    {
        // Link tới MainOrder
        mainOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },

        // Seller này quản lý sub-order
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
            index: true,
        },

        // Items của seller này (filtered từ mainOrder.items)
        items: [
            {
                bookId: mongoose.Schema.Types.ObjectId,
                quantity: Number,
                price: Number,
                warehouseId: mongoose.Schema.Types.ObjectId,
            },
        ],

        // Tính toán tiền tệ
        subtotal: Number, // Tổng tiền hàng
        shippingCost: {
            type: Number,
            default: 0,
        },
        totalAmount: Number, // subtotal + shippingCost

        // Status riêng cho seller này
        status: {
            type: String,
            enum: [
                'pending', // Chờ seller xác nhận
                'confirmed', // Seller xác nhận, chuẩn bị hàng
                'packing', // Đang đóng gói
                'shipping', // Đã ship
                'delivered', // Đã giao
                'cancelled', // Huỷ
            ],
            default: 'pending',
            index: true,
        },

        // Thanh toán
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },

        // Vận chuyển
        warehouseId: mongoose.Schema.Types.ObjectId,
        shippingMethod: {
            type: String,
            enum: ['standard', 'express', 'fast'],
            default: 'standard',
        },
        trackingNumber: String,
        estimatedDeliveryDate: Date,

        // Giao hàng
        shippingAddress: {
            fullName: String,
            phone: String,
            address: String,
        },

        // Delivery attempts tracking
        deliveryAttempts: [
            {
                attemptNumber: Number,
                status: String, // 'success' | 'failed' | 'retry'
                timestamp: Date,
                reason: String,
                driverName: String,
            },
        ],

        // Hoàn hàng / Refund
        returnInfo: {
            reason: String,
            status: String, // 'pending' | 'approved' | 'returned' | 'refunded'
            refundAmount: Number,
        },

        // Timeline
        createdAt: { type: Date, default: Date.now },
        confirmedAt: Date,
        shippedAt: Date,
        deliveredAt: Date,

        // Notes
        sellerNotes: String,
        customerNotes: String,
    },
    { timestamps: true }
);

// Index cho queries thường xuyên
orderDetailSchema.index({ mainOrderId: 1, sellerId: 1 });
orderDetailSchema.index({ sellerId: 1, status: 1 });
orderDetailSchema.index({ sellerId: 1, createdAt: -1 });

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
```

### 2. Thay Đổi Order Model (Thêm reference)

```javascript
// Thêm vào orderSchema
{
  // Đã có từ trước
  items: [...],
  totalAmount: Number,
  paymentStatus: String,

  // ✅ THÊM MỚI
  orderDetails: [{           // Array references
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderDetail'
  }],

  // Flag để biết đã tạo OrderDetail chưa
  detailsCreated: {
    type: Boolean,
    default: false
  }
}
```

---

## 💻 CODE IMPLEMENTATION

### File 1: orderDetailModel.js (MỚI)

**Tạo file mới:**

```
Server/src/models/orderDetailModel.js
```

### File 2: orderManagementController.js (CẬP NHẬT)

**Hàm createOrder - Thêm logic tạo OrderDetail:**

```javascript
exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            items,
            totalAmount,
            profileId,
            paymentMethod,
            shippingAddress,
        } = req.body;

        // 1. Tạo MainOrder
        const mainOrder = new Order({
            profileId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
            detailsCreated: false,
        });
        await mainOrder.save({ session });

        // 2. Group items by sellerId
        const sellerGroups = {};
        for (const item of items) {
            const sellerId = item.sellerId.toString();
            if (!sellerGroups[sellerId]) {
                sellerGroups[sellerId] = [];
            }
            sellerGroups[sellerId].push(item);
        }

        // 3. Tạo OrderDetail cho mỗi seller
        const OrderDetail = require('../models/orderDetailModel');
        const orderDetailIds = [];

        for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
            const subtotal = sellerItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            const orderDetail = new OrderDetail({
                mainOrderId: mainOrder._id,
                sellerId,
                items: sellerItems,
                subtotal,
                totalAmount: subtotal,
                shippingAddress,
                status: 'pending',
                paymentStatus: paymentMethod === 'COD' ? 'unpaid' : 'paid',
            });

            await orderDetail.save({ session });
            orderDetailIds.push(orderDetail._id);
        }

        // 4. Update MainOrder với references
        mainOrder.orderDetails = orderDetailIds;
        mainOrder.detailsCreated = true;
        await mainOrder.save({ session });

        // 5. Notification per seller (cũ)
        const sellerItems = {};
        for (const item of items) {
            const sellerId = item.sellerId?.toString();
            if (!sellerItems[sellerId]) {
                sellerItems[sellerId] = [];
            }
            sellerItems[sellerId].push(item);
        }

        for (const [sellerId, itemsOfSeller] of Object.entries(sellerItems)) {
            await sendNewOrderNotification(io, sellerId, {
                _id: mainOrder._id,
                customerName: profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : 'Khách hàng',
                items: itemsOfSeller,
                shippingAddress,
            });
        }

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: mainOrder,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};
```

### File 3: orderSellerController.js (CẬP NHẬT)

**Hàm getOrdersForSeller - Dùng OrderDetail:**

```javascript
exports.getOrdersForSeller = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const sellerId = req.user._id; // From middleware

        // ✅ QUERY MỚI: Tìm OrderDetail theo sellerId
        const OrderDetail = require('../models/orderDetailModel');

        const query = { sellerId };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [orderDetails, total] = await Promise.all([
            OrderDetail.find(query)
                .populate('mainOrderId', 'profileId totalAmount paymentStatus')
                .populate(
                    'mainOrderId.profileId',
                    'firstName lastName primaryPhone'
                )
                .populate('items.bookId', 'title slug images price discount')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            OrderDetail.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: orderDetails,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
```

**Hàm confirmOrder - Update OrderDetail:**

```javascript
exports.confirmOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderDetailId } = req.params; // ← MỚI: là OrderDetail ID
        const sellerId = req.user._id;

        // ← MỚI: Tìm OrderDetail thay vì Order
        const OrderDetail = require('../models/orderDetailModel');
        const orderDetail = await OrderDetail.findById(orderDetailId).session(
            session
        );

        if (!orderDetail) {
            await session.abortTransaction();
            return res
                .status(404)
                .json({ success: false, message: 'OrderDetail not found' });
        }

        // Verify seller ownership
        if (orderDetail.sellerId.toString() !== sellerId.toString()) {
            await session.abortTransaction();
            return res
                .status(403)
                .json({ success: false, message: 'Not authorized' });
        }

        // Update status
        orderDetail.status = 'confirmed';
        orderDetail.confirmedAt = new Date();

        // ← MỚI: Trừ stock từ warehouse (riêng cho OrderDetail này)
        for (const item of orderDetail.items) {
            const warehouseStock = await WarehouseStock.findOne({
                warehouseId: item.warehouseId,
                bookId: item.bookId,
            }).session(session);

            if (!warehouseStock || warehouseStock.quantity < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for item ${item.bookId}`,
                });
            }

            // Trừ stock
            warehouseStock.quantity -= item.quantity;
            await warehouseStock.save({ session });

            // Ghi log
            await WarehouseLog.create(
                [
                    {
                        warehouseId: item.warehouseId,
                        bookId: item.bookId,
                        transactionType: 'order_confirmed',
                        quantityChange: -item.quantity,
                        orderId: orderDetail.mainOrderId,
                        orderDetailId: orderDetail._id,
                    },
                ],
                { session }
            );
        }

        await orderDetail.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được xác nhận',
            data: orderDetail,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};
```

---

## 🔄 PAYMENT CALLBACK (UPDATE)

Khi thanh toán thành công, cập nhật cả MainOrder và tất cả OrderDetails:

```javascript
exports.handleVNPayCallback = async (req, res) => {
    try {
        const { vnp_TxnRef, vnp_ResponseCode } = req.query;

        if (vnp_ResponseCode !== '00') {
            return res.status(400).json({ success: false });
        }

        // Tìm MainOrder
        const mainOrder = await Order.findById(vnp_TxnRef);
        if (!mainOrder) {
            return res.status(404).json({ success: false });
        }

        const OrderDetail = require('../models/orderDetailModel');

        // ✅ Update MainOrder
        mainOrder.paymentStatus = 'paid';
        await mainOrder.save();

        // ✅ Update tất cả OrderDetails của order này
        await OrderDetail.updateMany(
            { mainOrderId: mainOrder._id },
            { paymentStatus: 'paid' }
        );

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
```

---

## 📱 FRONTEND UPDATES

### SellerConfirmation.jsx

```javascript
// Update để query OrderDetail thay vì Order
const getOrdersForConfirmation = async () => {
    try {
        // ✅ API endpoint mới: /api/orders/seller/details
        const res = await fetch('/api/orders/seller/details?status=pending', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(data.data);
    } catch (err) {
        console.error('Error:', err);
    }
};

// Confirm order detail instead of main order
const handleConfirm = async (orderDetailId) => {
    try {
        const res = await fetch(
            `/api/orders/details/${orderDetailId}/confirm`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        const data = await res.json();
        if (data.success) {
            toast.success('Xác nhận đơn hàng thành công');
            // Refresh list
            getOrdersForConfirmation();
        }
    } catch (err) {
        toast.error('Lỗi xác nhận đơn hàng');
    }
};
```

### SellerOrdersManagement.jsx

```javascript
// Tương tự, update để query OrderDetail
const getOrdersForManagement = async () => {
    try {
        // Query OrderDetail của seller
        const res = await fetch('/api/orders/seller/details', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(data.data);
    } catch (err) {
        console.error('Error:', err);
    }
};
```

---

## 🛣️ IMPLEMENTATION ROADMAP

### Phase 1: Tạo OrderDetail Model & Migration

-   [ ] Tạo `orderDetailModel.js`
-   [ ] Thêm `orderDetails` field vào Order schema
-   [ ] Create database migration (nếu cần)

### Phase 2: Update Order Creation

-   [ ] Sửa `createOrder()` controller
-   [ ] Sửa `validateStockBeforeOrder()`
-   [ ] Test tạo đơn hàng multi-seller

### Phase 3: Update Seller APIs

-   [ ] Sửa `getOrdersForSeller()` → query OrderDetail
-   [ ] Sửa `confirmOrder()` → update OrderDetail
-   [ ] Sửa `shipOrder()` → update OrderDetail
-   [ ] Sửa `deliverOrder()` → update OrderDetail

### Phase 4: Update Payments

-   [ ] Sửa payment callbacks (VNPAY, MOMO)
-   [ ] Update MainOrder + all OrderDetails

### Phase 5: Update Frontend

-   [ ] Update SellerConfirmation.jsx
-   [ ] Update SellerOrdersManagement.jsx
-   [ ] Update order query endpoints

### Phase 6: Testing & Deployment

-   [ ] Unit tests cho OrderDetail
-   [ ] Integration tests multi-seller flow
-   [ ] User acceptance testing

---

## ✅ BENEFITS SAU CẬP NHẬT

| Tính năng                      | Trước                                                                            | Sau                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Query Orders của Seller**    | `Order.find({'items.sellerId': sellerId})` ❌ Chậm                               | `OrderDetail.find({sellerId})` ✅ Nhanh                                  |
| **Tracking Status per Seller** | Không có. Seller A chưa xác nhận nhưng SellerB confirmed → Order status confused | Mỗi seller có status riêng. SellerA pending, SellerB confirmed → rõ ràng |
| **Shipping Tracking**          | 1 order, tracking nào? 2 sellers tại 2 warehouses                                | Mỗi OrderDetail có trackingNumber riêng                                  |
| **Settlement/Payout**          | Không thể tính chia tiền từng seller                                             | Có OrderDetail, dễ tính từng seller nhận bao nhiêu                       |
| **Refund Logic**               | Customer hoàn 1 item → khó tính toán                                             | Hoàn OrderDetail đó → tính refund của seller đó                          |

---

## 🎯 PRIORITY

**GẤP CẬP NHẬT:** Tạo OrderDetail Model + Update createOrder (Phase 1-2)

**Sau đó:** Update Seller APIs (Phase 3)

**Cuối cùng:** Settlement system (tính chia tiền seller)
