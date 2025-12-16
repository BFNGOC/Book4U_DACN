# 📦 HỆ THỐNG GIAO HÀNG LIÊN TỈNH - HƯỚNG DẪN ĐẦY ĐỦ

## 🎯 Tổng Quan Hệ Thống

Hệ thống Book4U hỗ trợ giao hàng khi cửa hàng (warehouse) và khách hàng ở các tỉnh khác nhau, với các giai đoạn vận chuyển rõ ràng.

### 📊 Hai Trường Hợp Chính

#### 1. **Nội Tỉnh (Cùng Tỉnh)** - 1 Giai Đoạn

```
Warehouse (TPHCM) → Customer (TPHCM)
         ↓
    1 Stage: Warehouse → Customer
    Shipper TPHCM thực hiện toàn bộ
```

#### 2. **Liên Tỉnh (Khác Tỉnh)** - 3 Giai Đoạn

```
Warehouse (TPHCM) → Customer (Hà Nội)
         ↓
Stage 1: Warehouse (TPHCM) → Transfer Hub TPHCM
         (Shipper TPHCM thực hiện)
         ↓
Stage 2: Transfer Hub TPHCM → Transfer Hub Hà Nội
         (Regional Carrier / Auto tương chuyển)
         ↓
Stage 3: Transfer Hub Hà Nội → Customer (Hà Nội)
         (Shipper Hà Nội thực hiện)
```

---

## 🏗️ KIẾN TRÚC BACKEND

### Models

#### 1. **DeliveryStage** (`Server/src/models/deliveryStageModel.js`)

Quản lý từng giai đoạn vận chuyển.

**Fields chính:**

-   `stageNumber`: Số thứ tự (1, 2, 3...)
-   `totalStages`: Tổng số giai đoạn
-   `isLastStage`: Là stage cuối không?
-   `fromLocation`: Vị trí bắt đầu (warehouse/hub/customer)
-   `toLocation`: Vị trí kết thúc (warehouse/hub/customer)
-   `assignedShipperId`: Shipper quản lý giai đoạn này
-   `status`: pending → accepted → picked_up → in_transit → delivered
-   `currentLocation`: Vị trí hiện tại (realtime)
-   `locationHistory`: Lịch sử vị trí (array)

#### 2. **OrderDetail** (`Server/src/models/orderDetailModel.js`)

Mở rộng để hỗ trợ multi-stage delivery.

**Fields mới:**

-   `deliveryStages`: Array của DeliveryStage IDs
-   `currentStageIndex`: Stage hiện tại đang xử lý
-   `fromProvince`: Tỉnh warehouse
-   `toProvince`: Tỉnh customer
-   `isInterProvincial`: Là giao hàng liên tỉnh?

#### 3. **ShipperCoverageArea** (`Server/src/models/shipperCoverageAreaModel.js`)

Định nghĩa khu vực phục vụ của shipper.

**Fields chính:**

-   `shipperId`: ID của shipper
-   `shipperType`: 'local' | 'regional' | 'national'
-   `coverageAreas`: Array của {province, districts}
-   `currentLocation`: Vị trí hiện tại của shipper
-   `isOnline`: Shipper có online không?
-   `ordersCapacity`: {currentActiveOrders, maxOrdersPerDay}

---

### Controllers

#### 1. **multiStageDeliveryController.js**

**Các hàm chính:**

