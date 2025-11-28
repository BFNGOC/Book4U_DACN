# Warehouse Management System - API Documentation

## Overview

Hệ thống quản lý kho hàng hoàn chỉnh với:

-   Quản lý kho (CRUD)
-   Nhập/xuất kho
-   Lịch sử giao dịch
-   Quản lý đơn hàng với auto stock deduction

---

## Architecture

### Database Models

#### 1. Profile.warehouses (Embedded)

```javascript
{
  _id: ObjectId,           // Auto-generated
  name: String,            // Tên kho
  street: String,
  ward: String,
  district: String,
  province: String,
  country: String,
  postalCode: String,
  managerName: String,
  managerPhone: String,
  isDefault: Boolean
}
```

#### 2. WarehouseStock

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,      // Từ profile.warehouses[i]._id
  warehouseName: String,      // Cache pattern
  quantity: Number,
  soldCount: Number,
  lastUpdatedStock: Date
}
```

#### 3. WarehouseLog

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  warehouseName: String,
  type: String,               // import|export|order_create|order_cancel
  quantity: Number,
  quantityBefore: Number,
  quantityAfter: Number,
  orderId: ObjectId,
  reason: String,
  performedBy: ObjectId,
  status: String,
  createdAt: Date
}
```

---

## API Endpoints

### Warehouse Management

#### 1. Create Warehouse

```
POST /api/warehouse/warehouses
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  name: "Kho TP.HCM",
  street: "123 Nguyễn Huệ",
  ward: "Phường Bến Nghé",
  district: "Quận 1",
  province: "TP.HCM",
  postalCode: "70000",
  managerName: "Nguyễn Văn A",
  managerPhone: "0901234567"
}

Response (201):
{
  success: true,
  message: "Tạo kho thành công",
  data: { _id, name, street, ... }
}
```

#### 2. Get Warehouses

```
GET /api/warehouse/warehouses
Authorization: Bearer <token>

Response (200):
{
  success: true,
  data: [
    { _id, name, street, ward, district, province, managerName, managerPhone }
  ]
}
```

### Stock Operations

#### 3. Import Stock

```
POST /api/warehouse/import-stock
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  warehouseId: "ObjectId",
  bookId: "ObjectId",
  quantity: 100,
  reason: "Initial import"  // optional
}

Response (201):
{
  success: true,
  message: "Nhập kho thành công",
  data: {
    warehouseStock: { ... },
    book: { _id, title, stock },
    log: { ... }
  }
}

Errors:
- 400: Warehouse not found
- 400: Book not found
- 400: Invalid quantity
```

#### 4. Export Stock

```
POST /api/warehouse/export-stock
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  warehouseId: "ObjectId",
  bookId: "ObjectId",
  quantity: 50,
  reason: "Manual export"  // optional
}

Response (200):
{
  success: true,
  message: "Xuất kho thành công",
  data: {
    warehouseStock: { ... },
    book: { _id, title, stock },
    log: { ... }
  }
}

Errors:
- 400: Warehouse not found
- 400: Insufficient stock
```

### Logs & History

#### 5. Get Warehouse Logs

```
GET /api/warehouse/logs?warehouseId=<id>&type=import&page=1&limit=20
Authorization: Bearer <token>

Query Params:
- warehouseId: ObjectId (optional)
- type: String - import|export|order_create|order_cancel (optional)
- page: number (default: 1)
- limit: number (default: 20)

Response (200):
{
  success: true,
  data: [
    {
      _id, sellerId, bookId, warehouseId, warehouseName,
      type, quantity, quantityBefore, quantityAfter,
      orderId, reason, performedBy, status, createdAt
    }
  ],
  pagination: { page, limit, total, pages }
}
```

#### 6. Get Product Total Stock

```
GET /api/warehouse/product/:bookId/stock
Authorization: Bearer <token>

Response (200):
{
  success: true,
  data: {
    book: { _id, title, bookStock },
    stocks: [
      { warehouseId, warehouseName, quantity, ... }
    ],
    totalStock: 250
  }
}
```

### Order Management

#### 7. Validate Stock Before Order

```
POST /api/orders/validate-stock
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  items: [
    {
      bookId: "ObjectId",
      quantity: 2,
      sellerId: "ObjectId"
    }
  ]
}

Response (200):
{
  success: true,
  allValid: true,
  validationResults: [
    {
      bookId, title, valid, currentStock, requested
    }
  ]
}
```

#### 8. Create Order

```
POST /api/orders/create
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  profileId: "ObjectId",
  items: [
    {
      bookId: "ObjectId",
      sellerId: "ObjectId",
      quantity: 2
    }
  ],
  totalAmount: 500000,
  paymentMethod: "credit_card",
  shippingAddress: {
    street: "...",
    ward: "...",
    district: "...",
    province: "...",
    country: "Vietnam"
  }
}

Response (201):
{
  success: true,
  message: "Tạo đơn hàng thành công. Stock đã được trừ.",
  data: { _id, profileId, items, status, ... }
}

⚠️ Transaction-protected:
- Auto-deducts stock from warehouse
- Creates WarehouseLog entries
- Rolls back if any step fails
```

#### 9. Cancel Order

```
POST /api/orders/:orderId/cancel
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  reason: "Customer changed mind"  // optional
}

Response (200):
{
  success: true,
  message: "Hủy đơn hàng thành công. Stock đã được hoàn lại.",
  data: { _id, status: "cancelled", ... }
}

⚠️ Transaction-protected:
- Restores stock to original warehouse
- Creates order_cancel logs
- Cannot cancel if status is 'completed' or 'shipped'
```

