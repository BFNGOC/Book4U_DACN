# 🧪 TEST SCENARIOS - Warehouse & Order Management

## Mục Đích

File này cung cấp các test cases và scripts để xác minh:

1. Tất cả endpoints hoạt động đúng
2. Không có race conditions
3. Stock consistency được bảo vệ
4. Transactions hoạt động atomically

---

## 📋 TEST 1: Basic Warehouse Operations

### Scenario 1.1: Create Warehouse

```
Title: Seller creates a warehouse
Precondition: Seller is authenticated
Steps:
1. POST /api/warehouse/warehouses
   {
     "name": "Main Warehouse",
     "address": "123 Main St",
     "phone": "0912345678",
     "capacity": 5000,
     "status": "active"
   }

Expected Result:
- HTTP 201
- Response includes warehouse._id
- warehouse.status = "active"
- warehouse.capacity = 5000

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 1.2: List Warehouses

```
Title: Seller retrieves their warehouses
Precondition: Warehouse exists for seller
Steps:
1. GET /api/warehouse/warehouses
   Headers: Authorization: Bearer {token}

Expected Result:
- HTTP 200
- Returns array of warehouses
- Array length >= 1
- Each warehouse has sellerId matching current seller

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 📋 TEST 2: Stock Import/Export

### Scenario 2.1: Import Stock Successfully

```
Title: Seller imports 100 books into warehouse
Precondition:
- Warehouse exists
- Book exists
- Stock = 0 initially

Steps:
1. POST /api/warehouse/import-stock
   {
     "warehouseId": "{warehouse_id}",
     "bookId": "{book_id}",
     "quantity": 100,
     "reason": "Import from supplier"
   }

Verify After:
1. Response.warehouseStock.quantity = 100 ✓
2. Database Book.stock = 100 ✓
3. Database WarehouseLog created with type='import' ✓
4. WarehouseLog.quantityBefore = 0 ✓
5. WarehouseLog.quantityAfter = 100 ✓

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 2.2: Export Stock Successfully

```
Title: Seller exports 5 books from warehouse
Precondition:
- Warehouse has 100 books
- Book.stock = 100

Steps:
1. POST /api/warehouse/export-stock
   {
     "warehouseId": "{warehouse_id}",
     "bookId": "{book_id}",
     "quantity": 5,
     "reason": "Manual adjustment"
   }

Verify After:
1. Response.warehouseStock.quantity = 95 ✓
2. Database Book.stock = 95 ✓
3. Database WarehouseLog created with type='export' ✓
4. WarehouseLog shows: before=100, after=95 ✓

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 2.3: Export Fails - Insufficient Stock

```
Title: Seller tries to export more than available
Precondition:
- Warehouse has 10 books
- Seller requests to export 15

Steps:
1. POST /api/warehouse/export-stock
   {
     "warehouseId": "{warehouse_id}",
     "bookId": "{book_id}",
     "quantity": 15
   }

Expected Result:
- HTTP 400 or 422
- Response.success = false
- Response.message contains "Insufficient stock"
- NO changes to database

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 📋 TEST 3: Order Creation & Stock Deduction

### Scenario 3.1: Create Order - Single Item

```
Title: Customer creates order for 5 books
Precondition:
- Book has stock = 100
- Warehouse has 100 books
- Customer authenticated

Steps:
1. POST /api/orders/validate-stock
   {
     "items": [{"bookId": "{book_id}", "quantity": 5}]
   }
   Expected: { "allValid": true }

2. POST /api/orders/create
   {
     "profileId": "{customer_profile}",
     "items": [{
       "bookId": "{book_id}",
       "sellerId": "{seller_id}",
       "quantity": 5,
       "price": 150000
     }],
     "totalAmount": 750000,
     "paymentMethod": "COD",
     "shippingAddress": {...}
   }

Verify After:
1. Response.order._id exists ✓
2. Response.order.status = "pending" ✓
3. Response.order.paymentStatus = "unpaid" ✓
4. Database Book.stock = 95 ✓
5. Database WarehouseStock.quantity = 95 ✓
6. Database WarehouseLog created with type='order_create' ✓
7. WarehouseLog.orderId = {order_id} ✓

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 3.2: Create Order - Multiple Items (Multiple Sellers)

