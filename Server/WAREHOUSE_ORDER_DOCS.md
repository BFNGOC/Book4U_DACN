# 📦 HỆ THỐNG QUẢN LÝ KHO VÀ ĐƠN HÀNG - HƯỚNG DẪN CHI TIẾT

## 🎯 Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT/FRONTEND                            │
└────────────┬────────────────────────────────────────────┬───┘
             │                                            │
         SELLER                                      CUSTOMER
             │                                            │
    ┌────────▼──────────┐                    ┌────────────▼────────┐
    │  Warehouse Mgmt    │                    │  Order Creation     │
    │  - Create warehouse│                    │  - Validate stock   │
    │  - Import stock    │                    │  - Create order     │
    │  - Export stock    │                    │  - Cancel order     │
    │  - View logs       │                    │  - View orders      │
    └────────┬──────────┘                    └────────────┬────────┘
             │                                            │
             └────────────────┬───────────────────────────┘
                              │
         ┌────────────────────▼────────────────────────┐
         │         BACKEND API (Node.js)               │
         │                                             │
         │  Controllers:                               │
         │  - warehouseController                      │
         │  - orderManagementController                │
         │                                             │
         │  Middlewares:                               │
         │  - stockValidateMiddleware                  │
         │                                             │
         │  Services:                                  │
         │  - stockManagementService                   │
         └────────────────────┬────────────────────────┘
                              │
         ┌────────────────────▼────────────────────────┐
         │        MONGODB COLLECTIONS                  │
         │                                             │
         │  - Book (stock: tổng tồn toàn hệ)          │
         │  - WarehouseStock (tồn theo kho)           │
         │  - WarehouseLog (lịch sử)                  │
         │  - Order (đơn hàng)                        │
         │  - Warehouse (thông tin kho)               │
         └─────────────────────────────────────────────┘
```

---

## 📊 SCHEMA CHI TIẾT

### 1️⃣ **Book Model** (Hiện tại)

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,           // Seller chủ sở hữu
  title: String,                // Tên sách
  author: String,               // Tác giả
  price: Number,                // Giá
  stock: Number,                // ✅ TỔNG tồn kho (tất cả kho)
  discount: Number,
  images: [String],
  tags: [String],
  soldCount: Number,            // Số đã bán
  ...
  createdAt, updatedAt
}
```

**Giải thích:**

-   `stock` là **tổng tồn kho trên toàn hệ thống**
-   Được cập nhật khi import/export/tạo đơn/hủy đơn
-   **Canonical source** cho validation

---

### 2️⃣ **WarehouseStock Model (MỚI)**

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,           // Seller
  bookId: ObjectId,             // Sách
  warehouseId: ObjectId,        // Kho
  quantity: Number,             // ✅ TỒN KHO TRONG KHO NÀY
  soldCount: Number,            // Số đã bán từ kho này
  lastUpdatedStock: Date,       // Lần update cuối
  createdAt, updatedAt
}

// UNIQUE INDEX: (sellerId, bookId, warehouseId)
// ✅ 1 seller không thể có 2 bản ghi cùng product + warehouse
```

**Giải thích:**

-   Đây là chi tiết: **Kho A có 100 cái sách X, Kho B có 50 cái**
-   **Distributed stock**: Seller có thể quản lý nhiều kho
-   Tổng: `WarehouseStock.quantity` từ tất cả kho = `Book.stock`

**Quan hệ:**

```
Book.stock = Σ WarehouseStock[i].quantity
           (với tất cả kho của seller)

Ví dụ:
- Kho TP.HCM: 100 cái sách A
- Kho Hà Nội: 50 cái sách A
- Book.stock = 150
```

---

### 3️⃣ **WarehouseLog Model (MỚI)**

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  type: 'import'|'export'|'order_create'|'order_cancel'|'return'|'damage'|'adjustment',
  quantity: Number,             // Số lượng thay đổi
  quantityBefore: Number,       // Tồn TRƯỚC
  quantityAfter: Number,        // Tồn SAU
  orderId: ObjectId,            // Nếu từ order
  reason: String,               // Ghi chú
  performedBy: ObjectId,        // Người thực hiện
  status: 'success'|'failed'|'reversed',
  createdAt, updatedAt
}
```

**Giải thích:**

-   **Audit trail**: Ghi nhận tất cả thay đổi stock
-   `quantityBefore/After`: Snapshot để verify consistency
-   `type`: Phân loại hoạt động
-   Dùng để truy vết, kiểm toán, báo cáo

**Ví dụ Log:**

