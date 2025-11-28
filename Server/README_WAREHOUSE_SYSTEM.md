# 📦 WAREHOUSE & ORDER MANAGEMENT SYSTEM - README

## 📚 Documentation Files

Hệ thống hoàn chỉnh đã được tạo với các tài liệu sau:

| File                               | Mục Đích                                           | Dành Cho                  |
| ---------------------------------- | -------------------------------------------------- | ------------------------- |
| **WAREHOUSE_ORDER_DOCS.md**        | Tài liệu chi tiết về kiến trúc, schemas, workflows | Developers, Architects    |
| **WAREHOUSE_QUICK_START.md**       | Hướng dẫn nhanh - cách test hệ thống               | QA, Testers, New devs     |
| **WAREHOUSE_INTEGRATION_GUIDE.md** | Hướng dẫn integrate với frontend/existing code     | Frontend devs, Full-stack |
| **WAREHOUSE_TEST_SCENARIOS.md**    | 20+ test cases để verify toàn bộ hệ thống          | QA, Testers               |
| **Book4U_Warehouse_Postman.json**  | Postman collection - ready to import               | API testers               |

---

## 🏗️ IMPLEMENTATION STATUS

### ✅ COMPLETED (10 Files)

**Data Models** (3 files):

-   ✅ `warehouseModel.js` - Warehouse locations
-   ✅ `warehouseStockModel.js` - Stock tracking
-   ✅ `warehouseLogModel.js` - Audit trail

**Controllers** (2 files):

-   ✅ `warehouseController.js` - Warehouse operations
-   ✅ `orderManagementController.js` - Order lifecycle

**Routes** (2 files):

-   ✅ `warehouseRoutes.js` - Warehouse endpoints
-   ✅ `orderManagementRoutes.js` - Order endpoints

**Services & Middleware** (2 files):

-   ✅ `stockManagementService.js` - Stock helpers
-   ✅ `stockValidateMiddleware.js` - Validation

**Integration** (1 file):

-   ✅ `index.js` (routes) - Updated with registrations

---

## 🎯 SYSTEM FEATURES

### 🏭 Warehouse Management

-   ✅ Create/manage multiple warehouses per seller
-   ✅ Import stock with transaction safety
-   ✅ Export stock with validation
-   ✅ Complete audit trail logging

### 📦 Order Management

-   ✅ Pre-order stock validation
-   ✅ Atomic order creation with stock deduction
-   ✅ Order cancellation with stock restoration
-   ✅ Multi-seller order support

### 🛡️ Data Integrity

-   ✅ Race condition protection (MongoDB transactions + atomic ops)
-   ✅ Stock consistency checks
-   ✅ Immutable audit logs
-   ✅ Validation middlewares

---

## 🔐 API ENDPOINTS

### Warehouse Routes (`/api/warehouse`)

```
POST   /warehouses              Create warehouse
GET    /warehouses              List seller's warehouses
POST   /import-stock            Import stock (atomic)
POST   /export-stock            Export stock (with validation)
GET    /logs                    View stock history
GET    /product/:bookId/stock   Get total stock across warehouses
```

### Order Routes (`/api/orders`)

```
POST   /validate-stock          Pre-check stock availability
POST   /create                  Create order (atomic)
GET    /:orderId                Get order details
GET    /user/:profileId         List user's orders
POST   /:orderId/cancel         Cancel order (restore stock)
```

---

## 🗄️ DATABASE SCHEMA

### Collections

**Warehouse**

```javascript
{
  sellerId: ObjectId,
  name: String,
  address: String,
  phone: String,
  capacity: Number,
  status: 'active'|'inactive'|'maintenance',
  notes: String
}
```

**WarehouseStock**

```javascript
{
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  quantity: Number,        // Per-warehouse stock
  soldCount: Number,
  lastUpdatedStock: Date,
  // UNIQUE INDEX: (sellerId, bookId, warehouseId)
}
```

**WarehouseLog**

```javascript
{
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  type: 'import'|'export'|'order_create'|'order_cancel'|'return'|'damage'|'adjustment',
  quantity: Number,
  quantityBefore: Number,
  quantityAfter: Number,
  orderId: ObjectId,       // If from order
  reason: String,
  performedBy: ObjectId,
  status: 'success'|'failed'|'reversed'
}
```

---

## 🔄 KEY WORKFLOWS

### 1️⃣ Stock Import Flow

```
Seller Import 100 books
  ↓
Validate warehouse & book
  ↓
Start MongoDB Transaction
  ↓
Update WarehouseStock.quantity += 100
Update Book.stock += 100
Create WarehouseLog (import)
  ↓
Commit Transaction (all or nothing)
  ↓
✅ Complete
```

### 2️⃣ Order Creation Flow

```
Customer Create Order (5 books)
  ↓
Validate stock (Book.stock >= 5)
  ↓
Start Transaction
  ↓
Create Order document
Find warehouse with stock
Update WarehouseStock -= 5
Update Book.stock -= 5
Create WarehouseLog (order_create)
  ↓
Commit
  ↓
✅ Order created, stock deducted
```

### 3️⃣ Order Cancellation Flow

```
Customer Cancel Order
  ↓
Validate order status
  ↓
Query WarehouseLog for order_create entries
  ↓
For each warehouse:
  - Restore WarehouseStock.quantity
  - Restore Book.stock
  - Create WarehouseLog (order_cancel)
  ↓
Update Order.status = 'cancelled'
  ↓
Commit
  ↓
✅ Stock fully restored
```