```
Title: Customer creates order with books from 2 sellers
Precondition:
- Book A (seller 1): stock = 50
- Book B (seller 2): stock = 30

Steps:
1. POST /api/orders/create
   {
     "items": [
       {
         "bookId": "{book_a_id}",
         "sellerId": "{seller_1_id}",
         "quantity": 10,
         "price": 100000
       },
       {
         "bookId": "{book_b_id}",
         "sellerId": "{seller_2_id}",
         "quantity": 5,
         "price": 150000
       }
     ],
     "totalAmount": 1750000,
     ...
   }

Verify After:
1. Order.items.length = 2 ✓
2. Book A stock = 40 ✓
3. Book B stock = 25 ✓
4. WarehouseLog entries = 2 (one per seller) ✓
5. Both logs linked to same order._id ✓

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 3.3: Create Order Fails - Insufficient Stock

```
Title: Customer tries to buy more than available
Precondition:
- Book stock = 5
- Customer wants 10

Steps:
1. POST /api/orders/create with quantity=10

Expected Result:
- HTTP 400
- Response.success = false
- Response.message contains "stock"
- NO Order created
- Book.stock still = 5

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 📋 TEST 4: Order Cancellation & Stock Restoration

### Scenario 4.1: Cancel Order - Stock Restored

```
Title: Customer cancels order, stock should return
Precondition:
- Order exists with 5 books
- Book.stock = 95 (after order)
- WarehouseStock.quantity = 95

Steps:
1. POST /api/orders/{order_id}/cancel
   { "reason": "Changed mind" }

Verify After:
1. Response.order.status = "cancelled" ✓
2. Book.stock = 100 ✓
3. WarehouseStock.quantity = 100 ✓
4. WarehouseLog type='order_cancel' created ✓
5. order_cancel log.quantityBefore = 95 ✓
6. order_cancel log.quantityAfter = 100 ✓

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 4.2: Cancel Order - Multi-Seller

```
Title: Cancel order with items from multiple sellers
Precondition:
- Order has items from Seller A + Seller B
- Stock already deducted from both

Steps:
1. POST /api/orders/{order_id}/cancel

Verify After:
1. Seller A's stock restored ✓
2. Seller B's stock restored ✓
3. Both WarehouseLog entries created ✓

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 4.3: Cannot Cancel Completed Order

```
Title: Customer tries to cancel shipped/completed order
Precondition:
- Order.status = "shipped"

Steps:
1. POST /api/orders/{order_id}/cancel

Expected Result:
- HTTP 400
- Response message = "Cannot cancel shipped order"
- Stock NOT modified

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 🚨 TEST 5: RACE CONDITION SCENARIOS

### Scenario 5.1: Concurrent Orders - Limited Stock

```
Title: 2 customers try to buy same product simultaneously
Setup:
- Book stock = 10
- Customer A wants to buy 6
- Customer B wants to buy 6
- Both requests sent at same time

Expected Behavior:
- First request: ✓ Succeeds (stock = 4)
- Second request: ✗ Fails (insufficient stock)
OR
- First request: ✓ Succeeds (stock = 4)
- Second request: ✓ Succeeds for 4 items only
OR
- First request: ✓ Succeeds (stock = 4)
- Second request: ✗ Completely fails

❌ WRONG BEHAVIOR: Both succeed (stock = -2)

Test Command:
bash concurrent_order_test.sh (see below)

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

**Script: concurrent_order_test.sh**

```bash
#!/bin/bash

TOKEN="your_token"
BOOK_ID="your_book_id"
BASE_URL="http://localhost:5000"

# Create test order 1
curl -X POST $BASE_URL/api/orders/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"bookId": "'$BOOK_ID'", "quantity": 6}],
    "totalAmount": 600000,
    ...
  }' &

# Create test order 2 (simultaneously)
curl -X POST $BASE_URL/api/orders/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"bookId": "'$BOOK_ID'", "quantity": 6}],
    "totalAmount": 600000,
    ...
  }' &

wait
echo "Both requests completed"
```

### Scenario 5.2: Concurrent Import + Order

```
Title: Seller imports stock while customer creates order
Setup:
- Initial stock = 0
- Thread A: Import 50 items
- Thread B: Create order for 30 items (at same moment)

Expected Outcomes:
Option 1: Both succeed (stock = 20)
Option 2: Import succeeds, order fails (stock = 50)
Option 3: Order fails, then import succeeds (stock = 50)

❌ WRONG: Both succeed with inconsistent stock

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 📋 TEST 6: Data Consistency

### Scenario 6.1: Verify Stock Consistency

```
Title: Check that Book.stock = sum(WarehouseStock.quantity)
Precondition:
- Multiple warehouses with stock
- Multiple orders created/cancelled