```javascript
// Tạo delivery stages (1 hoặc 3 tùy warehouse & customer province)
createDeliveryStages(req, res)
  Input: { orderDetailId }
  Output: { stages: [...], isInterProvincial, totalStages }

// Lấy tất cả stages của một order
getDeliveryStages(req, res)
  Input: { orderDetailId }
  Output: { stages: [...], currentStageIndex }

// Shipper chấp nhận nhận stage
acceptDeliveryStage(req, res)
  Input: { stageId }
  Output: { status: 'accepted', acceptedAt }

// Shipper lấy hàng từ vị trí cũ
pickupPackage(req, res)
  Input: { stageId, latitude, longitude, address }
  Output: { status: 'picked_up', pickedUpAt }

// Cập nhật vị trí realtime (GPS tracking)
updateShipperLocation(req, res)
  Input: { stageId, latitude, longitude, address, status }
  Output: { stageId, currentLocation }

// Hoàn thành một giai đoạn
completeDeliveryStage(req, res)
  Input: { stageId, latitude, longitude, address, notes }
  Output: { status: 'delivered', isLastStage }

// Lấy danh sách orders chờ pickup cho shipper
getShipperOrders(req, res)
  Output: { provincesCovered, pendingOrders, count }
  (Lọc theo ShipperCoverageArea của shipper)

// Khách hàng tracking order realtime
trackOrderRealtime(req, res)
  Input: { orderDetailId }
  Output: { currentStage, stages (timeline), currentLocation }
```

---

### Routes

**Endpoint mapping** (`Server/src/routes/multiStageDeliveryRoutes.js`):

```
POST   /api/multi-delivery/stages/create           Tạo stages
GET    /api/multi-delivery/stages/:orderDetailId   Lấy stages
PUT    /api/multi-delivery/stages/:stageId/accept  Chấp nhận
PUT    /api/multi-delivery/stages/:stageId/pickup  Lấy hàng
PUT    /api/multi-delivery/stages/:stageId/location Cập nhật vị trí
PUT    /api/multi-delivery/stages/:stageId/complete Hoàn thành
GET    /api/multi-delivery/shipper/orders          Danh sách shipper
GET    /api/multi-delivery/track/:orderDetailId    Tracking khách
```

---

## 🎨 KIẾN TRÚC FRONTEND

### Pages

#### 1. **ShipperDashboard** (`Client/Book4U/src/pages/shipper/ShipperDashboard.jsx`)

Dashboard chính cho shipper.

**Tính năng:**

-   Danh sách đơn hàng chờ pickup
-   GPS tracking realtime
-   Toggle between list view & map view
-   Auto-refresh every 60 seconds

**State:**

```javascript
const [orders, setOrders] = useState([]);
const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
const [currentLocation, setCurrentLocation] = useState(null);
```

---

### Components

#### 1. **ShipperDeliveryManagement** (`src/components/shipper/ShipperDeliveryManagement.jsx`)

Quản lý delivery stages cho shipper.

**Tính năng:**

-   Hiển thị danh sách pending orders
-   Shipper chấp nhận đơn hàng
-   Expand/collapse order details
-   Auto-refresh

#### 2. **DeliveryMapTracker** (`src/components/tracking/DeliveryMapTracker.jsx`)

Hiển thị delivery stages trên Google Maps.

**Tính năng:**

-   Load Google Maps API
-   Vẽ markers cho warehouse, hubs, customer, shipper
-   Vẽ route lines giữa các điểm
-   Hiển thị stage status colors
-   Polling updates every 30 seconds

**Props:**

```javascript
{
  orderDetailId: string,
  height?: string // default 'h-96'
}
```

#### 3. **DeliveryStageTracker** (`src/components/tracking/DeliveryStageTracker.jsx`)

Timeline view cho các stages.

**Hiển thị:**

-   Stage 1, 2, 3 status
-   Từ → Tới location
-   Thời gian hoàn thành (nếu có)
-   Current stage highlight

#### 4. **ShipperOrderList** (`src/components/shipper/ShipperOrderList.jsx`)

Danh sách orders cho shipper.

**Hiển thị:**

-   Order ID, items
-   From/To location
-   Distance estimate
-   Pickup/Delivery buttons

#### 5. **ShipperOrderMap** (`src/components/shipper/ShipperOrderMap.jsx`)

Map view cho danh sách orders.

**Tính năng:**

-   Hiển thị markers cho all pending orders
-   Shipper location marker
-   Click marker để xem order details

---

### APIs

