# ✅ DEPLOYMENT CHECKLIST - ORDER DETAIL SYSTEM

## 📋 PRE-DEPLOYMENT

### Code Review

-   [ ] **orderDetailModel.js**

    -   Schema complete with all fields
    -   Indexes defined correctly
    -   Methods implemented (canConfirm, canShip, etc.)
    -   Hooks working (auto-update timestamps)

-   [ ] **orderDetailSellerController.js**

    -   5 main functions implemented
    -   Error handling complete
    -   Session/transaction management
    -   Notifications/logging

-   [ ] **orderManagementController.js**

    -   createOrderDetailsForMultiSeller() function added
    -   createOrder() calls new function
    -   Payment info preserved

-   [ ] **orderModel.js**

    -   orderDetails field added
    -   detailsCreated flag added
    -   Indexes added

-   [ ] **paymentController.js**
    -   OrderDetail import added
    -   handleVNPayCallback() updates OrderDetails
    -   handleMomoCallback() updates OrderDetails

### Dependencies

-   [ ] All required models imported
-   [ ] No circular dependencies
-   [ ] All utilities available (warehouseSelection, geocoding, etc.)

---

## 🗄️ DATABASE SETUP

### Collections

-   [ ] **OrderDetail** collection will auto-create on first insert
-   [ ] **Order** collection exists (no migration needed)

### Indexes

-   [ ] OrderDetail indexes created:
    ```javascript
    { sellerId: 1, createdAt: -1 }
    { sellerId: 1, status: 1 }
    { mainOrderId: 1 }
    { mainOrderId: 1, sellerId: 1 }
    { sellerId: 1, confirmedAt: 1 }
    { sellerId: 1, shippedAt: 1 }
    ```

### Data Migration (Optional)

-   [ ] No migration needed for existing orders
-   [ ] New orders will auto-create OrderDetails
-   [ ] Old order format still supported

---

## 🔌 API ROUTES

### Register New Routes

Add to `Server/src/routes/orderRoutes.js`:

```javascript
const orderDetailSellerController = require('../controllers/orderDetailSellerController');

// [NEW] OrderDetail endpoints
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

Routes Checklist:

-   [ ] Routes registered
-   [ ] Middleware (auth) applied
-   [ ] Controllers imported correctly
-   [ ] No duplicate route conflicts

---

## 🧪 TESTING

### Unit Tests

#### Order Creation

-   [ ] Create order from 1 seller → 1 OrderDetail created
-   [ ] Create order from 2 sellers → 2 OrderDetails created
-   [ ] Create order from 3 sellers → 3 OrderDetails created
-   [ ] MainOrder.orderDetails array populated correctly
-   [ ] MainOrder.detailsCreated = true

#### OrderDetail Fields

-   [ ] Each OrderDetail has correct sellerId
-   [ ] Items filtered correctly per seller
-   [ ] subtotal calculated correctly
-   [ ] totalAmount = subtotal (initially)
-   [ ] shippingAddress copied from MainOrder
-   [ ] status defaults to 'pending'
-   [ ] paymentStatus defaults to 'unpaid'

#### Payment Processing

-   [ ] VNPAY callback updates:

    -   [ ] MainOrder.paymentStatus = 'paid'
    -   [ ] ALL OrderDetails.paymentStatus = 'paid'
    -   [ ] No errors or exceptions

-   [ ] MOMO callback updates:
    -   [ ] MainOrder.paymentStatus = 'paid'
    -   [ ] ALL OrderDetails.paymentStatus = 'paid'
    -   [ ] Signature verification works

#### Seller Confirmation

-   [ ] Seller A confirms → OrderDetail_A.status = 'confirmed'
-   [ ] Seller A confirm → stock deducted from warehouse
-   [ ] Seller A confirm → Order logs created
-   [ ] Seller A confirm → confirmedAt timestamp set
-   [ ] Seller B pending → OrderDetail_B.status = 'pending'
-   [ ] After Seller B confirms:
    -   [ ] OrderDetail_B.status = 'confirmed'
    -   [ ] MainOrder.status = 'confirmed' (because all confirmed)

#### Seller Shipping

-   [ ] Seller A ship → OrderDetail_A.status = 'shipping'
-   [ ] Seller A ship → trackingNumber saved
-   [ ] Seller A ship → shippedAt timestamp set
-   [ ] Seller B ship independently → OrderDetail_B = 'shipping'

#### Seller Cancellation

-   [ ] Seller A cancel (before confirm) → status = 'cancelled'
-   [ ] Seller A cancel → stock NOT restored (wasn't deducted)
-   [ ] Seller A cancel (after confirm) → status = 'cancelled'
-   [ ] Seller A cancel → stock restored
-   [ ] Seller A cancel → WarehouseLog entries created

### Integration Tests

-   [ ] Full flow: Create → Confirm A → Confirm B → Ship A → Ship B
-   [ ] Multiple orders from same seller
-   [ ] High concurrency (parallel confirms)
-   [ ] Error handling (insufficient stock, invalid seller, etc.)

### API Tests

```bash
# Test 1: Create order
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{...}'
# Expected: orderDetails array in response