---

## ⚡ RACE CONDITION PROTECTION

### Problem

```
2 concurrent orders, limited stock:
T0  A: Read stock = 100
    B: Read stock = 100
T1  A: Update stock = 50
    B: Update stock = 50   ❌ WRONG
Result: Lost update, incorrect stock
```

### Solution

```
MongoDB Transactions + Atomic Operations:
- $inc operator: stock -= 5 (atomic at DB level)
- Session transactions: All or nothing
- Conditional updates: Check stock during update
```

---

## 📊 TESTING

### Quick Test (5 min)

```bash
1. Import stock
2. Create order
3. Verify stock reduced
4. Cancel order
5. Verify stock restored
```

### Comprehensive Test (30 min)

-   Run all 20 test scenarios from WAREHOUSE_TEST_SCENARIOS.md
-   Test race conditions
-   Verify consistency
-   Check error handling

### Postman Tests

```
1. Import Book4U_Warehouse_Postman.json into Postman
2. Set environment variables
3. Run each endpoint sequentially
4. Verify responses
```

---

## 🚀 GETTING STARTED

### Step 1: Verify Installation

```
✓ All 10 implementation files exist in Server/src/
✓ Routes registered in Server/src/routes/index.js
✓ MongoDB connection working
```

### Step 2: Start Backend

```bash
cd Server
npm install
node index.js
# Should see routes registered including /api/warehouse and /api/orders
```

### Step 3: Test with Postman

```
1. Open Postman
2. Import Book4U_Warehouse_Postman.json
3. Set base_url, token, customer_token
4. Run endpoint: Create Warehouse
5. Verify response
```

### Step 4: Test Complete Flow

See WAREHOUSE_QUICK_START.md for step-by-step guide

---

## 📖 DOCUMENTATION GUIDE

**Starting Point:**

-   Read this file first (overview)

**Deep Dive:**

-   Read WAREHOUSE_ORDER_DOCS.md for architecture & concepts

**Implementation:**

-   WAREHOUSE_INTEGRATION_GUIDE.md to add frontend/extend system

**Testing:**

-   WAREHOUSE_QUICK_START.md for quick tests
-   WAREHOUSE_TEST_SCENARIOS.md for comprehensive testing

**API Usage:**

-   Use Book4U_Warehouse_Postman.json in Postman

---

## 🆘 TROUBLESHOOTING

### Issue: Routes not found (404)

**Solution:**

1. Verify routes registered in index.js
2. Restart server
3. Check route files exist

### Issue: Stock not updating

**Solution:**

1. Check MongoDB connection
2. Verify transaction support enabled
3. Check middleware order in routes

### Issue: Race condition (both orders succeed with insufficient stock)

**Solution:**

1. Verify using atomic $inc operator
2. Ensure transaction used
3. Review controller implementation

### Issue: Stock inconsistency

**Solution:**

1. Run checkConsistency() from stockManagementService
2. Review WarehouseLog for gaps
3. May need data repair script

---

## 📈 PERFORMANCE NOTES

-   **Indexes**: WarehouseStock has composite unique index for fast queries
-   **Transactions**: Local transactions (single server), scales to multiple servers
-   **Query Optimization**: All logs indexed by sellerId, bookId, warehouseId
-   **Scalability**: Warehouse-per-seller model supports multi-tenant growth

---

## 🔒 SECURITY CHECKLIST

-   ✅ All routes require `verifyToken` middleware
-   ✅ Stock validation before publication
-   ✅ Seller can only access own warehouses
-   ✅ Audit trail captures all operations
-   ✅ No direct stock manipulation allowed

---

## 📋 DEPLOYMENT CHECKLIST

-   [ ] All tests passing
-   [ ] No console errors
-   [ ] Rate limiting configured (if needed)
-   [ ] Monitoring setup for logs
-   [ ] Backup strategy defined
-   [ ] Error handling verified
-   [ ] Documentation updated
-   [ ] Team trained on system
-   [ ] Staged deployment completed
-   [ ] Production deploy

---

## 👥 TEAM GUIDE

**Backend Developers:**

-   Read WAREHOUSE_ORDER_DOCS.md for architecture
-   Check WAREHOUSE_INTEGRATION_GUIDE.md for extending

**Frontend Developers:**

-   Read WAREHOUSE_INTEGRATION_GUIDE.md section 3 (Frontend Integration)
-   Use examples for React components

**QA/Testers:**

-   Follow WAREHOUSE_TEST_SCENARIOS.md
-   Use Postman collection for API testing

**DevOps:**

-   Ensure MongoDB transactions enabled
-   Monitor WarehouseLog size
-   Setup backup for collections
-   Configure alerts for stock issues

---

## 📞 SUPPORT

For issues or questions:

1. Check documentation files
2. Review test scenarios for similar cases
3. Check server logs for errors
4. Review MongoDB logs

---

## 📅 VERSIONING

-   **v1.0** (2024-01-20): Initial complete implementation
    -   10 files created
    -   Full documentation
    -   20+ test scenarios
    -   Production ready

---

## 🎓 KEY LEARNINGS

1. **Always use transactions for multi-doc operations**
2. **Implement immutable audit trails**
3. **Validate data at multiple layers**
4. **Test race conditions explicitly**
5. **Document workflows with diagrams**

---

**End of README**

For questions or contributions, refer to documentation files above.