#### **multiDeliveryApi** (`Client/Book4U/src/services/api/multiDeliveryApi.js`)

```javascript
// Multi-Stage Delivery
createDeliveryStages(data);
getDeliveryStages(orderDetailId);
acceptDeliveryStage(stageId);
pickupPackage(stageId, location);
updateShipperLocation(stageId, locationData);
completeDeliveryStage(stageId, deliveryData);
getShipperOrders(params);
trackOrderRealtime(orderDetailId);

// Shipper Coverage
createOrUpdateCoverageArea(data);
getCoverageArea(shipperId);
getShippersForProvince(province);
updateCoverageShipperLocation(shipperId, locationData);
updateShipperStatus(shipperId, data);
updateOrdersCapacity(shipperId, data);
updateShipperPerformance(shipperId, data);
```

---

## 🔄 QURI DELIVERY FLOW

### Quy Trình Nội Tỉnh (1 Stage)

```
1. Seller tạo order → Confirm → Ready to ship
                         ↓
2. Seller bấm "Giao hàng" (Ship)
   - Hệ thống detect: Warehouse.province === Customer.province
                         ↓
3. Tạo 1 DeliveryStage
   - fromLocation: Warehouse
   - toLocation: Customer
   - status: 'pending'
   - assignedShipperId: null
                         ↓
4. Shipper TPHCM thấy order trong dashboard
   - Call: getShipperOrders()
   - Filter: toLocation.province = 'TP.HCM' (shipper coverage)
                         ↓
5. Shipper chấp nhận
   - Call: acceptDeliveryStage(stageId)
   - status: pending → accepted
                         ↓
6. Shipper lấy hàng
   - Call: pickupPackage(stageId, location)
   - status: accepted → picked_up
                         ↓
7. Shipper giao hàng (GPS tracking)
   - Call: updateShipperLocation() nhiều lần
   - Khách hàng xem tracking realtime
                         ↓
8. Shipper hoàn thành
   - Call: completeDeliveryStage(stageId, location)
   - status: in_transit → delivered
   - OrderDetail.status: shipping → delivered
   - MainOrder.status: (check all items) → completed
```

### Quy Trình Liên Tỉnh (3 Stages)

```
1. Seller tạo order → Confirm → Ready to ship
                         ↓
2. Seller bấm "Giao hàng" (Ship)
   - Hệ thống detect: Warehouse.province ≠ Customer.province
   - TP.HCM → Hà Nội
                         ↓
3. Tạo 3 DeliveryStages:

   STAGE 1: Warehouse (TPHCM) → Transfer Hub (TPHCM)
   - fromLocation: {type: 'warehouse', province: 'TP.HCM'}
   - toLocation: {type: 'transfer_hub', province: 'TP.HCM'}
   - assignedShipperId: null
   - status: 'pending'
                         ↓
   STAGE 2: Transfer Hub (TPHCM) → Transfer Hub (HN)
   - fromLocation: {type: 'transfer_hub', province: 'TP.HCM'}
   - toLocation: {type: 'transfer_hub', province: 'Hà Nội'}
   - assignedShipperId: null (Regional Carrier)
   - status: 'pending'
                         ↓
   STAGE 3: Transfer Hub (HN) → Customer (HN)
   - fromLocation: {type: 'transfer_hub', province: 'Hà Nội'}
   - toLocation: {type: 'customer', province: 'Hà Nội'}
   - assignedShipperId: null
   - status: 'pending'

   OrderDetail.currentStageIndex = 0 (Stage 1)
                         ↓
4. Shipper TPHCM thấy Stage 1 trong dashboard
   - getShipperOrders() filters: coverage.province includes 'TP.HCM'
                         ↓
5. Shipper TPHCM chấp nhận Stage 1
   - acceptDeliveryStage(stageId)
                         ↓
6. Shipper TPHCM lấy hàng từ warehouse
   - pickupPackage(stageId, location)
                         ↓
7. Shipper TPHCM vận chuyển tới Transfer Hub TPHCM
   - updateShipperLocation() (GPS tracking)
                         ↓
8. Shipper TPHCM hoàn thành Stage 1
   - completeDeliveryStage(stageId)
   - Stage 1: delivered
   - OrderDetail.currentStageIndex = 1 (Stage 2 activated)
   - Stage 2.status: pending → (waiting for system/regional carrier)
                         ↓
9. [System/Regional Carrier] Stage 2 - Transfer (Auto)
   - Chuyển hàng từ Hub TPHCM → Hub HN
   - completeDeliveryStage(stage2Id) khi tới Hub HN
   - Stage 2: delivered
   - OrderDetail.currentStageIndex = 2 (Stage 3 activated)
                         ↓
10. Shipper Hà Nội thấy Stage 3 trong dashboard
    - getShipperOrders() filters: coverage.province includes 'Hà Nội'
                         ↓
11. Shipper Hà Nội chấp nhận Stage 3
    - acceptDeliveryStage(stageId)
                         ↓
12. Shipper Hà Nội lấy hàng từ Transfer Hub HN
    - pickupPackage(stageId, location)
                         ↓
13. Shipper Hà Nội giao hàng tới khách
    - updateShipperLocation() (GPS tracking)
                         ↓
14. Shipper Hà Nội hoàn thành Stage 3
    - completeDeliveryStage(stageId, location)
    - Stage 3: delivered (isLastStage = true)
    - OrderDetail.status: shipping → delivered
    - MainOrder.status: (all items delivered) → completed
```

