# 📦 ORDER-TO-DELIVERY WORKFLOW - QUICK REFERENCE

## 🚀 What Was Implemented

Complete end-to-end order fulfillment system with **race condition prevention** and **atomic stock management**.

### 7-Step Customer Journey

1. **Customer Places Order** → Status: `pending`
2. **Seller Confirms** → Status: `confirmed`, Stock deducted atomically
3. **Seller Picks Items** → Status: `picking`
4. **Seller Packs Order** → Status: `packed`
5. **Carrier Takes Over** → Status: `in_transit`
6. **Shipper Delivers** → Status: `out_for_delivery` → `completed` OR `return_initiated`
7. **Return Processing** → Status: `returned`, Stock restored

---

## 📁 Files Created/Modified

### Backend Files

**Models (Extended):**

-   `Server/src/models/orderModel.js` - Enhanced with 10 new status states, warehouse selection, carrier tracking, delivery attempts, return handling

**Controllers (New & Updated):**

-   `Server/src/controllers/orderManagementController.js` - Added `confirmOrder()` with atomic stock deduction + `approveReturn()`
-   `Server/src/controllers/orderSellerController.js` - Added `startPicking()`, `markAsPacked()`, `handoffToCarrier()`
-   `Server/src/controllers/deliveryController.js` - NEW - `updateDeliveryLocation()`, `recordDeliveryAttempt()`, `updateDeliveryStatus()`, `getTrackingInfo()`

**Utilities (New):**

-   `Server/src/utils/warehouseSelection.js` - NEW - Haversine distance calculation + nearest warehouse selection + atomic stock validation

**Routes (New & Updated):**

-   `Server/src/routes/orderManagementRoutes.js` - Added `/confirm` endpoint
-   `Server/src/routes/orderSellerRoutes.js` - Added picking/packing/handoff endpoints
-   `Server/src/routes/deliveryRoutes.js` - NEW - All delivery tracking endpoints
-   `Server/src/routes/index.js` - Registered deliveryRoutes

### Frontend Files

**Components (New):**

-   `Client/Book4U/src/components/common/OrderTracking.jsx` - NEW - Beautiful timeline UI with real-time tracking
-   `Client/Book4U/src/components/common/OrderTracking.css` - NEW - Responsive styling with animations

**Documentation:**

-   `ORDER_DELIVERY_WORKFLOW.md` - Complete API documentation + data structures + race condition explanation

---

## 🔐 Race Condition Prevention

### The Problem

```javascript
// Without atomic operations:
Customer1: Check stock = 5 ✓
Customer2: Check stock = 5 ✓
Both proceed → Stock becomes NEGATIVE ❌
```

### The Solution

```javascript
// With atomic findOneAndUpdate:
WarehouseStock.findOneAndUpdate(
    {
        warehouseId,
        bookId,
        quantity: { $gte: required }, // ← Check condition in query
    },
    {
        $inc: { quantity: -required }, // ← Update atomically
    },
    { new: true }
);
// Either succeeds completely or returns null
// No race condition possible ✓
```

### Where It's Used

-   `confirmOrder()` endpoint - stock deduction is **100% atomic**
-   Wrapped in MongoDB Transaction for multi-document consistency
-   If any step fails, entire transaction rolls back

---

## 🔄 API Workflow

### 1. Customer Creates Order

```
POST /api/orders/create
→ Order status = 'pending'
→ Stock NOT deducted yet
```

### 2. Seller Confirms (ATOMIC DEDUCTION)

```
POST /api/orders/{orderId}/confirm
← Warehouse auto-selected (nearest with stock)
← Stock deducted atomically
← Order status = 'confirmed'
```

### 3. Seller Prepares

```
PUT /api/seller-orders/{orderId}/status/picking   → status = 'picking'
PUT /api/seller-orders/{orderId}/status/packed    → status = 'packed'
PUT /api/seller-orders/{orderId}/handoff-carrier  → status = 'in_transit'
```

### 4. Carrier Delivers

```
PUT /api/delivery/{orderId}/location              → Update GPS location
PUT /api/delivery/{orderId}/attempt               → Record delivery attempt
    ├─ Success → status = 'completed'
    ├─ Failed (retry available) → status = 'out_for_delivery'
    └─ Failed (no retries) → status = 'return_initiated'
```

### 5. Return Processing

```
PUT /api/delivery/{orderId}/status?status=return_initiated
POST /api/orders/{orderId}/return/approve?approved=true
    ├─ Stock restored to warehouse
    ├─ Refund processed
    └─ Order status = 'returned'
```

