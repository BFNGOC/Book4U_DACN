# Warehouse Management System - Testing Guide

## Setup

### 1. Prerequisites

-   Seller account with authenticated token
-   Book created and linked to seller
-   Warehouse created for the seller

### 2. Base URL

```
http://localhost:5000/api
```

### 3. Authentication

All endpoints require Bearer token in header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Test Scenarios

### Scenario 1: Create Warehouse (Basic Setup)

**Endpoint:** `POST /warehouse/warehouses`

**Request:**

```bash
curl -X POST http://localhost:5000/api/warehouse/warehouses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kho TP.HCM",
    "street": "123 Nguyễn Huệ",
    "ward": "Phường Bến Nghé",
    "district": "Quận 1",
    "province": "TP.HCM",
    "postalCode": "70000",
    "managerName": "Nguyễn Văn A",
    "managerPhone": "0901234567"
  }'
```

**Expected Response (201):**

```json
{
    "success": true,
    "message": "Tạo kho thành công",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Kho TP.HCM",
        "street": "123 Nguyễn Huệ",
        "ward": "Phường Bến Nghé",
        "district": "Quận 1",
        "province": "TP.HCM",
        "country": "Vietnam",
        "postalCode": "70000",
        "managerName": "Nguyễn Văn A",
        "managerPhone": "0901234567",
        "isDefault": false
    }
}
```

**Save**: `WAREHOUSE_ID = "507f1f77bcf86cd799439011"`

---

### Scenario 2: Get Warehouses

**Endpoint:** `GET /warehouse/warehouses`

**Request:**

```bash
curl -X GET http://localhost:5000/api/warehouse/warehouses \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Kho TP.HCM",
            "street": "123 Nguyễn Huệ",
            "ward": "Phường Bến Nghé",
            "district": "Quận 1",
            "province": "TP.HCM",
            "managerName": "Nguyễn Văn A",
            "managerPhone": "0901234567"
        }
    ]
}
```

---

### Scenario 3: Import Stock

**Endpoint:** `POST /warehouse/import-stock`

**Request:**

```bash
curl -X POST http://localhost:5000/api/warehouse/import-stock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "507f1f77bcf86cd799439011",
    "bookId": "60d5ec49c1234567890abcd1",
    "quantity": 100,
    "reason": "Initial import from supplier"
  }'
```

**Expected Response (201):**

```json
{
    "success": true,
    "message": "Nhập kho thành công",
    "data": {
        "warehouseStock": {
            "_id": "507f1f77bcf86cd799439012",
            "sellerId": "60d5ec49c1234567890abcd0",
            "bookId": "60d5ec49c1234567890abcd1",
            "warehouseId": "507f1f77bcf86cd799439011",
            "warehouseName": "Kho TP.HCM",
            "quantity": 100,
            "soldCount": 0,
            "lastUpdatedStock": "2025-11-28T10:30:00Z"
        },
        "book": {
            "_id": "60d5ec49c1234567890abcd1",
            "title": "Clean Code",
            "stock": 100
        },
        "log": {
            "_id": "507f1f77bcf86cd799439013",
            "type": "import",
            "quantity": 100,
            "quantityBefore": 0,
            "quantityAfter": 100,
            "reason": "Initial import from supplier",
            "warehouseName": "Kho TP.HCM",
            "status": "success",
            "createdAt": "2025-11-28T10:30:00Z"
        }
    }
}
```

**Save**: `BOOK_ID = "60d5ec49c1234567890abcd1"`

---

### Scenario 4: Export Stock

**Endpoint:** `POST /warehouse/export-stock`

**Request:**

```bash
curl -X POST http://localhost:5000/api/warehouse/export-stock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "507f1f77bcf86cd799439011",
    "bookId": "60d5ec49c1234567890abcd1",
    "quantity": 20,
    "reason": "Delivery to customer"
  }'
```

**Expected Response (200):**

```json
{
    "success": true,
    "message": "Xuất kho thành công",
    "data": {
        "warehouseStock": {
            "quantity": 80,
            "lastUpdatedStock": "2025-11-28T10:35:00Z"
        },
        "book": {
            "stock": 80
        },
        "log": {
            "type": "export",
            "quantity": 20,
            "quantityBefore": 100,
            "quantityAfter": 80
        }
    }
}
```

---

### Scenario 5: Get Warehouse Logs

**Endpoint:** `GET /warehouse/logs`

**Request (with filters):**

```bash
curl -X GET "http://localhost:5000/api/warehouse/logs?warehouseId=507f1f77bcf86cd799439011&type=import&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439013",
            "sellerId": "60d5ec49c1234567890abcd0",
            "bookId": {
                "_id": "60d5ec49c1234567890abcd1",
                "title": "Clean Code"
            },
            "warehouseId": "507f1f77bcf86cd799439011",
            "warehouseName": "Kho TP.HCM",
            "type": "import",
            "quantity": 100,
            "quantityBefore": 0,
            "quantityAfter": 100,
            "reason": "Initial import from supplier",
            "status": "success",
            "createdAt": "2025-11-28T10:30:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "pages": 1
    }
}
```

