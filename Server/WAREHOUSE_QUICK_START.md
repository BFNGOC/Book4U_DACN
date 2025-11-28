# 🚀 QUICK START GUIDE - Warehouse & Order Management

## ⚙️ SETUP - Bước 1: Cập nhật Main Routes

Chắc chắn rằng `/Server/src/routes/index.js` có 2 dòng này:

```javascript
const warehouseRoutes = require('./warehouseRoutes');
const orderManagementRoutes = require('./orderManagementRoutes');

// ...

app.use('/api/warehouse', warehouseRoutes);
app.use('/api/orders', orderManagementRoutes);
```

✅ **Kiểm tra**: Routes đã được thêm vào phần "Continued Session"

---

## 🧪 TESTING - Bước 2: Test Hệ Thống

### Test Scenario 1: Seller Nhập Kho

#### Step 1: Tạo Kho

```bash
curl -X POST http://localhost:5000/api/warehouse/warehouses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "name": "Warehouse TP.HCM",
    "address": "123 Nguyen Hue, District 1",
    "phone": "0912345678",
    "capacity": 5000
  }'
```

**Response:**

```json
{
    "success": true,
    "warehouse": {
        "_id": "warehouse_id_123",
        "name": "Warehouse TP.HCM",
        "capacity": 5000,
        "status": "active",
        "createdAt": "2024-01-20T10:00:00Z"
    }
}
```

#### Step 2: Nhập 100 Cuốn Sách

```bash
curl -X POST http://localhost:5000/api/warehouse/import-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "warehouseId": "warehouse_id_123",
    "bookId": "book_id_456",
    "quantity": 100,
    "reason": "Import from supplier"
  }'
```

**Response:**

```json
{
    "success": true,
    "warehouseStock": {
        "_id": "stock_id",
        "warehouseId": "warehouse_id_123",
        "bookId": "book_id_456",
        "quantity": 100
    },
    "book": {
        "_id": "book_id_456",
        "stock": 100
    },
    "log": {
        "_id": "log_id",
        "type": "import",
        "quantity": 100,
        "quantityBefore": 0,
        "quantityAfter": 100
    }
}
```

✅ **Check:**

-   `WarehouseStock.quantity` = 100
-   `Book.stock` = 100
-   `WarehouseLog.type` = "import"

---

### Test Scenario 2: Khách Tạo Đơn

#### Step 1: Kiểm Tra Stock (Optional)

```bash
curl -X POST http://localhost:5000/api/orders/validate-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "items": [
      {"bookId": "book_id_456", "quantity": 5}
    ]
  }'
```

**Response:**

```json
{
    "allValid": true,
    "validationResults": [
        {
            "bookId": "book_id_456",
            "quantity": 5,
            "available": 100,
            "valid": true
        }
    ]
}
```

#### Step 2: Tạo Đơn

```bash
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "profileId": "customer_profile_123",
    "items": [
      {
        "bookId": "book_id_456",
        "sellerId": "seller_id_789",
        "quantity": 5,
        "price": 150000
      }
    ],
    "totalAmount": 750000,
    "paymentMethod": "COD",
    "shippingAddress": {
      "street": "123 Main",
      "ward": "Ward 1",
      "district": "District 1",
      "city": "HCMC"
    }
  }'
```

**Response:**

```json
{
    "success": true,
    "order": {
        "_id": "order_id_789",
        "status": "pending",
        "items": [
            {
                "bookId": "book_id_456",
                "quantity": 5,
                "price": 150000
            }
        ],
        "totalAmount": 750000
    }
}
```

✅ **Check:**

-   `Order._id` = order_id_789
-   `Order.status` = "pending"
-   `Book.stock` = 95 (100 - 5)
-   `WarehouseStock.quantity` = 95

---

### Test Scenario 3: Khách Hủy Đơn

```bash
curl -X POST http://localhost:5000/api/orders/order_id_789/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "reason": "Changed mind"
  }'
```

**Response:**

```json
{
    "success": true,
    "order": {
        "_id": "order_id_789",
        "status": "cancelled"
    }
}
```

✅ **Check:**

-   `Order.status` = "cancelled"
-   `Book.stock` = 100 (hoàn lại)
-   `WarehouseStock.quantity` = 100

---

## 🧠 TEST RACE CONDITION - Bước 3

### Scenario: 2 Đơn Tạo Cùng Lúc

**Setup:**

-   Stock: 10 cuốn sách
-   Request A: Mua 6 cuốn
-   Request B: Mua 6 cuốn

**Expected Result:**

-   Request A: ✅ Success (stock giảm 6)
-   Request B: ❌ Fail (stock không đủ)

**Test Script:**

