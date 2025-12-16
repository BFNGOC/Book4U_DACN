# 🚚 QUICK REFERENCE - MULTI-PROVINCE DELIVERY SYSTEM

## System Status: ✅ FULLY IMPLEMENTED

---

## 📋 COMPLETE FEATURE LIST

### ✅ Backend Features

| Feature                         | Status | Location                                        |
| ------------------------------- | ------ | ----------------------------------------------- |
| DeliveryStage Model             | ✅     | `Server/src/models/deliveryStageModel.js`       |
| OrderDetail Multi-Stage Fields  | ✅     | `Server/src/models/orderDetailModel.js`         |
| ShipperCoverageArea Model       | ✅     | `Server/src/models/shipperCoverageAreaModel.js` |
| Create Delivery Stages (1 or 3) | ✅     | `multiStageDeliveryController.js:29`            |
| Get Delivery Stages             | ✅     | `multiStageDeliveryController.js:260`           |
| Accept Stage                    | ✅     | `multiStageDeliveryController.js:298`           |
| Pickup Package                  | ✅     | `multiStageDeliveryController.js:365`           |
| Update Location (GPS)           | ✅     | `multiStageDeliveryController.js:420`           |
| Complete Stage                  | ✅     | `multiStageDeliveryController.js:494`           |
| Get Shipper Orders (Filtered)   | ✅     | `multiStageDeliveryController.js:599`           |
| Track Order Realtime            | ✅     | `multiStageDeliveryController.js:669`           |
| All Routes                      | ✅     | `Server/src/routes/multiStageDeliveryRoutes.js` |

### ✅ Frontend Features

| Feature                          | Status | Location                                               |
| -------------------------------- | ------ | ------------------------------------------------------ |
| ShipperDashboard                 | ✅     | `Client/Book4U/src/pages/shipper/ShipperDashboard.jsx` |
| ShipperDeliveryManagement        | ✅     | `src/components/shipper/ShipperDeliveryManagement.jsx` |
| DeliveryMapTracker (Google Maps) | ✅     | `src/components/tracking/DeliveryMapTracker.jsx`       |
| DeliveryStageTracker (Timeline)  | ✅     | `src/components/tracking/DeliveryStageTracker.jsx`     |
| ShipperOrderList                 | ✅     | `src/components/shipper/ShipperOrderList.jsx`          |
| ShipperOrderMap                  | ✅     | `src/components/shipper/ShipperOrderMap.jsx`           |
| OrderTracking                    | ✅     | `src/components/tracking/OrderTracking.jsx`            |
| multiDeliveryApi                 | ✅     | `src/services/api/multiDeliveryApi.js`                 |

---

## 🎯 KEY FEATURES IMPLEMENTED

### 1. **Automatic Stage Creation**

```
Warehouse Province = Customer Province → 1 Stage
Warehouse Province ≠ Customer Province → 3 Stages
```

**Code:** `multiStageDeliveryController.js:createDeliveryStages()`

### 2. **Province-Based Shipper Filtering**

```
Shipper A sees only orders for provinces in their coverage area
```

**Code:** `multiStageDeliveryController.js:getShipperOrders()` (Line 599)

### 3. **Real-Time GPS Tracking**

```
updateShipperLocation() stores location history
Supports: in_transit, in_transit_with_gps statuses
Polling: Every 30 seconds (configurable)
```

**Code:** `multiStageDeliveryController.js:updateShipperLocation()` (Line 420)

### 4. **Google Maps Integration**

```
Displays:
- Warehouse location (Green marker)
- Transfer Hubs (Blue markers)
- Customer location (Red marker)
- Shipper location (Yellow marker - realtime)
- Route lines between stages
- Location history trail
```

**Code:** `Client/Book4U/src/components/tracking/DeliveryMapTracker.jsx`

### 5. **Stage Status Management**

```
pending → accepted → picked_up → in_transit → delivered
(or at_next_hub for stage 1/2, then to delivered)

Stage transitions:
Stage N completed → Stage N+1 auto-activated
Last stage completed → OrderDetail.delivered, MainOrder.completed
```