---

### Scenario 6: Get Product Total Stock

**Endpoint:** `GET /warehouse/product/:bookId/stock`

**Request:**

```bash
curl -X GET "http://localhost:5000/api/warehouse/product/60d5ec49c1234567890abcd1/stock" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**

```json
{
    "success": true,
    "data": {
        "book": {
            "_id": "60d5ec49c1234567890abcd1",
            "title": "Clean Code",
            "bookStock": 80
        },
        "stocks": [
            {
                "_id": "507f1f77bcf86cd799439012",
                "sellerId": "60d5ec49c1234567890abcd0",
                "bookId": "60d5ec49c1234567890abcd1",
                "warehouseId": "507f1f77bcf86cd799439011",
                "warehouseName": "Kho TP.HCM",
                "quantity": 80,
                "soldCount": 0
            }
        ],
        "totalStock": 80
    }
}
```

---

### Scenario 7: Validate Stock Before Order

**Endpoint:** `POST /orders/validate-stock`

**Request:**

```bash
curl -X POST http://localhost:5000/api/orders/validate-stock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "bookId": "60d5ec49c1234567890abcd1",
        "quantity": 5,
        "sellerId": "60d5ec49c1234567890abcd0"
      }
    ]
  }'
```

**Expected Response (200):**

```json
{
    "success": true,
    "allValid": true,
    "validationResults": [
        {
            "bookId": "60d5ec49c1234567890abcd1",
            "title": "Clean Code",
            "valid": true,
            "currentStock": 80
        }
    ]
}
```

---

### Scenario 8: Create Order (Stock Auto-Deduction)

**Endpoint:** `POST /orders/create`

**Request:**

```bash
curl -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "60d5ec49c1234567890abcd2",
    "items": [
      {
        "bookId": "60d5ec49c1234567890abcd1",
        "sellerId": "60d5ec49c1234567890abcd0",
        "quantity": 5
      }
    ],
    "totalAmount": 250000,
    "paymentMethod": "credit_card",
    "shippingAddress": {
      "street": "456 Lê Lợi",
      "ward": "Phường Bến Thành",
      "district": "Quận 1",
      "province": "TP.HCM",
      "country": "Vietnam"
    }
  }'
```

**Expected Response (201):**

```json
{
    "success": true,
    "message": "Tạo đơn hàng thành công. Stock đã được trừ.",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "profileId": "60d5ec49c1234567890abcd2",
        "items": [
            {
                "bookId": "60d5ec49c1234567890abcd1",
                "sellerId": "60d5ec49c1234567890abcd0",
                "quantity": 5
            }
        ],
        "totalAmount": 250000,
        "paymentMethod": "credit_card",
        "status": "pending",
        "paymentStatus": "unpaid",
        "createdAt": "2025-11-28T10:40:00Z"
    }
}
```

**Save**: `ORDER_ID = "507f1f77bcf86cd799439020"`

**Verify Stock Changed:**

```bash
# Check logs - should have order_create entry
curl -X GET "http://localhost:5000/api/warehouse/logs?type=order_create" \
  -H "Authorization: Bearer <token>"

# Check product stock - should be 75 (80 - 5)
curl -X GET "http://localhost:5000/api/warehouse/product/60d5ec49c1234567890abcd1/stock" \
  -H "Authorization: Bearer <token>"
```

---

### Scenario 9: Cancel Order (Stock Restoration)

**Endpoint:** `POST /orders/:orderId/cancel`

**Request:**

```bash
curl -X POST "http://localhost:5000/api/orders/507f1f77bcf86cd799439020/cancel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer changed mind"
  }'
```

**Expected Response (200):**

```json
{
    "success": true,
    "message": "Hủy đơn hàng thành công. Stock đã được hoàn lại.",
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "status": "cancelled",
        "updatedAt": "2025-11-28T10:45:00Z"
    }
}
```

**Verify Stock Restored:**

```bash
# Check product stock - should be back to 80
curl -X GET "http://localhost:5000/api/warehouse/product/60d5ec49c1234567890abcd1/stock" \
  -H "Authorization: Bearer <token>"

# Check logs - should have order_cancel entry
curl -X GET "http://localhost:5000/api/warehouse/logs?type=order_cancel" \
  -H "Authorization: Bearer <token>"
```

---

### Scenario 10: Get Order

**Endpoint:** `GET /orders/:orderId`

**Request:**

```bash
curl -X GET "http://localhost:5000/api/orders/507f1f77bcf86cd799439020" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**

