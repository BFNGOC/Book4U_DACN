/\*\*

-   ORDER-TO-DELIVERY WORKFLOW DOCUMENTATION
-   =========================================
-
-   Complete order fulfillment system from customer order placement to delivery/return
    \*/

# 📋 ORDER STATUS WORKFLOW

```
Customer Order Flow:
pending → confirmed → picking → packed → in_transit → out_for_delivery → completed
                                                    ↘ return_initiated → returned

Cancelled: Any status can → cancelled (if not yet shipped)
```

## Status Definitions:

1. **pending** - Order created, waiting for seller confirmation

    - Customer placed order
    - Stock validated
    - No warehouse selected yet

2. **confirmed** - Seller confirmed order, stock deducted atomically

    - Warehouse selected (nearest with stock)
    - Stock deducted from WarehouseStock + Book.stock
    - WarehouseLog created
    - Ready for picking

3. **picking** - Seller is picking items from warehouse

    - Items being gathered from warehouse shelves
    - Picking list generated
    - Quality checks in progress

4. **packed** - Order items packed and ready for handoff

    - All items gathered and verified
    - Packed into box/envelope
    - Ready for carrier to pickup

5. **in_transit** - Carrier received shipment, heading out

    - Shipper assigned
    - Tracking number assigned
    - On the way to delivery area

6. **out_for_delivery** - Shipper has arrived at delivery area

    - Within delivery radius
    - Attempting delivery to customer

7. **completed** - Successfully delivered to customer

    - Customer received package
    - Payment confirmed (for COD orders)
    - Order finalized

8. **return_initiated** - Customer/Carrier requested return

    - Customer refused delivery
    - Delivery failed after max attempts
    - Awaiting seller approval

9. **returned** - Return approved, stock restored

    - Stock returned to warehouse
    - Refund processed
    - Order closed

10. **cancelled** - Order cancelled before shipping
    - Stock restored (if deducted)
    - Payment cancelled
    - Order closed

---

# 🔄 API ENDPOINTS

## 1. ORDER CREATION & CONFIRMATION

### 1a. Create Order (Customer)

```
POST /api/orders/create
Body: {
  profileId: string,
  items: [{ bookId, sellerId, quantity, price }],
  totalAmount: number,
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO',
  shippingAddress: { fullName, phone, address }
}
Response: {
  orderId: string,
  status: 'pending',
  message: 'Order created. Waiting for seller confirmation'
}
```

### 1b. Validate Stock Before Order

```
POST /api/orders/validate-stock
Body: {
  items: [{ bookId, sellerId, quantity }]
}
Response: {
  success: boolean,
  validationResults: [{ bookId, hasStock, available, requested }]
}
```

### 1c. Confirm Order & Deduct Stock (Seller)

**ATOMIC OPERATION - Prevents Race Conditions**

```
POST /api/orders/:orderId/confirm
Body: {
  customerLocation: { latitude, longitude, address } // optional
}
Response: {
  orderId: string,
  status: 'confirmed',
  warehouseId: string,
  warehouseName: string,
  message: 'Order confirmed. Stock deducted atomically.'
}
```

**Race Condition Prevention:**

-   Uses `findOneAndUpdate` with `quantity: { $gte: required }` condition
-   Checks quantity AND deducts in single atomic DB operation
-   No intermediate state where 2 requests see sufficient stock
-   If condition fails (stock insufficient), request returns null → throw error
-   MongoDB Transaction wraps all updates

---

## 2. SELLER WORKFLOW: PICKING, PACKING, HANDOFF

### 2a. Start Picking

```
PUT /api/seller-orders/:orderId/status/picking
Response: {
  orderId: string,
  status: 'picking',
  message: 'Started picking'
}
```

### 2b. Mark as Packed

```
PUT /api/seller-orders/:orderId/status/packed
Body: {
  trackingNumber: string, // optional
  carrierName: string     // optional
}
Response: {
  orderId: string,
  status: 'packed',
  message: 'Order packed. Ready for carrier pickup.'
}
```

### 2c. Handoff to Carrier

```
PUT /api/seller-orders/:orderId/handoff-carrier
Body: {
  carrierName: string,     // 'Giao Hàng Nhanh', 'Viettel Post', etc
  trackingNumber: string,
  shipperId: string,       // Shipper ID from carrier system
  shipperName: string      // Shipper name
}
Response: {
  orderId: string,
  status: 'in_transit',
  trackingNumber: string,
  message: 'Handed off to carrier. Order in transit.'
}
```