#### 10. Get Order

```
GET /api/orders/:orderId
Authorization: Bearer <token>

Response (200):
{
  success: true,
  data: {
    _id, profileId, items, totalAmount, status, paymentStatus, ...
  }
}
```

#### 11. Get Customer Orders

```
GET /api/orders/user/:profileId?status=pending&page=1&limit=10
Authorization: Bearer <token>

Query Params:
- status: String (optional)
- page: number (default: 1)
- limit: number (default: 10)

Response (200):
{
  success: true,
  data: [ { _id, items, totalAmount, status, ... } ],
  pagination: { page, limit, total, pages }
}
```

---

## Frontend Integration (React)

### Import Service

```javascript
import {
    createWarehouse,
    getWarehousesBySeller,
    importStock,
    exportStock,
    getWarehouseLogs,
    getProductTotalStock,
    validateStockBeforeOrder,
    createOrder,
    cancelOrder,
    getOrder,
    getCustomerOrders,
} from '@/services/api/warehouseApi';
```

### Usage Example

```javascript
// Get warehouses
const res = await getWarehousesBySeller();
if (res.success) {
    setWarehouses(res.data);
}

// Import stock
const importRes = await importStock({
    warehouseId: warehouse._id,
    bookId: book._id,
    quantity: 100,
    reason: 'New purchase',
});

// Get logs
const logsRes = await getWarehouseLogs({
    warehouseId: warehouse._id,
    page: 1,
    limit: 20,
});
```

---

## Key Features

### 1. Cache Pattern for References

-   WarehouseStock & WarehouseLog store `warehouseId + warehouseName`
-   Avoids MongoDB limitation: cannot reference nested array elements
-   Ensures data consistency and fast queries

### 2. Transaction Safety

-   All stock operations use MongoDB sessions
-   Atomic operations prevent race conditions
-   Rollback on any failure

### 3. Audit Trail

-   WarehouseLog tracks all movements
-   Includes quantityBefore/quantityAfter snapshots
-   Links to orders for traceability

### 4. Multi-warehouse Support

-   Each seller can have multiple warehouses
-   Stock tracked per warehouse + per product
-   Query total stock across all warehouses

---

## Error Handling

### Common Errors

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Thiếu thông tin bắt buộc: warehouseId, bookId, quantity"
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Kho không tồn tại hoặc không thuộc về bạn"
}
```

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Bạn phải đăng nhập để thực hiện thao tác này"
}
```

#### 500 Server Error

```json
{
    "success": false,
    "message": "Đã xảy ra lỗi hệ thống"
}
```

---

## Best Practices

### 1. Always Validate Before Import/Export

```javascript
// Check stock first
const validation = await validateStockBeforeOrder({ items });
if (!validation.success) return;

// Then proceed
const result = await importStock(data);
```

### 2. Handle Transaction Rollback

```javascript
try {
    const res = await createOrder(orderData);
    if (res.success) {
        // Success - stock deducted
    } else {
        // Failure - stock not changed
        alert(res.message);
    }
} catch (err) {
    // Network error - transaction rolled back
}
```

### 3. Monitor Warehouse Logs

```javascript
// Regularly fetch logs to audit operations
const logs = await getWarehouseLogs({
    warehouseId: warehouse._id,
    page: 1,
    limit: 50,
});
```

### 4. Use Cache Pattern Data

```javascript
// When storing reference to warehouse
{
  warehouseId: warehouse._id,    // MongoDB ObjectId
  warehouseName: warehouse.name  // String cache
}

// Query without populate
const stocks = await WarehouseStock.find({
  warehouseId: warehouseId
});
// warehouseName already available
```

---

## Testing

### Test Cases

1. **Create Warehouse**

    - ✅ Valid data → warehouse created
    - ❌ Missing fields → 400 error
    - ❌ Not authenticated → 401 error

2. **Import Stock**

    - ✅ Valid import → stock increased
    - ✅ Log created → audit trail recorded
    - ❌ Invalid quantity → 400 error
    - ❌ Warehouse not found → 400 error

3. **Export Stock**

    - ✅ Valid export → stock decreased
    - ❌ Insufficient stock → 400 error
    - ✅ Log created

4. **Create Order**

    - ✅ Order created → stock deducted
    - ✅ Multiple items → each processed
    - ❌ Insufficient stock → transaction rolled back
    - ✅ WarehouseLog entries created

5. **Cancel Order**
    - ✅ Order cancelled → stock restored
    - ✅ Restored to correct warehouse
    - ❌ Already shipped → cannot cancel
    - ✅ Cancel log created

---

## Performance

### Indexes

-   `WarehouseStock`: `(sellerId, bookId, warehouseId)` - UNIQUE
-   `WarehouseLog`: Multiple indexes for fast querying

### Query Optimization

-   Use pagination for logs (limit 20-50)
-   Cache warehouse list in frontend state
-   Use lean() for read-only queries

### Caching

-   Frontend: Cache warehouses in React state
-   Backend: MongoDB indexes on frequently queried fields
-   Cache pattern eliminates N+1 queries

---

## Future Enhancements

1. **Warehouse Name Update Sync**

    - When warehouse name changes, update all WarehouseStock/WarehouseLog entries

2. **Stock Prediction**

    - Analyze logs to predict low stock items

3. **Batch Operations**

    - Bulk import/export from CSV

4. **Real-time Notifications**

    - Alert when stock runs low

5. **Permission Control**
    - Different access levels per warehouse

---