---

## 🗺️ GOOGLE MAPS INTEGRATION

### DeliveryMapTracker Component

**Dependencies:**

```
Google Maps API (v3)
latitude, longitude fields in models
```

**Markers:**

-   🟢 Warehouse: Green
-   🔵 Transfer Hubs: Blue
-   🔴 Customer: Red
-   🟡 Shipper: Yellow (realtime)

**Lines:**

-   Stage 1: Warehouse → Hub TPHCM
-   Stage 2: Hub TPHCM → Hub HN (optional, hidden if transfer)
-   Stage 3: Hub HN → Customer

**Color Legend:**

-   Gray: Pending
-   Yellow: Accepted/In Transit
-   Green: Delivered
-   Red: Failed

---

## 🚀 USAGE EXAMPLES

### 1. Seller tạo delivery stages

```bash
POST /api/multi-delivery/stages/create
Authorization: Bearer <seller_token>
Content-Type: application/json

{
  "orderDetailId": "693ed382a3d1e8b406613a6e"
}

Response (Nội tỉnh):
{
  "success": true,
  "data": {
    "orderDetailId": "693ed382a3d1e8b406613a6e",
    "stages": [{
      "_id": "stage_1",
      "stageNumber": 1,
      "totalStages": 1,
      "isLastStage": true,
      "status": "pending",
      "fromLocation": { ... },
      "toLocation": { ... }
    }],
    "isInterProvincial": false,
    "totalStages": 1
  }
}

Response (Liên tỉnh):
{
  "success": true,
  "data": {
    "orderDetailId": "693ed382a3d1e8b406613a6e",
    "stages": [
      { stageNumber: 1, totalStages: 3, isLastStage: false, ... },
      { stageNumber: 2, totalStages: 3, isLastStage: false, ... },
      { stageNumber: 3, totalStages: 3, isLastStage: true, ... }
    ],
    "isInterProvincial": true,
    "totalStages": 3
  }
}
```

### 2. Shipper lấy danh sách orders

```bash
GET /api/multi-delivery/shipper/orders
Authorization: Bearer <shipper_token>

Response:
{
  "success": true,
  "data": {
    "shipperId": "shipper_001",
    "provincesCovered": ["TP.HCM", "Bình Dương"],
    "pendingOrders": [
      {
        "_id": "stage_1",
        "stageNumber": 1,
        "status": "pending",
        "fromLocation": { ... },
        "toLocation": { ... }
      }
    ],
    "count": 1
  }
}
```