```javascript
// Import 100 sách
{
  type: 'import',
  quantity: 100,
  quantityBefore: 0,
  quantityAfter: 100,
  reason: 'Import from supplier A',
  createdAt: '2024-01-20'
}

// Tạo đơn (trừ 5)
{
  type: 'order_create',
  quantity: 5,
  quantityBefore: 100,
  quantityAfter: 95,
  orderId: 'order123',
  reason: 'Order order123',
  createdAt: '2024-01-21'
}

// Hủy đơn (hoàn 5)
{
  type: 'order_cancel',
  quantity: 5,
  quantityBefore: 95,
  quantityAfter: 100,
  orderId: 'order123',
  reason: 'User cancelled',
  createdAt: '2024-01-22'
}
```

---

### 4️⃣ **Warehouse Model (MỚI)**

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,           // Seller chủ sở hữu
  name: String,                 // "Kho TP.HCM", "Kho Hà Nội"
  address: String,              // Địa chỉ
  phone: String,                // Liên lạc
  capacity: Number,             // Dung lượng tối đa (default 10000)
  status: 'active'|'inactive'|'maintenance',
  notes: String,
  createdAt, updatedAt
}
```

**Giải thích:**

-   Đại diện cho 1 kho vật lý
-   1 seller có thể có nhiều kho
-   Chứa thông tin vị trí, dung lượng, tình trạng

---

## 🔄 WORKFLOW - NHẬP KHO

### Flow: Seller nhập 100 sách vào Kho TP.HCM

```
1. POST /api/warehouse/import-stock
   {
     warehouseId: "kho_tphcm",
     bookId: "sach_lap_trinh",
     quantity: 100,
     reason: "Import from supplier"
   }

2. Backend kiểm tra:
   ✓ Kho tồn tại & thuộc seller
   ✓ Sách tồn tại & thuộc seller

3. Start MongoDB Transaction
   ↓
4. Tìm WarehouseStock:
   - Nếu chưa có → Tạo mới với quantity=100
   - Nếu có → Update quantity = 100 + 100 = 200
   ↓
5. Cập nhật Book.stock:
   - stock += 100 (atomic increment)
   ↓
6. Tạo WarehouseLog:
   {
     type: 'import',
     quantity: 100,
     quantityBefore: 0 (hoặc số cũ),
     quantityAfter: 100,
     reason: "Import from supplier"
   }
   ↓
7. Commit transaction (✅ tất cả hoặc không có gì)

8. Response:
   {
     warehouseStock: {...},     // Updated
     book: {...},               // Updated
     log: {...}
   }
```

**Kết quả:**

-   ✅ WarehouseStock.quantity = 100
-   ✅ Book.stock tăng 100
-   ✅ Log ghi nhận import
-   ✅ Seller có thể bán 100 cái

---

## 🔄 WORKFLOW - XUẤT KHO (KHÔNG VƯỢT TỒN)

### Flow: Seller xuất 5 sách từ kho

```
1. POST /api/warehouse/export-stock
   {
     warehouseId: "kho_tphcm",
     bookId: "sach_lap_trinh",
     quantity: 5,
     reason: "Manual export"
   }

2. Kiểm tra:
   ✓ Kho & sách tồn tại
   ✓ WarehouseStock.quantity >= 5 ❌ NẾU KHÔNG → REJECT
   ✓ Book.stock >= 5

3. Start transaction
   ↓
4. Giảm WarehouseStock:
   - quantity = 100 - 5 = 95
   ↓
5. Giảm Book.stock:
   - stock -= 5
   ↓
6. Tạo log:
   {
     type: 'export',
     quantity: 5,
     quantityBefore: 100,
     quantityAfter: 95,
     reason: "Manual export"
   }
   ↓
7. Commit

✅ RESULT: Kho giảm 5, Book giảm 5, log ghi nhận
```

**Bảo vệ tính toàn vẹn:**

-   ❌ **NẾU STOCK KHÔNG ĐỦ → REJECT NGAY**
-   Không cho xuất vượt tồn

---

## 🔄 WORKFLOW - TẠO ĐƠN HÀNG

### Flow: Khách tạo đơn mua 5 sách

```
1. Client kiểm tra stock (optional)
   POST /api/orders/validate-stock
   {
     items: [
       { bookId: "sach_1", quantity: 5 },
       { bookId: "sach_2", quantity: 3 }
     ]
   }
   → Response: {allValid: true, ...}

2. Tạo đơn
   POST /api/orders/create
   {
     profileId: "customer123",
     items: [
       { bookId: "sach_1", quantity: 5, sellerId: "seller_a" },
       { bookId: "sach_2", quantity: 3, sellerId: "seller_b" }
     ],
     totalAmount: 500000,
     paymentMethod: "COD",
     shippingAddress: {...}
   }