---

## 3. CARRIER/SHIPPER WORKFLOW: DELIVERY TRACKING

### 3a. Update Delivery Location (Real-time)

```
PUT /api/delivery/:orderId/location
Body: {
  latitude: number,
  longitude: number,
  address: string // optional
}
Response: {
  currentLocation: { latitude, longitude, address, lastUpdated }
}
```

### 3b. Update Delivery Status

```
PUT /api/delivery/:orderId/status
Body: {
  status: 'out_for_delivery' | 'return_initiated',
  returnReason: string // if returning
}
Response: {
  orderId: string,
  status: string,
  message: 'Delivery status updated'
}
```

### 3c. Record Delivery Attempt (Success/Failed)

```
PUT /api/delivery/:orderId/attempt
Body: {
  status: 'success' | 'failed',
  reason: string,        // 'Customer not available', 'Wrong address', etc
  driverName: string,
  driverId: string
}
Response: {
  orderId: string,
  status: string,           // 'completed' if success, 'out_for_delivery' if retry
  attemptNumber: number,
  totalAttempts: number,
  maxAttempts: number
}
```

**Logic:**

-   If success → order.status = 'completed'
-   If failed & attempts < maxAttempts → status = 'out_for_delivery' (retry)
-   If failed & attempts >= maxAttempts → status = 'return_initiated'

### 3d. Get Tracking Info

```
GET /api/delivery/:orderId
Response: {
  orderId: string,
  status: string,
  trackingNumber: string,
  carrier: { name, id },
  currentLocation: { latitude, longitude, address, lastUpdated },
  deliveryAttempts: [{ attemptNumber, status, timestamp, reason, driverName, location }],
  customer: { name, phone },
  items: [{ bookId, title, images, quantity, price }],
  notes: [{ timestamp, message, addedBy }]
}
```

---

## 4. RETURN & REFUND WORKFLOW

### 4a. Initiate Return (Customer)

```
PUT /api/delivery/:orderId/status
Body: {
  status: 'return_initiated',
  returnReason: string
}
```

### 4b. Approve/Reject Return (Seller)

```
POST /api/orders/:orderId/return/approve
Body: {
  approved: boolean,
  reason: string // if rejected
}
Response: {
  orderId: string,
  status: 'returned' if approved | 'return_initiated' if rejected,
  return: { status, approvedAt, refundAmount }
}
```

**If Approved:**

-   WarehouseStock increased (stock returned to warehouse)
-   Book.stock increased
-   WarehouseLog created (type: 'return_refund')
-   Order.paymentStatus = 'refunded'
-   Order.status = 'returned'

**If Rejected:**

-   Order.return.status = 'rejected'
-   Stock remains with customer
-   No refund

---

## 5. CANCEL ORDER (BEFORE SHIPPING)

```
POST /api/orders/:orderId/cancel
Body: {
  reason: string
}
Response: {
  orderId: string,
  status: 'cancelled',
  message: 'Order cancelled. Stock restored.'
}
```

**Can only cancel if status: pending | confirmed | picking | packed**

-   Cannot cancel: in_transit, out_for_delivery, completed, returned

---

# 🏗️ DATA STRUCTURES

## Order Schema (Extended)

```javascript
{
  profileId: ObjectId,                    // Customer
  items: [{
    bookId: ObjectId,
    sellerId: ObjectId,
    quantity: number,
    price: number
  }],
  totalAmount: number,
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO',
  paymentStatus: 'unpaid' | 'paid' | 'refunded',
  status: [workflow states above],
  shippingAddress: { fullName, phone, address },

  // Warehouse info
  warehouseId: ObjectId,                  // Selected warehouse
  warehouseName: string,

  // Carrier info
  carrier: { name, id },
  trackingNumber: string,

  // Delivery tracking
  currentLocation: { latitude, longitude, address, lastUpdated },
  deliveryAttempts: [{
    attemptNumber: number,
    status: 'success' | 'failed' | 'retry',
    timestamp: Date,
    reason: string,
    driverName: string,
    driverId: ObjectId,
    location: { latitude, longitude, address }
  }],
  maxDeliveryAttempts: number (default: 3),

  // Return info
  return: {
    reason: string,
    initiatedAt: Date,
    approvedAt: Date,
    returnedAt: Date,
    refundAmount: number,
    status: 'pending' | 'approved' | 'rejected' | 'returned' | 'refunded'
  },

  // Handler info
  handledBy: { sellerId, storeName },

  // Notes
  notes: [{
    timestamp: Date,
    message: string,
    addedBy: 'seller' | 'carrier' | 'customer' | 'system'
  }],

  createdAt: Date,
  updatedAt: Date
}
```