### 3. Shipper chấp nhận và lấy hàng

```bash
# Chấp nhận
PUT /api/multi-delivery/stages/:stageId/accept
Authorization: Bearer <shipper_token>

Response:
{
  "success": true,
  "message": "Đã chấp nhận đơn hàng",
  "data": {
    "stageId": "stage_1",
    "status": "accepted",
    "acceptedAt": "2025-12-16T10:30:00Z"
  }
}

# Lấy hàng
PUT /api/multi-delivery/stages/:stageId/pickup
Authorization: Bearer <shipper_token>
Content-Type: application/json

{
  "latitude": 10.7769,
  "longitude": 106.6869,
  "address": "Kho 123 đường ABC, TPHCM"
}

Response:
{
  "success": true,
  "message": "Đã lấy hàng",
  "data": {
    "stageId": "stage_1",
    "status": "picked_up",
    "pickedUpAt": "2025-12-16T10:35:00Z"
  }
}
```

### 4. Shipper cập nhật vị trí realtime

```bash
PUT /api/multi-delivery/stages/:stageId/location
Authorization: Bearer <shipper_token>
Content-Type: application/json

{
  "latitude": 10.7780,
  "longitude": 106.6880,
  "address": "Đường D, Quận 1, TPHCM",
  "status": "in_transit"
}

Response:
{
  "success": true,
  "message": "Cập nhật vị trí thành công",
  "data": {
    "stageId": "stage_1",
    "currentLocation": {
      "latitude": 10.7780,
      "longitude": 106.6880,
      "address": "Đường D, Quận 1, TPHCM",
      "timestamp": "2025-12-16T10:40:00Z"
    }
  }
}
```

### 5. Shipper hoàn thành giai đoạn

```bash
PUT /api/multi-delivery/stages/:stageId/complete
Authorization: Bearer <shipper_token>
Content-Type: application/json

{
  "latitude": 10.7900,
  "longitude": 106.7000,
  "address": "123 đường ABC, Quận 1, TPHCM",
  "notes": "Giao thành công, khách hàng ký tên"
}

Response (Nội tỉnh - Stage cuối):
{
  "success": true,
  "message": "Đơn hàng đã giao thành công",
  "data": {
    "stageId": "stage_1",
    "status": "delivered",
    "isLastStage": true
  }
}

Response (Liên tỉnh - Stage 1 hoàn thành):
{
  "success": true,
  "message": "Giai đoạn hoàn tất, chuyển sang giai đoạn tiếp theo",
  "data": {
    "stageId": "stage_1",
    "status": "delivered",
    "isLastStage": false
  }
}
(Hệ thống tự động kích hoạt Stage 2)
```

### 6. Khách hàng tracking order

```bash
GET /api/multi-delivery/track/:orderDetailId
(No authentication required)

Response:
{
  "success": true,
  "data": {
    "orderDetailId": "693ed382a3d1e8b406613a6e",
    "status": "in_delivery_stage",
    "isInterProvincial": true,
    "currentStageIndex": 1,
    "totalStages": 3,
    "currentStage": {
      "stageNumber": 2,
      "status": "in_transit",
      "fromLocation": { ... },
      "toLocation": { ... },
      "currentLocation": {
        "latitude": 10.8000,
        "longitude": 106.7500,
        "timestamp": "2025-12-16T10:45:00Z"
      },
      "locationHistory": [ ... ]
    },
    "stages": [
      { stageNumber: 1, status: "delivered", ... },
      { stageNumber: 2, status: "in_transit", ... },
      { stageNumber: 3, status: "pending", ... }
    ]
  }
}
```

---

## 🧪 TESTING CHECKLIST

### Test Cases

#### 1. **Nội Tỉnh Delivery**