```bash
# Terminal 1
curl -X POST http://localhost:5000/api/orders/create \
  -d '{...items: [{quantity: 6}]...}'

# Terminal 2 (cùng lúc)
curl -X POST http://localhost:5000/api/orders/create \
  -d '{...items: [{quantity: 6}]...}'

# Kết quả: 1 thành công, 1 fail
```

---

## 📊 CHECK CONSISTENCY - Bước 4

### Xem Tất Cả Logs

```bash
curl -X GET "http://localhost:5000/api/warehouse/logs?warehouseId=warehouse_id_123" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN"
```

**Response:**

```json
{
    "success": true,
    "logs": [
        {
            "_id": "log_1",
            "type": "import",
            "quantity": 100,
            "quantityBefore": 0,
            "quantityAfter": 100
        },
        {
            "_id": "log_2",
            "type": "order_create",
            "quantity": 5,
            "quantityBefore": 100,
            "quantityAfter": 95,
            "orderId": "order_789"
        },
        {
            "_id": "log_3",
            "type": "order_cancel",
            "quantity": 5,
            "quantityBefore": 95,
            "quantityAfter": 100,
            "orderId": "order_789"
        }
    ]
}
```

✅ **Verify:**

-   `quantityAfter` log này = `quantityBefore` log kế tiếp
-   Stock không bao giờ bị âm

---

## 🔧 TROUBLESHOOTING

### Problem: "Insufficient stock"

```javascript
{
  "success": false,
  "message": "Insufficient stock in warehouse"
}
```

**Solution:**

1. Check `Book.stock` (phải > 0)
2. Check `WarehouseStock.quantity` (phải >= quantity requested)
3. Nhập kho thêm

### Problem: "Stock > 0 required to publish"

```javascript
{
  "success": false,
  "message": "Cannot publish book without stock"
}
```

**Solution:**

-   Nhập kho trước khi đăng bán sách
-   Dùng endpoint `/api/warehouse/import-stock`

### Problem: Transaction failed

```javascript
{
  "success": false,
  "message": "Transaction failed, order not created"
}
```

**Solution:**

-   Check MongoDB connection
-   Verify all data validity
-   Check server logs

---

## 📈 POSTMAN COLLECTION

### Import Collection

1. Mở Postman
2. Click "Import"
3. Select file: `Book4U_Warehouse_Postman.json`
4. Click "Import"

### Setup Environment Variables

1. Click "Environment" (top right)
2. Tạo mới hoặc edit environment
3. Add variables:

```
base_url: http://localhost:5000
token: YOUR_SELLER_JWT_TOKEN
customer_token: YOUR_CUSTOMER_JWT_TOKEN
warehouse_id: WAREHOUSE_ID_FROM_RESPONSE
book_id: BOOK_ID_FROM_DATABASE
customer_profile_id: YOUR_CUSTOMER_PROFILE_ID
order_id: ORDER_ID_FROM_RESPONSE
```

4. Click "Save"

### Test Each Endpoint

1. Go to Collection tab
2. Select "WAREHOUSE MANAGEMENT"
3. Run "Create Warehouse" → Copy `_id` → Set as `warehouse_id`
4. Run "Import Stock" → Verify response
5. Go to "ORDER MANAGEMENT"
6. Run "Validate Stock Before Order"
7. Run "Create Order" → Copy `_id` → Set as `order_id`
8. Run "Cancel Order" → Verify status = "cancelled"

---

## 📝 INTEGRATION CHECKLIST

-   [x] Warehouse schemas created
-   [x] Routes registered
-   [x] Controllers implemented
-   [x] Middleware added
-   [x] Documentation complete
-   [ ] All endpoints tested
-   [ ] Race condition tested
-   [ ] Deployed to staging
-   [ ] Monitor for errors
-   [ ] Production deploy

---

## 🎓 KEY CONCEPTS RECAP

| Concept            | Explanation                                             |
| ------------------ | ------------------------------------------------------- |
| **Book.stock**     | Tổng tồn kho (toàn hệ) - Update khi import/export/order |
| **WarehouseStock** | Tồn kho chi tiết (mỗi kho) - Điểm lấy sách khi order    |
| **WarehouseLog**   | Lịch sử thay đổi - Dùng để audit & hoàn stock order     |
| **Transaction**    | All-or-nothing operation - Ngăn race condition          |
| **Atomic Op**      | MongoDB $inc/$set - Không bị interrupt                  |

---

## 🚨 IMPORTANT NOTES

1. **Always validate stock before order creation** ✅
2. **Use transactions for multi-document updates** ✅
3. **Check logs regularly for inconsistencies** ✅
4. **Don't allow stock ≤ 0 publications** ✅
5. **Keep audit trail for compliance** ✅

---

**Last Updated: 2024-01-20**