## WarehouseLog (New Type)

```javascript
{
  type: 'import' | 'export' | 'order_create' | 'order_cancel' | 'return_refund',
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  warehouseName: string,
  quantity: number,
  quantityBefore: number,
  quantityAfter: number,
  orderId: ObjectId,        // Added for order_create, order_cancel, return_refund
  reason: string,
  performedBy: ObjectId,    // userId
  status: 'success' | 'failed',
  createdAt: Date
}
```

---

# ⚠️ RACE CONDITION PREVENTION

## Problem

Multiple concurrent orders could exceed actual stock:

```
Customer 1: Check stock=5 ✓
Customer 2: Check stock=5 ✓
Both proceed, but only 5 total
Result: Stock goes negative! ❌
```

## Solution: Atomic findOneAndUpdate

```javascript
// WRONG - Race condition:
const stock = await WarehouseStock.findOne({ warehouseId, bookId });
if (stock.quantity >= quantity) {
    stock.quantity -= quantity;
    await stock.save(); // ← Not atomic! Another request could also save
}

// CORRECT - Atomic:
const updated = await WarehouseStock.findOneAndUpdate(
    {
        warehouseId,
        bookId,
        quantity: { $gte: quantity }, // ← Condition in query
    },
    {
        $inc: { quantity: -quantity }, // ← Deduct in one operation
    },
    { new: true }
);
if (!updated) throw new Error('Stock insufficient'); // ← Check returned value
```

**Why it works:**

-   MongoDB's `findOneAndUpdate` is atomic at document level
-   The `quantity: { $gte: quantity }` condition is checked AND updated together
-   If condition fails (stock insufficient), operation returns null
-   No intermediate state where 2 requests both succeed

**Additional Protection:**

-   MongoDB Transaction wraps all updates (order + book.stock + logs)
-   If any operation fails, transaction rolls back
-   Composite index on (warehouseId, bookId, sellerId) ensures data consistency

---

# 📊 DELIVERY ATTEMPT LOGIC

```
Attempt 1: Failed
  ↓
Attempt 2 Available? Yes → out_for_delivery (retry next day)
  ↓
Attempt 2: Failed
  ↓
Attempt 3 Available? Yes → out_for_delivery (retry next day)
  ↓
Attempt 3: Failed
  ↓
Attempt 4? No → return_initiated (auto-return to warehouse)
```

**Config:**

-   `maxDeliveryAttempts: 3` (default, configurable per order)
-   `deliveryAttempts[]` tracks all attempts with timestamps

---

# 🎯 IMPLEMENTATION CHECKLIST

✅ Extended Order schema with all fields
✅ Warehouse selection algorithm (Haversine formula)
✅ Atomic stock deduction (findOneAndUpdate)
✅ Transaction-based order confirmation
✅ Seller workflow: picking → packed → handoff
✅ Delivery tracking: location + attempts
✅ Return/refund processing with stock restoration
✅ Order cancellation with stock restoration
✅ Client-side OrderTracking component
✅ WarehouseLog for audit trail
⏳ Google Maps integration (optional)
⏳ Real-time notifications via Socket.io
⏳ SMS/Email notifications
⏳ Mobile app for shipper

---

# 🧪 TESTING RACE CONDITIONS

```javascript
// Test: 5 concurrent orders to same book with only 5 stock
const orders = [];
for (let i = 0; i < 5; i++) {
  orders.push(
    axios.post('/api/orders/:orderId/confirm', {
      customerLocation: { ... }
    })
  );
}

const results = await Promise.all(orders);
// Expected: 1 succeeds (stock = 0), 4 fail (stock insufficient)
// Result: ✓ Stock never goes negative
```

---