---

## 📊 Order Status Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ pending → confirmed → picking → packed → in_transit → out_for   │
│                                                      delivery    │
│                                                          ↓       │
│                                                      completed   │
│                                                          ↑       │
│                                                  return_initiated│
│                                                          ↓       │
│                                                      returned    │
└─────────────────────────────────────────────────────────────────┘

Any status → cancelled (before shipping)
```

---

## 🧠 Key Features

### ✅ Atomic Operations

-   `findOneAndUpdate` with quantity check prevents stock overselling
-   MongoDB Transactions ensure all-or-nothing updates
-   No intermediate states where concurrent requests conflict

### ✅ Warehouse Selection

-   Haversine formula calculates distance to customer
-   Selects nearest warehouse with sufficient stock
-   Configurable fallback (first available if no location)

### ✅ Delivery Tracking

-   Real-time GPS location updates
-   Multiple delivery attempts with reasons
-   Auto-return after max failed attempts
-   Full audit trail in order notes

### ✅ Return Management

-   Seller can approve/reject returns
-   Automatic stock restoration on approval
-   Refund processing integrated
-   Complete audit in WarehouseLog

### ✅ Order Cancellation

-   Allowed only before shipping (pending/confirmed/picking/packed)
-   Automatic stock restoration
-   Preserves all data for audit

---

## 🎯 Testing Concurrent Orders

Create 5+ simultaneous orders with only 5 items in stock:

```javascript
const promises = [];
for (let i = 0; i < 5; i++) {
    promises.push(axios.post('/api/orders/123/confirm'));
}
const results = await Promise.all(promises);
// Expected: 1 success, 4 fail with "stock insufficient"
// Stock never goes negative ✓
```

---

## 📝 WarehouseLog New Type

Added new log type for tracking returns:

```javascript
{
  type: 'return_refund',  // ← New type
  sellerId,
  bookId,
  warehouseId,
  quantity,
  quantityBefore,
  quantityAfter,
  orderId,
  reason: 'Hoàn hàng từ orderId',
  status: 'success'
}
```

Provides complete audit trail for returns.

---

## 🔧 Configuration

### Order Settings (in Order schema)

```javascript
maxDeliveryAttempts: 3; // Number of delivery attempts before auto-return
paymentMethod: 'COD'; // Supports: COD, VNPAY, MOMO
```

### Warehouse Selection

```javascript
// Automatically selects:
1. Nearest warehouse to customer
2. With sufficient stock
3. Falls back to first available if no location
```

---

## 🎨 Client Component: OrderTracking

Beautiful React component with:

-   **Status Timeline** - Visual progress indicator
-   **Delivery Attempts** - All attempts with reasons
-   **Current Location** - Real-time GPS tracking
-   **Order Details** - Items, customer, total
-   **Notes** - Full communication log
-   **Return Request** - Modal for initiating returns

Auto-refreshes every 10 seconds for live updates.

---

## 📚 Documentation Files

1. **ORDER_DELIVERY_WORKFLOW.md** - Complete API reference + examples
2. This file - Quick reference guide
3. Controller comments - Implementation details in code

---

## ✨ Next Steps (Optional)

1. **Google Maps Integration**

    - Display current location on map
    - Show warehouse to customer distance visually

2. **Real-time Notifications**

    - Socket.io for live delivery updates
    - SMS/Email when status changes

3. **Shipper Mobile App**

    - Mobile-optimized delivery interface
    - Barcode scanning
    - Photo capture on delivery

4. **Admin Dashboard**

    - Order management interface
    - Return approval workflow
    - Analytics by warehouse/seller

5. **Integration with Shipping APIs**
    - GHN (Giao Hàng Nhanh)
    - Viettel Post
    - Vietnam Post

---

## 🚀 How to Deploy

1. Models already extended - no migration needed
2. Routes registered in `index.js` - ready to use
3. Atomic operations use standard MongoDB syntax - compatible with v4.0+
4. Client component can be imported and used immediately

```jsx
import OrderTracking from '@/components/common/OrderTracking';

// In your order page:
<OrderTracking orderId={orderId} isCustomer={true} />;
```

---

## 📞 Support

For questions about implementation:

-   Check ORDER_DELIVERY_WORKFLOW.md for detailed API docs
-   Review controller comments for logic explanation
-   Look at warehouseSelection.js for algorithm details
-   Check OrderTracking.jsx for UI implementation

---

**Status: ✅ COMPLETE AND READY FOR PRODUCTION**

All core workflow implemented with race condition protection and atomic operations.