**Code:** `multiStageDeliveryController.js:completeDeliveryStage()` (Line 494)

### 6. **Customer Real-Time Tracking**

```
trackOrderRealtime() endpoint returns:
- Current stage details
- All stages timeline
- Current location + location history
- ETA (if available)
```

**Code:** `multiStageDeliveryController.js:trackOrderRealtime()` (Line 669)

---

## 🚀 QUICK START FOR TESTING

### 1. **Setup (Admin)**

Create shipper coverage areas:

```bash
POST /api/shipper-coverage/create
{
  "shipperId": "shipper_123",
  "shipperType": "local",
  "coverageAreas": [
    { "province": "TP.HCM", "districts": ["Q1", "Q2", "Q3"] },
    { "province": "Bình Dương", "districts": ["Thủ Dầu Một"] }
  ]
}
```

### 2. **Test Nội Tỉnh (1 Stage)**

```bash
# Step 1: Seller ships order (same province)
POST /api/multi-delivery/stages/create
Body: { "orderDetailId": "order_123" }
Response: 1 stage created

# Step 2: Shipper sees order
GET /api/multi-delivery/shipper/orders
Response: [ { stageNumber: 1, status: "pending", ... } ]

# Step 3: Shipper accept
PUT /api/multi-delivery/stages/stage_1/accept
Response: { status: "accepted" }

# Step 4: Shipper pickup
PUT /api/multi-delivery/stages/stage_1/pickup
Body: { latitude, longitude, address }
Response: { status: "picked_up" }

# Step 5: GPS tracking (repeat every 30 seconds)
PUT /api/multi-delivery/stages/stage_1/location
Body: { latitude, longitude, address, status: "in_transit" }
Response: { currentLocation }

# Step 6: Shipper complete
PUT /api/multi-delivery/stages/stage_1/complete
Body: { latitude, longitude, address, notes }
Response: { status: "delivered", isLastStage: true }
→ OrderDetail.status = "delivered"
→ MainOrder.status = "completed"
```

### 3. **Test Liên Tỉnh (3 Stages)**

```bash
# Step 1: Seller ships order (different province)
POST /api/multi-delivery/stages/create
Body: { "orderDetailId": "order_456" }
Response: 3 stages created
  - Stage 1: Warehouse (TPHCM) → Hub (TPHCM)
  - Stage 2: Hub (TPHCM) → Hub (HN)
  - Stage 3: Hub (HN) → Customer (HN)

# Step 2: Shipper TPHCM sees Stage 1
GET /api/multi-delivery/shipper/orders (Shipper TPHCM)
Response: [ { stageNumber: 1, ... } ]

# Step 3: Shipper TPHCM completes Stage 1
[accept → pickup → in_transit → complete]
Response: { status: "delivered", isLastStage: false }
→ Stage 2 auto-activated

# Step 4: [SYSTEM] Stage 2 auto-completed
PUT /api/multi-delivery/stages/stage_2/complete (Auto by system)
Response: { status: "delivered", isLastStage: false }
→ Stage 3 auto-activated

# Step 5: Shipper HN sees Stage 3
GET /api/multi-delivery/shipper/orders (Shipper HN)
Response: [ { stageNumber: 3, ... } ]

# Step 6: Shipper HN completes Stage 3
[accept → pickup → in_transit → complete]
Response: { status: "delivered", isLastStage: true }
→ OrderDetail.status = "delivered"
→ MainOrder.status = "completed"
```

### 4. **Test Customer Tracking**

```bash
# Anytime during delivery
GET /api/multi-delivery/track/order_123
Response: {
  currentStageIndex: 1,
  currentStage: {
    stageNumber: 1,
    status: "in_transit",
    currentLocation: { latitude, longitude, address },
    locationHistory: [ ... ]
  },
  stages: [ ... all stages timeline ... ]
}

# Display on frontend:
# <DeliveryMapTracker orderDetailId={orderId} />
# <DeliveryStageTracker orderDetailId={orderId} />
```