# Test 2: Get seller orders
curl -X GET http://localhost:5000/api/orders/seller/details \
  -H "Authorization: Bearer <token>"
# Expected: Array of OrderDetails

# Test 3: Confirm order
curl -X POST http://localhost:5000/api/orders/seller/details/<detailId>/confirm \
  -H "Authorization: Bearer <token>" \
  -d '{...}'
# Expected: status = "confirmed", confirmedAt set

# Test 4: Ship order
curl -X POST http://localhost:5000/api/orders/seller/details/<detailId>/ship \
  -H "Authorization: Bearer <token>" \
  -d '{...}'
# Expected: status = "shipping", trackingNumber set

# Test 5: Cancel order
curl -X POST http://localhost:5000/api/orders/seller/details/<detailId>/cancel \
  -H "Authorization: Bearer <token>" \
  -d '{...}'
# Expected: status = "cancelled"
```

---

## 🎯 PERFORMANCE

### Database Performance

-   [ ] OrderDetail queries < 100ms
-   [ ] Seller order list query < 200ms (with pagination)
-   [ ] Payment callback processes < 1s

### Indexes

-   [ ] Seller order list uses index: `{ sellerId: 1, createdAt: -1 }`
-   [ ] Status filtering uses index: `{ sellerId: 1, status: 1 }`
-   [ ] No full collection scans in queries

### Load Testing

-   [ ] Create 100 orders (multi-seller) without errors
-   [ ] Payment callback for 50 orders simultaneously
-   [ ] Multiple sellers confirming same OrderDetail set

---

## 📊 MONITORING

### Logs

-   [ ] Server logs OrderDetail creation
-   [ ] Server logs seller confirmations
-   [ ] Server logs payment updates
-   [ ] Error messages are meaningful

### Metrics to Track

-   [ ] Total OrderDetails created per day
-   [ ] Confirmation time per seller
-   [ ] Payment success rate
-   [ ] Order completion rate

---

## 📱 FRONTEND INTEGRATION (TODO)

### Pages to Update

-   [ ] `SellerConfirmation.jsx`

    -   [ ] Use new API: `/api/orders/seller/details?status=pending`
    -   [ ] Show OrderDetail instead of Order
    -   [ ] Confirm button calls new endpoint

-   [ ] `SellerOrdersManagement.jsx`

    -   [ ] Query new endpoint
    -   [ ] Display OrderDetails in list
    -   [ ] Show tracking per OrderDetail
    -   [ ] Allow ship per OrderDetail

-   [ ] `OrderDetailsPage.jsx` (Customer)
    -   [ ] Show separate sections per seller
    -   [ ] Each section shows:
        -   [ ] Seller name
        -   [ ] Items
        -   [ ] Status
        -   [ ] Tracking number (when available)
    -   [ ] Allow rating per seller

### Components to Create (Optional)

-   [ ] `OrderDetailCard.jsx` - Display single OrderDetail
-   [ ] `OrderDetailTimeline.jsx` - Show status progress per seller

---

## 🚀 DEPLOYMENT STEPS

### 1. Pre-Deployment

-   [ ] All code reviewed
-   [ ] All tests passing
-   [ ] Database ready
-   [ ] Backup taken

### 2. Deploy Code

```bash
# Pull latest code
git pull origin main