```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439020",
        "profileId": "60d5ec49c1234567890abcd2",
        "items": [
            {
                "bookId": {
                    "_id": "60d5ec49c1234567890abcd1",
                    "title": "Clean Code",
                    "author": "Robert C. Martin"
                },
                "quantity": 5,
                "sellerId": "60d5ec49c1234567890abcd0"
            }
        ],
        "totalAmount": 250000,
        "status": "cancelled",
        "paymentStatus": "unpaid"
    }
}
```

---

### Scenario 11: Get Customer Orders

**Endpoint:** `GET /orders/user/:profileId`

**Request:**

```bash
curl -X GET "http://localhost:5000/api/orders/user/60d5ec49c1234567890abcd2?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Expected Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "_id": "507f1f77bcf86cd799439020",
            "items": [{ "bookId": "...", "quantity": 5 }],
            "totalAmount": 250000,
            "status": "cancelled",
            "createdAt": "2025-11-28T10:40:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "pages": 1
    }
}
```

---

## Error Test Cases

### Test 1: Import with Missing Warehouse

**Request:**

```bash
curl -X POST http://localhost:5000/api/warehouse/import-stock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "invalid_id",
    "bookId": "60d5ec49c1234567890abcd1",
    "quantity": 100
  }'
```

**Expected Response (400):**

```json
{
    "success": false,
    "message": "Kho không tồn tại hoặc không thuộc về bạn"
}
```

---

### Test 2: Export More Than Available

**Request:**

```bash
curl -X POST http://localhost:5000/api/warehouse/export-stock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "507f1f77bcf86cd799439011",
    "bookId": "60d5ec49c1234567890abcd1",
    "quantity": 999
  }'
```

**Expected Response (400):**

```json
{
    "success": false,
    "message": "Tồn kho không đủ. Tồn: 80, Cần: 999"
}
```

---

### Test 3: Create Order with Insufficient Stock

**Request:**

```bash
curl -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "60d5ec49c1234567890abcd2",
    "items": [
      {
        "bookId": "60d5ec49c1234567890abcd1",
        "sellerId": "60d5ec49c1234567890abcd0",
        "quantity": 999
      }
    ],
    "totalAmount": 5000000,
    "paymentMethod": "credit_card",
    "shippingAddress": { ... }
  }'
```

**Expected Response (400):**

```json
{
    "success": false,
    "message": "Sản phẩm 60d5ec49c1234567890abcd1 không đủ tồn kho"
}
```

**Verify**: Stock should NOT change (transaction rolled back)

---

### Test 4: Cancel Non-Existent Order

**Request:**

```bash
curl -X POST "http://localhost:5000/api/orders/invalid_id/cancel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Test" }'
```

**Expected Response (400):**

```json
{
    "success": false,
    "message": "Đơn hàng không tồn tại"
}
```

---

### Test 5: Unauthorized Access

**Request (no token):**

```bash
curl -X GET http://localhost:5000/api/warehouse/warehouses
```

**Expected Response (401):**

```json
{
    "success": false,
    "message": "Bạn phải đăng nhập để thực hiện thao tác này"
}
```

---

## Performance Testing

### Bulk Import Test

```bash
# Import 1000 items quickly
for i in {1..1000}; do
  curl -X POST http://localhost:5000/api/warehouse/import-stock \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d "{
      \"warehouseId\": \"507f1f77bcf86cd799439011\",
      \"bookId\": \"60d5ec49c1234567890abcd1\",
      \"quantity\": 1,
      \"reason\": \"Bulk import test $i\"
    }" &
done
wait
```

**Monitor**: Check if all complete successfully without race conditions

---

## Postman Collection

### Export to Postman

1. Create new collection: "Warehouse Management"
2. Add requests for each endpoint
3. Set variables: `{{TOKEN}}`, `{{WAREHOUSE_ID}}`, `{{BOOK_ID}}`, `{{ORDER_ID}}`
4. Use pre-request scripts to extract IDs from responses

### Example Pre-request Script

```javascript
// After creating warehouse, save ID
const jsonResponse = pm.response.json();
pm.environment.set('WAREHOUSE_ID', jsonResponse.data._id);
```

---

## Checklist

-   [ ] Create warehouse
-   [ ] Get warehouses list
-   [ ] Import stock
-   [ ] Export stock
-   [ ] View logs
-   [ ] Get product total stock
-   [ ] Validate stock before order
-   [ ] Create order (verify stock deduction)
-   [ ] Check logs for order_create entry
-   [ ] Cancel order (verify stock restoration)
-   [ ] Check logs for order_cancel entry
-   [ ] Get order details
-   [ ] Get customer orders
-   [ ] Test error cases
-   [ ] Test race conditions
-   [ ] Performance test

---