3. Backend:
   ✓ Validate stock từng item:
     - Book.stock >= quantity?

4. Start transaction
   ↓
5. Tạo Order document
   {
     status: 'pending',
     paymentStatus: 'unpaid',
     items: [...],
     ...
   }
   ↓
6. Với TỪNG item:
   a) Tìm WarehouseStock có tồn kho (quantity >= needed)
   b) Kiểm tra lại (2nd check)
   c) Trừ WarehouseStock.quantity
   d) Trừ Book.stock
   e) Tạo WarehouseLog (type=order_create)
   ↓
7. Commit transaction

✅ RESULT:
- Order tạo thành công
- Stock đã được trừ
- Log ghi nhận
```

**Kết quả:**

```
Trước:
- Book.stock = 100
- WarehouseStock.quantity = 100

Sau tạo đơn 5:
- Book.stock = 95
- WarehouseStock.quantity = 95
- Order status = pending
```

---

## 🔄 WORKFLOW - HỦY ĐƠN HÀNG

### Flow: Khách hủy đơn (hoàn stock)

```
1. POST /api/orders/:orderId/cancel
   {
     reason: "Customer changed mind"
   }

2. Backend:
   ✓ Order tồn tại
   ✓ Status != 'completed' (đã hoàn) hoặc 'shipped' (đang giao)

3. Start transaction
   ↓
4. Lấy logs của order này (type=order_create):
   - Biết là từ kho nào, sách nào, bao nhiêu
   ↓
5. Với TỪNG log:
   a) Tìm WarehouseStock từ log (biết warehouseId)
   b) Thêm lại quantity
   c) Thêm lại Book.stock
   d) Tạo log hoàn (type=order_cancel)
   ↓
6. Cập nhật Order.status = 'cancelled'
   ↓
7. Commit

✅ RESULT:
- Stock hoàn đúng kho
- Order cancelled
- Log ghi nhận
```

**Kết quả:**

```
Sau hủy:
- Book.stock = 100 (hoàn lại)
- WarehouseStock.quantity = 100
- Order status = cancelled
```

---

## ⚡ CHỐNG RACE CONDITION - CHI TIẾT KỸ THUẬT

### Vấn đề Race Condition

```
Scenario: 2 request tạo đơn cùng lúc, mỗi đơn mua 51 cái (tồn 100)

Timeline:
T0  Request A: Read Book.stock = 100
    Request B: Read Book.stock = 100
T1  A check: 100 >= 51? YES
    B check: 100 >= 51? YES
T2  A update: stock = 100 - 51 = 49
    B update: stock = 100 - 51 = 49  ❌ WRONG! Phải 98
T3  Result: Cả 2 đơn được tạo, nhưng stock = 49 (lost 51!)

❌ LOST UPDATE: Mất dữ liệu!
```

### Giải Pháp 1: Atomic Operations

```javascript
// ❌ WRONG - Not atomic
const stock = await Book.findById(bookId);
if (stock.value >= quantity) {
    stock.value -= quantity;
    await stock.save(); // Race condition here!
}

// ✅ RIGHT - Atomic
const result = await Book.findByIdAndUpdate(
    bookId,
    { $inc: { stock: -quantity } },
    { new: true }
);
// MongoDB ensures this is atomic at DB level
```

**Cách hoạt động:**

-   MongoDB **lock document** khi update
-   Request B phải **đợi** Request A xong
-   Không có overlap → No race condition

---

### Giải Pháp 2: Transactions (Cho Multiple Documents)

```javascript
// Khi cần update 2+ documents đồng thời
const session = await db.startSession();
await session.startTransaction();

try {
  // Tất cả ops này là atomic
  await WarehouseStock.updateOne({...}, {...}, {session});
  await Book.updateOne({...}, {...}, {session});
  await WarehouseLog.create({...}, {session});

  await session.commitTransaction();
  // ✅ Tất cả được lưu hoặc KHÔNG có gì lưu
} catch (err) {
  await session.abortTransaction();
  // ❌ Roll back tất cả nếu lỗi
}
```

**Đảm bảo:**

-   **All or nothing**: Không có half-updated state
-   **Consistency**: Dữ liệu luôn nhất quán
-   **Isolation**: Requests không can thiệp nhau

---

### Giải Pháp 3: Conditional Checks

```javascript
// Check stock INSIDE transaction, không ngoài
const result = await WarehouseStock.findOneAndUpdate(
    {
        warehouseId,
        bookId,
        quantity: { $gte: neededQuantity }, // ⚠️ Condition here
    },
    {
        $inc: { quantity: -neededQuantity },
    },
    { new: true }
);

