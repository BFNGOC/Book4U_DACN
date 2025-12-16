# 🧪 TESTING GUIDE - Multi-Stage Delivery System

**Ngày:** 16/12/2025  
**Status:** ✅ Production Ready

---

## 📋 Mục lục

1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Scenarios](#test-scenarios)
4. [Testing Methods](#testing-methods)
5. [Expected Results](#expected-results)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1️⃣ Backend Requirements

-   ✅ Server running on `http://localhost:5000`
-   ✅ MongoDB connected
-   ✅ Models loaded: `DeliveryStage`, `ShipperCoverageArea`, `OrderDetail`
-   ✅ Routes registered: `/api/multi-delivery`, `/api/shipper-coverage`

### 2️⃣ Data Setup

-   ✅ 2-3 Seller accounts (store in TPHCM, Hà Nội)
-   ✅ Warehouse data with location/province
-   ✅ 3-4 Shipper accounts (TPHCM, HN, Regional)
-   ✅ Sample orders (nội tỉnh + liên tỉnh)

### 3️⃣ Testing Tools

-   **Postman** (recommended) or **Insomnia**
-   **curl** command line
-   **Browser** (for tracking page)
-   **MongoDB Compass** (to verify data)

---

## Test Environment Setup

### Step 1: Create Test Data

**A. Create Sellers & Warehouses**

```bash
# Register Seller TPHCM
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "seller_hcm@test.com",
  "password": "password123",
  "name": "Shop TPHCM",
  "role": "seller",
  "province": "TP. Hồ Chí Minh",
  "district": "Quận 1",
  "ward": "Phường Bến Nghé"
}

# Get token from response
# Response: { token: "eyJhbGciOiJIUzI1NiIs..." }
```

**B. Create Warehouse (use seller token)**

```bash
POST http://localhost:5000/api/warehouse/create
Authorization: Bearer <SELLER_TOKEN>
Content-Type: application/json

{
  "warehouseName": "Warehouse HCMC",
  "managerName": "Nguyễn A",
  "managerPhone": "0912345678",
  "province": "TP. Hồ Chí Minh",
  "district": "Quận 1",
  "ward": "Phường Bến Nghé",
  "address": "123 Đường Nguyễn Huệ"
}

# Save warehouseId from response
```

**C. Create Shippers & Coverage Areas**

```bash
# Register Shipper TPHCM
POST http://localhost:5000/api/auth/register
{
  "email": "shipper_hcm@test.com",
  "password": "password123",
  "name": "Shipper TPHCM",
  "role": "shipper",
  "province": "TP. Hồ Chí Minh",
  "district": "Quận 1"
}

# Save shipperId

# Create Coverage Area for Shipper TPHCM
POST http://localhost:5000/api/shipper-coverage/create
Content-Type: application/json

{
  "shipperId": "<SHIPPER_HCM_ID>",
  "shipperType": "local",
  "coverageAreas": [
    {
      "province": "TP. Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé"
    },
    {
      "province": "TP. Hồ Chí Minh",
      "district": "Quận 2"
    }
  ]
}
```

**D. Repeat for Shipper Hà Nội**

```bash
# Register Shipper HN
POST http://localhost:5000/api/auth/register
{
  "email": "shipper_hn@test.com",
  "password": "password123",
  "name": "Shipper Hà Nội",
  "role": "shipper",
  "province": "Hà Nội",
  "district": "Quận Hoàn Kiếm"
}

# Create Coverage Area
POST http://localhost:5000/api/shipper-coverage/create
{
  "shipperId": "<SHIPPER_HN_ID>",
  "shipperType": "local",
  "coverageAreas": [
    {
      "province": "Hà Nội",
      "district": "Quận Hoàn Kiếm"
    }
  ]
}
```

---

## Test Scenarios

### 🏘️ Scenario 1: Nội tỉnh (Local Delivery - TPHCM → TPHCM)

**Expected:** 1 delivery stage, 1 shipper

#### Step 1: Create Order

```bash
POST http://localhost:5000/api/orders/create
Authorization: Bearer <CUSTOMER_TOKEN>
Content-Type: application/json

{
  "sellerId": "<SELLER_HCM_ID>",
  "items": [
    {
      "bookId": "<BOOK_ID>",
      "quantity": 2,
      "price": 100000
    }
  ],
  "shippingAddress": {
    "fullName": "Nguyễn B",
    "phone": "0987654321",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Thành",
    "address": "456 Đường Lê Lợi"
  },
  "paymentMethod": "cod"
}

# Save: mainOrderId, orderDetailId
```

#### Step 2: Seller Confirms & Ships

```bash
# Seller confirms order
PUT http://localhost:5000/api/orders/seller/details/<ORDERDETAIL_ID>/confirm
Authorization: Bearer <SELLER_TOKEN>

# Seller ships order (AUTO-CREATES DELIVERY STAGE)
PUT http://localhost:5000/api/orders/seller/details/<ORDERDETAIL_ID>/ship
Authorization: Bearer <SELLER_TOKEN>
Content-Type: application/json

{
  "trackingNumber": "VN001",
  "shippingMethod": "standard"
}

# ✅ Should create 1 delivery stage (nội tỉnh)
```

#### Step 3: Verify Delivery Stage Created

```bash
GET http://localhost:5000/api/multi-delivery/stages/<ORDERDETAIL_ID>
Content-Type: application/json

# Response:
{
  "success": true,
  "data": {
    "stages": [
      {
        "_id": "stage_id_1",
        "stageNumber": 1,
        "status": "pending",
        "fromLocation": {
          "type": "warehouse",
          "province": "TP. Hồ Chí Minh",
          "district": "Quận 1"
        },
        "toLocation": {
          "type": "customer",
          "province": "TP. Hồ Chí Minh",
          "district": "Quận 1"
        },
        "isInterProvincial": false
      }
    ]
  }
}

# ✅ Expected: stageNumber=1, isInterProvincial=false
```

#### Step 4: Shipper Accepts & Picks Up

```bash
# Shipper HCM logs in and gets pending orders
GET http://localhost:5000/api/multi-delivery/shipper/orders
Authorization: Bearer <SHIPPER_HCM_TOKEN>

# Response:
{
  "success": true,
  "data": {
    "pendingStages": [
      {
        "_id": "stage_id_1",
        "stageNumber": 1,
        "status": "pending",
        "orderDetailId": "<ORDERDETAIL_ID>"
      }
    ]
  }
}

# ✅ Expected: Shipper sees 1 pending order
```

```bash
# Shipper accepts order
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_ID>/accept
Authorization: Bearer <SHIPPER_HCM_TOKEN>
Content-Type: application/json

{}

# Response:
{
  "success": true,
  "message": "Đã chấp nhận nhận đơn hàng",
  "data": {
    "stage": {
      "_id": "stage_id_1",
      "status": "accepted",
      "assignedShipperId": "<SHIPPER_HCM_ID>"
    }
  }
}

# ✅ Expected: status changed to "accepted"
```

```bash
# Shipper picks up package
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_ID>/pickup
Authorization: Bearer <SHIPPER_HCM_TOKEN>
Content-Type: application/json

{
  "latitude": 10.776533,
  "longitude": 106.698025,
  "address": "123 Đường Nguyễn Huệ, Quận 1, TPHCM"
}

# Response:
{
  "success": true,
  "message": "Đã lấy hàng",
  "data": {
    "stage": {
      "status": "picked_up",
      "currentLocation": {
        "latitude": 10.776533,
        "longitude": 106.698025,
        "address": "123 Đường Nguyễn Huệ, Quận 1, TPHCM"
      }
    }
  }
}

# ✅ Expected: status = "picked_up", currentLocation recorded
```

#### Step 5: Realtime Location Updates

```bash
# Shipper in transit - update location every 30s
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_ID>/location
Authorization: Bearer <SHIPPER_HCM_TOKEN>
Content-Type: application/json

{
  "latitude": 10.785,
  "longitude": 106.705,
  "address": "Gần sân bay Tân Sơn Nhất",
  "status": "in_transit"
}

# Can call multiple times as shipper moves

# Response includes updated locationHistory:
{
  "locationHistory": [
    {
      "latitude": 10.776533,
      "longitude": 106.698025,
      "address": "123 Đường Nguyễn Huệ...",
      "timestamp": "2025-12-16T10:30:00Z",
      "status": "picked_up"
    },
    {
      "latitude": 10.785,
      "longitude": 106.705,
      "address": "Gần sân bay Tân Sơn Nhất",
      "timestamp": "2025-12-16T10:35:00Z",
      "status": "in_transit"
    }
  ]
}

# ✅ Expected: Full location history tracked
```

#### Step 6: Complete Delivery

```bash
# Shipper completes delivery at customer location
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_ID>/complete
Authorization: Bearer <SHIPPER_HCM_TOKEN>
Content-Type: application/json

{
  "latitude": 10.780,
  "longitude": 106.710,
  "address": "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TPHCM",
  "notes": "Giao hàng thành công"
}

# Response:
{
  "success": true,
  "message": "Hoàn thành giai đoạn vận chuyển",
  "data": {
    "stage": {
      "status": "delivered"
    },
    "orderDetail": {
      "status": "delivered"
    },
    "mainOrder": {
      "status": "completed"
    }
  }
}

# ✅ Expected: All statuses updated to "delivered/completed"
```

#### Step 7: Customer Tracking

```bash
# Customer tracks order (PUBLIC - no auth needed)
GET http://localhost:5000/api/multi-delivery/track/<ORDERDETAIL_ID>
Content-Type: application/json

# Response:
{
  "success": true,
  "data": {
    "orderDetailId": "<ORDERDETAIL_ID>",
    "currentStatus": "delivered",
    "totalStages": 1,
    "currentStageIndex": 0,
    "isInterProvincial": false,
    "stages": [
      {
        "stageNumber": 1,
        "status": "delivered",
        "fromLocation": { ... },
        "toLocation": { ... },
        "currentLocation": {
          "latitude": 10.780,
          "longitude": 106.710,
          "address": "456 Đường Lê Lợi..."
        },
        "locationHistory": [ ... ],
        "estimatedDelivery": "2025-12-16T15:00:00Z",
        "actualDelivery": "2025-12-16T11:45:00Z"
      }
    ]
  }
}

# ✅ Expected: Full timeline visible to customer
```

---

### 🚚 Scenario 2: Liên tỉnh (Inter-Provincial - TPHCM → Hà Nội)

**Expected:** 3 delivery stages, 3 shippers

#### Step 1: Create Order (Seller TPHCM → Customer HN)

```bash
POST http://localhost:5000/api/orders/create
Authorization: Bearer <CUSTOMER_TOKEN>
Content-Type: application/json

{
  "sellerId": "<SELLER_HCM_ID>",
  "items": [ ... ],
  "shippingAddress": {
    "fullName": "Trần C",
    "phone": "0912345679",
    "province": "Hà Nội",        # ← DIFFERENT PROVINCE
    "district": "Quận Hoàn Kiếm",
    "ward": "Phường Hàng Bông",
    "address": "789 Phố Hàng Ngang"
  },
  "paymentMethod": "cod"
}

# Save orderDetailId
```

#### Step 2: Seller Ships (Auto-Creates 3 Stages)

```bash
PUT http://localhost:5000/api/orders/seller/details/<ORDERDETAIL_ID>/ship
Authorization: Bearer <SELLER_TOKEN>
Content-Type: application/json

{
  "trackingNumber": "VN002",
  "shippingMethod": "standard"
}

# Backend detects:
# - Warehouse: TPHCM
# - Customer: Hà Nội
# - → isInterProvincial = true
# → Creates 3 stages automatically
```

#### Step 3: Verify 3 Stages Created

```bash
GET http://localhost:5000/api/multi-delivery/stages/<ORDERDETAIL_ID>

# Response:
{
  "success": true,
  "data": {
    "stages": [
      {
        "stageNumber": 1,
        "status": "pending",
        "fromLocation": {
          "type": "warehouse",
          "province": "TP. Hồ Chí Minh"
        },
        "toLocation": {
          "type": "hub",
          "province": "TP. Hồ Chí Minh",
          "address": "Transfer Hub TPHCM"
        },
        "isInterProvincial": true
      },
      {
        "stageNumber": 2,
        "status": "pending",
        "fromLocation": {
          "type": "hub",
          "province": "TP. Hồ Chí Minh"
        },
        "toLocation": {
          "type": "hub",
          "province": "Hà Nội",
          "address": "Transfer Hub Hà Nội"
        },
        "isInterProvincial": true,
        "shipperType": "logistics_partner"
      },
      {
        "stageNumber": 3,
        "status": "pending",
        "fromLocation": {
          "type": "hub",
          "province": "Hà Nội"
        },
        "toLocation": {
          "type": "customer",
          "province": "Hà Nội"
        },
        "isInterProvincial": true
      }
    ]
  }
}

# ✅ Expected: 3 stages, different locations per stage
```

#### Step 4: Stage 1 - Shipper TPHCM (Warehouse → Hub TPHCM)

```bash
# Shipper HCM gets pending orders
GET http://localhost:5000/api/multi-delivery/shipper/orders
Authorization: Bearer <SHIPPER_HCM_TOKEN>

# ✅ Expected: Sees Stage 1 of inter-provincial order

# Accept → Pickup → Update Location → Complete
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_1_ID>/accept
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_1_ID>/pickup
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_1_ID>/location
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_1_ID>/complete

# Response after complete:
{
  "data": {
    "completedStage": 1,
    "nextStage": 2,
    "nextStageAssigned": false  # ← Regional carrier not yet assigned
  }
}

# ✅ Expected: Stage 1 → "delivered", Stage 2 → "pending"
```

#### Step 5: Stage 2 - Regional Carrier (Hub TPHCM → Hub HN)

```bash
# Admin/System assigns regional carrier
# (In real system: auto-routing service)
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_2_ID>/accept
Authorization: Bearer <REGIONAL_CARRIER_TOKEN>

# Regional carrier updates location as package travels
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_2_ID>/location
{
  "latitude": 10.5,
  "longitude": 105.0,
  "address": "Trên đường Hà Nội"
}

# Complete transfer at HN hub
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_2_ID>/complete
{
  "latitude": 21.0,
  "longitude": 105.8,
  "address": "Transfer Hub Hà Nội, Quận Hoàn Kiếm"
}

# Response:
{
  "completedStage": 2,
  "nextStage": 3,
  "nextStageReady": true
}

# ✅ Expected: Stage 2 → "delivered", Stage 3 ready for HN shipper
```

#### Step 6: Stage 3 - Shipper HN (Hub HN → Customer)

```bash
# Shipper HN gets pending orders
GET http://localhost:5000/api/multi-delivery/shipper/orders
Authorization: Bearer <SHIPPER_HN_TOKEN>

# ✅ Expected: Sees Stage 3 only (nội tỉnh HN)

# Accept → Pickup → Deliver
PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_3_ID>/accept
Authorization: Bearer <SHIPPER_HN_TOKEN>

PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_3_ID>/pickup
{
  "latitude": 21.0,
  "longitude": 105.8,
  "address": "Transfer Hub Hà Nội"
}

PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_3_ID>/location
{
  "latitude": 21.02,
  "longitude": 105.82,
  "address": "Đang giao hàng ở Hà Nội"
}

PUT http://localhost:5000/api/multi-delivery/stages/<STAGE_3_ID>/complete
{
  "latitude": 21.025,
  "longitude": 105.825,
  "address": "789 Phố Hàng Ngang, Phường Hàng Bông, HN"
}

# Response:
{
  "allStagesCompleted": true,
  "orderDetail": {
    "status": "delivered"
  },
  "mainOrder": {
    "status": "completed"
  }
}

# ✅ Expected: All 3 stages completed, order delivered
```

#### Step 7: Customer Tracking Full Timeline

```bash
GET http://localhost:5000/api/multi-delivery/track/<ORDERDETAIL_ID>

# Response:
{
  "success": true,
  "data": {
    "currentStatus": "delivered",
    "isInterProvincial": true,
    "totalStages": 3,
    "timeline": [
      {
        "stageNumber": 1,
        "status": "delivered",
        "description": "Lấy hàng tại kho TPHCM",
        "pickupTime": "2025-12-16T09:00:00Z",
        "deliveryTime": "2025-12-16T10:30:00Z",
        "shipper": "Shipper TPHCM"
      },
      {
        "stageNumber": 2,
        "status": "delivered",
        "description": "Vận chuyển liên tỉnh TPHCM → HN",
        "pickupTime": "2025-12-16T10:30:00Z",
        "deliveryTime": "2025-12-16T20:00:00Z",
        "shipper": "Regional Carrier"
      },
      {
        "stageNumber": 3,
        "status": "delivered",
        "description": "Giao hàng tại Hà Nội",
        "pickupTime": "2025-12-16T20:00:00Z",
        "deliveryTime": "2025-12-16T21:30:00Z",
        "shipper": "Shipper Hà Nội"
      }
    ]
  }
}

# ✅ Expected: Full inter-provincial journey visible
```

---

### 🔍 Scenario 3: Shipper Visibility Test

**Expected:** Shippers only see orders in their service area

#### Test: Shipper TPHCM should NOT see Hà Nội orders

```bash
# Create order: Seller HN → Customer HN
POST http://localhost:5000/api/orders/create
# ... (shipper address = Hà Nội)

# Ship order (creates 1 stage, Hà Nội only)
PUT http://localhost:5000/api/orders/seller/details/<ORDERDETAIL_ID>/ship

# Shipper TPHCM gets orders
GET http://localhost:5000/api/multi-delivery/shipper/orders
Authorization: Bearer <SHIPPER_HCM_TOKEN>

# Response should NOT include HN order
{
  "success": true,
  "data": {
    "pendingStages": [
      // Should NOT have the HN order here
    ]
  }
}

# ✅ Expected: Shipper TPHCM sees 0 HN orders
```

```bash
# Shipper HN gets orders
GET http://localhost:5000/api/multi-delivery/shipper/orders
Authorization: Bearer <SHIPPER_HN_TOKEN>

# Response SHOULD include HN order
{
  "success": true,
  "data": {
    "pendingStages": [
      {
        "_id": "<STAGE_ID>",
        "stageNumber": 1,
        "orderDetailId": "<ORDERDETAIL_ID>"
      }
    ]
  }
}

# ✅ Expected: Shipper HN sees 1 HN order
```

---

## Testing Methods

### Method 1: Using Postman (Recommended)

1. **Import Collection**

    - Download: [Book4U_OrderDelivery_API.postman_collection.json](./Book4U_OrderDelivery_API.postman_collection.json)
    - Import in Postman

2. **Set Environment Variables**

    ```
    - SELLER_TOKEN: <token from login>
    - SHIPPER_HCM_TOKEN: <token>
    - SHIPPER_HN_TOKEN: <token>
    - ORDERDETAIL_ID: <id>
    - STAGE_ID: <id>
    ```

3. **Run Requests in Order**
    - Create Order
    - Confirm Order
    - Ship Order
    - Get Delivery Stages
    - Accept Stage
    - Pickup Package
    - Update Location (multiple times)
    - Complete Stage
    - Track Order

### Method 2: Using cURL

```bash
# Create Order
curl -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "seller_id",
    "items": [...],
    "shippingAddress": {...}
  }'

# Get Delivery Stages
curl -X GET http://localhost:5000/api/multi-delivery/stages/orderdetail_id \
  -H "Authorization: Bearer $TOKEN"

# Accept Stage
curl -X PUT http://localhost:5000/api/multi-delivery/stages/stage_id/accept \
  -H "Authorization: Bearer $SHIPPER_TOKEN" \
  -H "Content-Type: application/json"

# Track Order (Public - no auth)
curl -X GET http://localhost:5000/api/multi-delivery/track/orderdetail_id
```

### Method 3: Frontend Testing

```jsx
// In your React component
import { createDeliveryStages, getDeliveryStages, trackOrderRealtime } from '../services/api/multiDeliveryApi';

// Test
const stages = await getDeliveryStages(orderDetailId);
console.log(stages);

// Use components
<DeliveryStageTracker orderDetailId={orderDetailId} />
<ShipperDeliveryManagement />
```

---

## Expected Results

### ✅ Nội Tỉnh (Local)

| Step            | Expected                   | Verify        |
| --------------- | -------------------------- | ------------- |
| Order created   | Status: pending            | DB            |
| Order confirmed | Status: confirmed          | DB            |
| Order shipped   | **1 stage created**        | `GET /stages` |
| Stage created   | `isInterProvincial: false` | Response      |
| Shipper accepts | `status: accepted`         | Response      |
| Shipper pickup  | `status: picked_up`        | Response      |
| Location update | `locationHistory` recorded | Response      |
| Stage complete  | `status: delivered`        | Response      |
| Order complete  | `status: delivered`        | DB            |
| Track order     | Timeline shows 1 stage     | `GET /track`  |

### ✅ Liên Tỉnh (Inter-Provincial)

| Step            | Expected              | Verify                |
| --------------- | --------------------- | --------------------- |
| Order created   | Status: pending       | DB                    |
| Order shipped   | **3 stages created**  | `GET /stages`         |
| Stage 1 created | Warehouse → Hub TPHCM | Response              |
| Stage 2 created | Hub TPHCM → Hub HN    | Response              |
| Stage 3 created | Hub HN → Customer     | Response              |
| Shipper TPHCM   | Sees only Stage 1     | `GET /shipper/orders` |
| Shipper HN      | Sees only Stage 3     | `GET /shipper/orders` |
| All complete    | 3 stages delivered    | `GET /track`          |

### ✅ Shipper Visibility

| Shipper | Sees            | Not Sees        |
| ------- | --------------- | --------------- |
| TPHCM   | Orders in TPHCM | Orders in HN    |
| HN      | Orders in HN    | Orders in TPHCM |

---

## Troubleshooting

### ❌ Problem: "Stages not created when shipping"

**Solution:**

1. Check `orderDetailSellerController.js` - verify helper function called
2. Check warehouse location has `province` field
3. Verify `ShipperCoverageArea` has correct provinces
4. Check MongoDB - `DeliveryStage` collection created?

```bash
# Test in MongoDB
db.deliverystages.find()
```

### ❌ Problem: "Shipper doesn't see any orders"

**Solution:**

1. Check `ShipperCoverageArea` exists for shipper
2. Verify province name matches exactly (case-sensitive)
3. Check shipper's `coverageAreas` array populated

```bash
# In MongoDB
db.shippercoverageareas.findOne({shipperId: "..."})
```

### ❌ Problem: "Wrong number of stages created"

**Solution:**

1. Check warehouse `province` field
2. Check shipping address `province` field
3. Verify comparison logic in helper function

```bash
# Debug:
console.log({
  warehouseProvince: warehouse.province,
  customerProvince: shippingAddress.province,
  match: warehouse.province === shippingAddress.province
})
```

### ❌ Problem: "Location history not tracking"

**Solution:**

1. Check `updateShipperLocation` called with proper data
2. Verify `locationHistory` schema allows subdocuments
3. Check timestamps in database

```bash
# In MongoDB
db.deliverystages.findOne({_id: ObjectId("...")}).locationHistory
```

### ❌ Problem: "API returns 401 Unauthorized"

**Solution:**

1. Check token not expired
2. Verify token in `Authorization: Bearer` header
3. Check `authMiddleware` receiving correct header
4. Verify JWT secret matches

### ❌ Problem: "CORS or 404 errors"

**Solution:**

1. Check routes registered in `routes/index.js`
2. Verify endpoint URL matches route (e.g., `/api/multi-delivery/...`)
3. Check server running on correct port
4. Frontend baseURL matches backend

---

## Checklist: Ready to Test

-   [ ] Backend running (`npm start`)
-   [ ] MongoDB connected
-   [ ] `DeliveryStage` model loaded
-   [ ] `ShipperCoverageArea` model loaded
-   [ ] Routes `/api/multi-delivery` registered
-   [ ] Routes `/api/shipper-coverage` registered
-   [ ] Test sellers created with warehouses
-   [ ] Test shippers created with coverage areas
-   [ ] Postman/curl tools ready
-   [ ] Browser ready for tracking test

---

## Next Steps

1. **Run Scenario 1** (Nội tỉnh) → Should complete in 5-10 mins
2. **Run Scenario 2** (Liên tỉnh) → Should complete in 15-20 mins
3. **Run Scenario 3** (Visibility) → Should complete in 5 mins
4. **Check Database** → Verify all data stored correctly
5. **Check Frontend** → Verify UI renders tracking data

---

## Contact

If errors occur:

1. Check terminal logs (backend)
2. Check MongoDB logs
3. Check browser console (frontend)
4. Check Postman response body
5. Refer to **Troubleshooting** section above

**Happy Testing! 🚀**