Steps:
1. Retrieve Book.stock for book_id
2. Query all WarehouseStock for this book
3. Sum all quantities
4. Calculate: Book.stock should = SUM(WarehouseStock.quantity)

Expected Result:
- Consistency check passes
- No discrepancies

Actual Result: _______________
Book.stock: ___
WarehouseStock sum: ___
Consistent: ☐ YES ☐ NO
Status: ☐ PASS ☐ FAIL
```

### Scenario 6.2: Verify Log Sequence

```
Title: Check audit trail is sequential and consistent
Precondition:
- Multiple operations on same product

Steps:
1. Retrieve all WarehouseLog entries for product
2. Sort by createdAt ascending
3. For each consecutive pair:
   - Current.quantityBefore = Previous.quantityAfter
   - OR current operation explains difference

Expected Result:
- Complete audit trail
- No gaps
- All transitions logical

Actual Result: _______________
Status: ☐ PASS ☐ FAIL

Found Issues (if any):
_________________________________
```

---

## 📋 TEST 7: Error Handling

### Scenario 7.1: Invalid Warehouse

```
Title: Try to import stock to non-existent warehouse
Steps:
1. POST /api/warehouse/import-stock
   { "warehouseId": "invalid_id", ... }

Expected Result:
- HTTP 400
- Response.message contains "warehouse"
- Clean error message

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 7.2: Unauthorized Access

```
Title: Customer tries to import stock (should fail)
Precondition:
- Customer token (not seller)

Steps:
1. POST /api/warehouse/import-stock with customer token

Expected Result:
- HTTP 403 (Forbidden)
- Response.message = "Unauthorized"

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 7.3: Database Connection Error

```
Title: System handles database outage gracefully
Precondition:
- Stop MongoDB
- Try to create order

Expected Result:
- HTTP 500 or 503
- Error message clear
- Transaction rolled back
- No partial data

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 📋 TEST 8: Validation Rules

### Scenario 8.1: Cannot Publish Book with Zero Stock

```
Title: Seller tries to publish book without stock
Precondition:
- Book.stock = 0

Steps:
1. POST /api/books (create with stock=0)
2. OR PUT /api/books/{id} (update stock to 0)

Expected Result:
- HTTP 400
- Message: "Cannot publish without stock"
- Validated by middleware

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

### Scenario 8.2: Negative Quantity Rejected

```
Title: Try to import/export negative quantity
Steps:
1. POST /api/warehouse/import-stock
   { ..., "quantity": -5 }

Expected Result:
- HTTP 400
- Validation error

Actual Result: _______________
Status: ☐ PASS ☐ FAIL
```

---

## 📊 TEST SUMMARY

| Test # | Scenario              | Status | Notes    |
| ------ | --------------------- | ------ | -------- |
| 1.1    | Create Warehouse      | ☐      |          |
| 1.2    | List Warehouses       | ☐      |          |
| 2.1    | Import Stock          | ☐      |          |
| 2.2    | Export Stock          | ☐      |          |
| 2.3    | Export Fails          | ☐      |          |
| 3.1    | Create Order Single   | ☐      |          |
| 3.2    | Create Order Multiple | ☐      |          |
| 3.3    | Order Fails           | ☐      |          |
| 4.1    | Cancel Order          | ☐      |          |
| 4.2    | Cancel Multi-Seller   | ☐      |          |
| 4.3    | Cannot Cancel Shipped | ☐      |          |
| 5.1    | Race Condition        | ☐      | CRITICAL |
| 5.2    | Concurrent Ops        | ☐      | CRITICAL |
| 6.1    | Stock Consistency     | ☐      |          |
| 6.2    | Log Sequence          | ☐      |          |
| 7.1    | Invalid Warehouse     | ☐      |          |
| 7.2    | Unauthorized          | ☐      |          |
| 7.3    | DB Error              | ☐      |          |
| 8.1    | Cannot Publish Zero   | ☐      |          |
| 8.2    | Negative Qty          | ☐      |          |

**Total: 20 Tests**  
**Passed: \_\_\_ / 20**  
**Failed: \_\_\_ / 20**  
**Success Rate: \_\_\_%**

---

## 🚀 FINAL CHECKLIST

-   [ ] All 20 tests completed
-   [ ] No critical failures
-   [ ] Race conditions tested & passed
-   [ ] Stock consistency verified
-   [ ] Error handling works
-   [ ] Validation rules enforced
-   [ ] Performance acceptable
-   [ ] Ready for deployment

---

**Test Suite v1.0 - 2024**