if (!result) {
    throw new Error('Not enough stock');
}
// ✅ Guaranteed: Nếu find thành công, update thành công
```

**Cách hoạt động:**

-   **Atomic find & update**: Nếu điều kiện không đúng lúc update → không update
-   Không cần check riêng trước

---

## 📝 VALIDATE - STOCK = 0 KHI BÁN

### Middleware: validateStockBeforePublish

```javascript
// router.post('/books', validateStockBeforePublish, createBook)

// Nếu stock <= 0 → Reject
if (!req.body.stock || req.body.stock <= 0) {
    return res.status(400).json({
        success: false,
        message: 'Không thể đăng bán với stock = 0. Nhập kho trước.',
        requiresStockImport: true,
    });
}
```

**Flow:**

```
Seller muốn đăng sách
  ↓
Middleware kiểm tra stock
  ↓
stock > 0?
  ├─ YES → Cho tạo sách
  └─ NO → Reject, yêu cầu nhập kho
```

---

## 🔍 API ENDPOINTS

### 🏭 Warehouse Management

```
1. TẠO KHO
   POST /api/warehouse/warehouses
   Body: {
     name: "Kho TP.HCM",
     address: "123 Nguyễn Huệ",
     phone: "0912345678",
     capacity: 10000
   }
   Response: { warehouse }

2. DANH SÁCH KHO
   GET /api/warehouse/warehouses
   Response: [warehouse, warehouse, ...]

3. NHẬP KHO
   POST /api/warehouse/import-stock
   Body: {
     warehouseId: "...",
     bookId: "...",
     quantity: 100,
     reason: "Import from supplier"
   }
   Response: { warehouseStock, book, log }

4. XUẤT KHO
   POST /api/warehouse/export-stock
   Body: {
     warehouseId: "...",
     bookId: "...",
     quantity: 5,
     reason: "Manual export"
   }
   Response: { warehouseStock, book, log }

5. LỊCH SỬ
   GET /api/warehouse/logs?warehouseId=...&type=import&page=1
   Response: { logs, pagination }

6. TỒN KHO SẢN PHẨM
   GET /api/warehouse/product/:bookId/stock
   Response: {
     book: {...},
     stocks: [{warehouseId, quantity}, ...],
     totalStock: 150
   }
```

### 📦 Order Management

```
1. KIỂM TRA STOCK
   POST /api/orders/validate-stock
   Body: {
     items: [
       { bookId: "...", quantity: 5 },
       { bookId: "...", quantity: 3 }
     ]
   }
   Response: { allValid: true, validationResults: [...] }

2. TẠO ĐƠN
   POST /api/orders/create
   Body: {
     profileId: "...",
     items: [{bookId, sellerId, quantity, price}, ...],
     totalAmount: 500000,
     paymentMethod: "COD",
     shippingAddress: {...}
   }
   Response: { order }

3. HỦY ĐƠN
   POST /api/orders/:orderId/cancel
   Body: {
     reason: "User cancelled"
   }
   Response: { order }

4. LẤY ĐƠN
   GET /api/orders/:orderId
   Response: { order }

5. DANH SÁCH ĐƠN
   GET /api/orders/user/:profileId?status=pending&page=1
   Response: { orders, pagination }
```

---

## 📊 CONSISTENCY CHECK

### Kiểm tra consistency

```javascript
// Nghi ngờ stock không khớp?
const service = require('./stockManagementService');
const result = await service.checkConsistency(bookId, sellerId);

// Result:
{
  consistent: false,
  bookStock: 100,
  warehouseTotal: 95,
  difference: 5,  // ⚠️ Lệch 5
  inconsistency: "Book.stock=100 ≠ WarehouseTotal=95"
}

// FIX: Admin có thể điều chỉnh tay (nếu cần)
```

---

## ✅ CHECKLIST TRIỂN KHAI

-   [x] Tạo schemas (Warehouse, WarehouseStock, WarehouseLog)
-   [x] Tạo controllers (warehouse, order management)
-   [x] Tạo routes
-   [x] Tạo services & middleware
-   [x] Cập nhật main routes
-   [ ] Test tất cả endpoints
-   [ ] Test race condition scenarios
-   [ ] Test consistency checks
-   [ ] Deploy lên staging
-   [ ] Monitor & collect feedback
-   [ ] Deploy production

---

## 🚀 NEXT STEPS

1. **Test API**: Import Postman collection
2. **Load test**: Simulate concurrent orders
3. **Monitor**: Watch for consistency issues
4. **Backup**: Regular MongoDB backups
5. **Alerts**: Email alerts nếu stock = 0

---

**Tài liệu v1.0 - 2024**