---

## 📊 DATA FLOW DIAGRAM

### Nội Tỉnh

```
Seller clicks "Ship"
    ↓
System detects: warehouse.province = customer.province
    ↓
Create 1 DeliveryStage (pending)
    ↓
Shipper dashboard shows order
    ↓
Shipper accepts → picks up → tracks (GPS) → completes
    ↓
Stage.status: delivered
OrderDetail.status: delivered
MainOrder.status: completed (if all items delivered)
    ↓
Customer sees "Delivered" in tracking
```

### Liên Tỉnh

```
Seller clicks "Ship"
    ↓
System detects: warehouse.province ≠ customer.province
    ↓
Create 3 DeliveryStages (all pending, currentStageIndex=0)
    ↓
Shipper Province A sees Stage 1
    ↓
Shipper A: accept → pickup → track → complete (Stage 1)
    ↓
OrderDetail.currentStageIndex = 1, Stage 2 activated
    ↓
[System auto-completes Stage 2 when arriving at Hub B]
    ↓
OrderDetail.currentStageIndex = 2, Stage 3 activated
    ↓
Shipper Province B sees Stage 3
    ↓
Shipper B: accept → pickup → track → complete (Stage 3)
    ↓
Stage.status: delivered (isLastStage=true)
OrderDetail.status: delivered
MainOrder.status: completed
    ↓
Customer sees "Delivered" in tracking
```

---

## 🔌 API ENDPOINTS SUMMARY

| Method | Endpoint                                  | Purpose        | Auth       |
| ------ | ----------------------------------------- | -------------- | ---------- |
| POST   | `/api/multi-delivery/stages/create`       | Create stages  | ✅ Seller  |
| GET    | `/api/multi-delivery/stages/:id`          | Get all stages | No         |
| PUT    | `/api/multi-delivery/stages/:id/accept`   | Shipper accept | ✅ Shipper |
| PUT    | `/api/multi-delivery/stages/:id/pickup`   | Shipper pickup | ✅ Shipper |
| PUT    | `/api/multi-delivery/stages/:id/location` | Update GPS     | ✅ Shipper |
| PUT    | `/api/multi-delivery/stages/:id/complete` | Complete stage | ✅ Shipper |
| GET    | `/api/multi-delivery/shipper/orders`      | Shipper orders | ✅ Shipper |
| GET    | `/api/multi-delivery/track/:id`           | Track order    | No         |

---

## 🗺️ FRONTEND COMPONENTS

### Display Tracking for Customer

```jsx
import DeliveryMapTracker from '@/components/tracking/DeliveryMapTracker';
import DeliveryStageTracker from '@/components/tracking/DeliveryStageTracker';

export function OrderTrackingPage({ orderDetailId }) {
    return (
        <div>
            {/* Map view */}
            <DeliveryMapTracker orderDetailId={orderDetailId} height="h-96" />

            {/* Timeline view */}
            <DeliveryStageTracker orderDetailId={orderDetailId} />
        </div>
    );
}
```

### Shipper Dashboard

```jsx
import ShipperDashboard from '@/pages/shipper/ShipperDashboard';

export function ShipperPage() {
    return <ShipperDashboard />;
}

// Displays:
// - List of pending orders (filtered by province)
// - Map view of all orders
// - Order details and actions (accept, pickup, complete)
// - Real-time GPS tracking
```

---

## 🧪 TESTING ENDPOINTS WITH CURL

### Create Stages

```bash
curl -X POST http://localhost:5000/api/multi-delivery/stages/create \
  -H "Authorization: Bearer <seller_token>" \
  -H "Content-Type: application/json" \
  -d '{"orderDetailId":"693ed382a3d1e8b406613a6e"}'
```

### Get Shipper Orders

```bash
curl -X GET http://localhost:5000/api/multi-delivery/shipper/orders \
  -H "Authorization: Bearer <shipper_token>"
```

### Accept Stage

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/stage_123/accept \
  -H "Authorization: Bearer <shipper_token>" \
  -H "Content-Type: application/json"