# Install dependencies (if any new ones)
npm install

# Run migrations (if any)
npm run migrate
```

-   [ ] Code deployed
-   [ ] No deployment errors

### 3. Start Server

```bash
# Stop old server
# Start new server with OrderDetail support
npm start
```

-   [ ] Server started
-   [ ] No startup errors
-   [ ] Logs show normal startup

### 4. Smoke Tests

```bash
# Test basic endpoints
curl http://localhost:5000/api/health

# Test with real data
# ... (see API Tests above)
```

-   [ ] All basic endpoints working
-   [ ] New OrderDetail endpoints accessible
-   [ ] No 500 errors

### 5. Monitor

-   [ ] Watch error logs for 30 minutes
-   [ ] Monitor database performance
-   [ ] Check API response times

### 6. Rollback Plan (if needed)

If issues:

1. Stop new server
2. Restore code to previous version
3. Restart old server
4. Orders without OrderDetails still work (backward compatible)

---

## 🔄 POST-DEPLOYMENT

### Verify Production

-   [ ] Test order creation from 2+ sellers
-   [ ] Verify OrderDetails created in DB
-   [ ] Test seller confirmation flow
-   [ ] Test payment callbacks
-   [ ] Monitor error logs

### Customer Communication

-   [ ] Update seller documentation (if needed)
-   [ ] Inform sellers about new order management
-   [ ] Tutorial videos (optional)

### Metrics Baseline

Document current metrics:

-   [ ] Average order creation time: \_\_\_ ms
-   [ ] Average seller list query time: \_\_\_ ms
-   [ ] Payment callback time: \_\_\_ ms

---

## 📝 DOCUMENTATION

### Update Docs

-   [ ] README updated
-   [ ] API documentation updated
-   [ ] Database schema documented
-   [ ] Seller guides updated

### Files

-   [ ] ORDERDETAIL_README.md
-   [ ] MULTI_SELLER_ORDER_SEPARATION_SYSTEM.md
-   [ ] IMPLEMENTATION_GUIDE_ORDERDETAIL.md

---

## ✅ FINAL SIGN-OFF

### QA Team

-   [ ] All tests passing
-   [ ] No critical bugs
-   [ ] Performance acceptable

### Developers

-   [ ] Code review complete
-   [ ] Documentation complete
-   [ ] Ready for deployment

### DevOps/Infrastructure

-   [ ] Database ready
-   [ ] Server capacity checked
-   [ ] Monitoring configured
-   [ ] Rollback plan documented

### Product Manager

-   [ ] Feature complete
-   [ ] Meets requirements
-   [ ] Ready for production

---

## 🎉 DEPLOYMENT COMPLETE

**Timestamp**: ******\_\_\_******
**Deployed By**: ******\_\_\_******
**Version**: ******\_\_\_******

### Post-Deployment Checklist

-   [ ] Monitor for 24 hours
-   [ ] No critical issues
-   [ ] All metrics normal
-   [ ] User feedback positive

---

## 🆘 TROUBLESHOOTING

### Issue: "OrderDetail model not found"

```
Solution:
1. Check Server/src/models/orderDetailModel.js exists
2. Restart server
3. Check console for import errors
```

### Issue: "Cannot read property 'confirmOrderDetail'"

```
Solution:
1. Check orderDetailSellerController.js is in correct path
2. Check routes import controller correctly
3. Check function name matches route handler
```

### Issue: "Payment not updating OrderDetails"

```
Solution:
1. Check paymentController.js line 1 has OrderDetail import
2. Check payment callback includes OrderDetail.updateMany()
3. Check mainOrderId is correct in database
```

### Issue: "Seller can't see OrderDetails"

```
Solution:
1. Check seller ID is correct
2. Check OrderDetails exist in database for that seller
3. Check authentication middleware working
4. Check route registered correctly
```

---

## ✨ READY FOR DEPLOYMENT

All items checked ✅

**System Status**: READY 🚀