-   [ ] Seller ship order (same province)
-   [ ] System creates 1 stage
-   [ ] Shipper sees order in dashboard
-   [ ] Shipper accepts order
-   [ ] Shipper picks up package
-   [ ] Shipper tracks location realtime
-   [ ] Customer sees tracking in realtime
-   [ ] Shipper completes delivery
-   [ ] OrderDetail status = delivered
-   [ ] MainOrder status = completed (if all items delivered)

#### 2. **Liên Tỉnh Delivery**

-   [ ] Seller ship order (different province)
-   [ ] System creates 3 stages
-   [ ] Stage 1 shipper sees order (province 1)
-   [ ] Stage 1 shipper completes delivery to hub
-   [ ] Stage 1 changes to delivered
-   [ ] Stage 2 auto-activated (or system completes)
-   [ ] Stage 3 shipper sees order (province 2)
-   [ ] Stage 3 shipper completes delivery to customer
-   [ ] All stages delivered
-   [ ] MainOrder status = completed

#### 3. **Shipper Coverage Filtering**

-   [ ] Shipper A (TP.HCM) only sees TPHCM orders
-   [ ] Shipper B (Hà Nội) only sees HN orders
-   [ ] Shipper can't see orders outside coverage area

#### 4. **Real-time Tracking**

-   [ ] Customer receives location updates every 30 seconds
-   [ ] Map shows shipper position, warehouse, customer
-   [ ] Route lines drawn correctly
-   [ ] Stage status colors updated
-   [ ] Delivery attempt details shown

#### 5. **Stage Transitions**

-   [ ] pending → accepted
-   [ ] accepted → picked_up
-   [ ] picked_up → in_transit
-   [ ] in_transit → (at_next_hub for stage 1/2)
-   [ ] → delivered
-   [ ] Stage 1 complete → Stage 2 activated
-   [ ] Stage 2 complete → Stage 3 activated
-   [ ] Stage 3 complete → OrderDetail delivered

---

## 🔧 CONFIGURATION

### Environment Variables

```
# .env (Frontend)
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# .env (Backend)
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Database Indexes

```javascript
// DeliveryStage
DeliveryStage.collection.createIndex({ mainOrderId: 1, stageNumber: 1 });
DeliveryStage.collection.createIndex({ mainOrderId: 1, status: 1 });
DeliveryStage.collection.createIndex({ orderDetailId: 1 });
DeliveryStage.collection.createIndex({ assignedShipperId: 1, status: 1 });
DeliveryStage.collection.createIndex({ 'toLocation.province': 1, status: 1 });

// OrderDetail
OrderDetail.collection.createIndex({ mainOrderId: 1 });
OrderDetail.collection.createIndex({ sellerId: 1 });
OrderDetail.collection.createIndex({ isInterProvincial: 1 });

// ShipperCoverageArea
ShipperCoverageArea.collection.createIndex({ shipperId: 1 });
ShipperCoverageArea.collection.createIndex({ 'coverageAreas.province': 1 });
```

---

## 📚 API REFERENCE

### Create Delivery Stages

```
POST /api/multi-delivery/stages/create
Auth: ✅ Required (Seller)

Body:
  orderDetailId: string (required)

Response:
  {
    success: boolean,
    data: {
      orderDetailId: string,
      stages: DeliveryStage[],
      isInterProvincial: boolean,
      totalStages: number
    }
  }
```

### Get Delivery Stages

```
GET /api/multi-delivery/stages/:orderDetailId
Auth: Optional

Response:
  {
    success: boolean,
    data: {
      orderDetailId: string,
      stages: DeliveryStage[],
      currentStageIndex: number,
      isInterProvincial: boolean
    }
  }
```

### Accept Delivery Stage

```
PUT /api/multi-delivery/stages/:stageId/accept
Auth: ✅ Required (Shipper)

Body: (empty)

Response:
  {
    success: boolean,
    message: string,
    data: {
      stageId: string,
      status: 'accepted',
      acceptedAt: ISO8601Date
    }
  }