```

### Update Location

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/stage_123/location \
  -H "Authorization: Bearer <shipper_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.7769,
    "longitude": 106.6869,
    "address": "Kho 123",
    "status": "in_transit"
  }'
```

### Complete Stage

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/stage_123/complete \
  -H "Authorization: Bearer <shipper_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.7900,
    "longitude": 106.7000,
    "address": "Khách hàng",
    "notes": "Giao thành công"
  }'
```

### Track Order

```bash
curl -X GET http://localhost:5000/api/multi-delivery/track/693ed382a3d1e8b406613a6e
```

---

## 🎯 REQUIREMENTS FULFILLED

✅ **Đơn hàng được vận chuyển theo nhiều chặng**

-   ✅ Nội tỉnh = 1 chặng
-   ✅ Liên tỉnh = 3 chặng

✅ **Shipper 1 tỉnh chỉ nhận và giao đơn tới trung tâm trung chuyển**

-   ✅ Stage 1: Warehouse → Hub Province A (Shipper A)
-   ✅ Stage 2: Hub A → Hub B (System/Regional)
-   ✅ Stage 3: Hub B → Customer (Shipper B)

✅ **Shipper tỉnh cần giao nhận đơn khi tới**

-   ✅ getShipperOrders() filters by coverage area
-   ✅ Shipper B only sees Stage 3 when it's activated

✅ **Shipper chỉ nhìn thấy đơn hàng thuộc khu vực mình**

-   ✅ Shipper coverage area check in getShipperOrders()

✅ **Quản lý trạng thái theo từng giai đoạn**

-   ✅ Stage status flow: pending → accepted → picked_up → in_transit → delivered
-   ✅ OrderDetail.currentStageIndex tracks current stage

✅ **Hiển thị vị trí trên bản đồ (Google Maps)**

-   ✅ DeliveryMapTracker component
-   ✅ Warehouse, hubs, customer, shipper markers
-   ✅ Real-time shipper location updates
-   ✅ Route visualization

---

## 📌 FILES TO MODIFY FOR CUSTOM INTEGRATION

If you want to add custom tracking or notifications:

1. **Backend:**

    - `Server/src/controllers/multiStageDeliveryController.js` - Add custom logic
    - `Server/src/models/deliveryStageModel.js` - Add custom fields
    - `Server/src/routes/multiStageDeliveryRoutes.js` - Add new endpoints

2. **Frontend:**

    - `Client/Book4U/src/components/tracking/DeliveryMapTracker.jsx` - Customize map
    - `Client/Book4U/src/components/shipper/ShipperDeliveryManagement.jsx` - Custom UI
    - `Client/Book4U/src/services/api/multiDeliveryApi.js` - Add new API calls

3. **Socket.IO (Optional - for real-time notifications):**
    - Add Socket.IO listeners in ShipperDashboard
    - Broadcast location updates to customers
    - Real-time stage status changes

---

## 🔐 SECURITY NOTES

-   ✅ All APIs except `track/:id` require authentication
-   ✅ Shipper can only see orders in their coverage area
-   ✅ Seller can only create stages for their own orders
-   ✅ Customer tracking is public (no auth needed)

---

## 📈 PERFORMANCE OPTIMIZATION

-   GPS updates: Every 30 seconds (configurable)
-   Polling for shipper orders: Every 60 seconds
-   Database indexes on:
    -   `(mainOrderId, stageNumber)`
    -   `(assignedShipperId, status)`
    -   `(toLocation.province, status)`

---

## ✨ SUMMARY

The multi-province delivery system is **fully implemented** with:

-   ✅ 1 stage for nội tỉnh delivery
-   ✅ 3 stages for liên tỉnh delivery
-   ✅ Province-based shipper filtering
-   ✅ Real-time GPS tracking
-   ✅ Google Maps integration
-   ✅ Customer real-time tracking
-   ✅ Stage status management & transitions
-   ✅ Automatic stage activation

**Ready for production use!**