```

### Pickup Package

```
PUT /api/multi-delivery/stages/:stageId/pickup
Auth: ✅ Required (Shipper)

Body:
  {
    latitude: number,
    longitude: number,
    address: string
  }

Response:
  {
    success: boolean,
    message: string,
    data: {
      stageId: string,
      status: 'picked_up',
      pickedUpAt: ISO8601Date
    }
  }
```

### Update Shipper Location (Real-time)

```
PUT /api/multi-delivery/stages/:stageId/location
Auth: ✅ Required (Shipper)

Body:
  {
    latitude: number,
    longitude: number,
    address: string,
    status?: string // 'in_transit' | 'in_transit_with_gps'
  }

Response:
  {
    success: boolean,
    message: string,
    data: {
      stageId: string,
      currentLocation: {
        latitude: number,
        longitude: number,
        address: string,
        timestamp: ISO8601Date
      }
    }
  }
```

### Complete Delivery Stage

```
PUT /api/multi-delivery/stages/:stageId/complete
Auth: ✅ Required (Shipper)

Body:
  {
    latitude: number,
    longitude: number,
    address: string,
    notes?: string
  }

Response:
  {
    success: boolean,
    message: string,
    data: {
      stageId: string,
      status: 'delivered',
      isLastStage: boolean
    }
  }
```

### Get Shipper Orders

```
GET /api/multi-delivery/shipper/orders
Auth: ✅ Required (Shipper)

Query Params:
  (none - filters by shipper's coverage area)

Response:
  {
    success: boolean,
    data: {
      shipperId: string,
      provincesCovered: string[],
      pendingOrders: DeliveryStage[],
      count: number
    }
  }
```

### Track Order (Real-time)

```
GET /api/multi-delivery/track/:orderDetailId
Auth: Not required

Response:
  {
    success: boolean,
    data: {
      orderDetailId: string,
      status: string,
      isInterProvincial: boolean,
      currentStageIndex: number,
      totalStages: number,
      currentStage: {
        stageNumber: number,
        status: string,
        fromLocation: Object,
        toLocation: Object,
        currentLocation: Object,
        locationHistory: Object[],
        timeline: Object
      },
      stages: Array // All stages timeline
    }
  }
```

---

## 🎯 FREQUENTLY ASKED QUESTIONS

### Q: Shipper ở Tỉnh A thấy được đơn hàng liên tỉnh không?

**A:** Chỉ shipper của tỉnh mà bạn cần giao mới thấy được. Nếu:

-   Warehouse TP.HCM → Customer Hà Nội
-   Shipper TP.HCM thấy Stage 1 (Warehouse → Hub TPHCM)
-   Shipper Hà Nội thấy Stage 3 (Hub HN → Customer)
-   Shipper TP.HCM KHÔNG thấy Stage 3

### Q: Làm sao để update vị trí realtime?

**A:** Gọi `updateShipperLocation()` thường xuyên (mỗi 10-30 giây):

```javascript
setInterval(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
        updateShipperLocation(stageId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: 'Current Address',
            status: 'in_transit',
        });
    });
}, 30000);
```

### Q: Stage 2 (transfer) ai xử lý?

**A:**

-   Nếu tự động: Hệ thống auto complete Stage 2 khi tới hub kế tiếp
-   Nếu manual: Admin / Regional Carrier phải complete Stage 2

### Q: Khách hàng xem được tracking ở đâu?

**A:** Bất cứ page nào gọi `trackOrderRealtime(orderDetailId)` đều nhìn được:

-   Order Detail page
-   My Orders page
-   Customer Dashboard

---

## 📞 SUPPORT

For issues or questions, please refer to:

-   [MULTI_STAGE_DELIVERY_GUIDE.md](./MULTI_STAGE_DELIVERY_GUIDE.md)
-   [API_SERVICES_ARCHITECTURE.md](./API_SERVICES_ARCHITECTURE.md)
-   Backend logs: `Server/logs/`
