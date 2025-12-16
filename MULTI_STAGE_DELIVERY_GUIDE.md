# 🚚 HỆ THỐNG VẬN CHUYỂN LIÊN TỈNH - HƯỚNG DẪN TRIỂN KHAI

## 📋 Mục lục

1. [Tổng quan hệ thống](#tổng-quan)
2. [Kiến trúc kỹ thuật](#kiến-trúc)
3. [Quy trình vận chuyển](#quy-trình)
4. [API Endpoints](#api-endpoints)
5. [Hướng dẫn sử dụng](#hướng-dẫn)
6. [Test scenarios](#test-scenarios)

---

## 🎯 Tổng quan

### Yêu cầu chức năng

-   ✅ Vận chuyển multi-stage: nội tỉnh → liên tỉnh → nội tỉnh
-   ✅ Shipper chỉ nhìn thấy đơn trong khu vực mình phụ trách
-   ✅ Quản lý trạng thái từng giai đoạn vận chuyển
-   ✅ Hiển thị vị trí realtime trên bản đồ
-   ✅ Cả client (khách) và server (hệ thống)

### Ví dụ: TPHCM → Hà Nội

```
Stage 1: Warehouse TPHCM → Transfer Hub TPHCM (Shipper TPHCM)
                         ↓
Stage 2: Transfer Hub TPHCM → Transfer Hub Hà Nội (Regional Carrier)
                         ↓
Stage 3: Transfer Hub Hà Nội → Customer Hà Nội (Shipper Hà Nội)
```

---

## 🏗️ Kiến trúc

### Models

#### 1. **DeliveryStage** - Quản lý từng giai đoạn

```javascript
{
  mainOrderId: ObjectId,
  orderDetailId: ObjectId,
  stageNumber: 1,        // 1, 2, 3...
  totalStages: 3,
  status: 'pending|accepted|picked_up|in_transit|at_next_hub|delivered|failed',
  fromLocation: {
    locationType: 'warehouse|transfer_hub|customer',
    province, district, latitude, longitude, address
  },
  toLocation: { ... same structure ... },
  assignedShipperId: ObjectId,
  currentLocation: { latitude, longitude, timestamp },
  locationHistory: [{ status, address, timestamp }],
  deliveryAttempts: { count, attempts: [...] },
  createdAt, acceptedAt, pickedUpAt, inTransitAt, deliveredAt
}
```

#### 2. **ShipperCoverageArea** - Khu vực phục vụ shipper

```javascript
{
  shipperId: ObjectId,
  shipperType: 'local|regional|logistics_partner',
  coverageAreas: [
    {
      province: 'TP.HCM',
      districts: ['Quận 1', 'Quận 2', ...], // Nếu rỗng = toàn tỉnh
      wards: [...]  // Nếu rỗng = toàn bộ
    }
  ],
  mainWarehouseId: ObjectId,
  status: 'active|inactive|suspended|on_leave',
  currentLocation: { latitude, longitude, isOnline },
  capacity: { currentActiveOrders, maxOrdersPerDay, isAvailable },
  performance: { totalDeliveries, successfulDeliveries, averageRating }
}
```

#### 3. **OrderDetail** - Mở rộng với multi-stage

```javascript
{
  // Existing fields...
  status: 'pending|confirmed|packing|shipping|in_delivery_stage|delivered|cancelled',

  // NEW: Multi-stage fields
  deliveryStages: [ObjectId, ObjectId, ...],
  currentStageIndex: 0,
  fromProvince: 'TP.HCM',
  toProvince: 'Hà Nội',
  isInterProvincial: true,
  deliveryRouteNotes: 'Liên tỉnh: TPHCM → HN'
}
```

---

## 📊 Quy trình vận chuyển

### 1️⃣ Seller xác nhận đơn hàng

```
POST /api/orders/seller/details/:orderDetailId/confirm
```

-   Trừ stock
-   Tạo warehouse log
-   Status: pending → confirmed

### 2️⃣ Seller ship đơn hàng

```
POST /api/orders/seller/details/:orderDetailId/ship
```

-   Kiểm tra warehouse province vs customer province
-   **Nếu cùng tỉnh**: Status = "shipping" (bình thường)
-   **Nếu khác tỉnh**: Gọi `createDeliveryStages()` → Status = "in_delivery_stage"

### 3️⃣ Tạo Delivery Stages (nếu liên tỉnh)

#### Nội tỉnh (1 stage):

```
Stage 1: Warehouse → Customer (1 Shipper)
```

#### Liên tỉnh (3 stages):

```
Stage 1: Warehouse TPHCM → Transfer Hub TPHCM (Shipper TPHCM)
Stage 2: Transfer Hub TPHCM → Transfer Hub Hà Nội (Regional Carrier)
Stage 3: Transfer Hub Hà Nội → Customer (Shipper Hà Nội)
```

### 4️⃣ Shipper nhận đơn hàng

```
PUT /api/multi-delivery/stages/:stageId/accept
- Kiểm tra quyền (shipper phục vụ khu vực này?)
- Gán: assignedShipperId
- Status: pending → accepted
```

### 5️⃣ Shipper lấy hàng

```
PUT /api/multi-delivery/stages/:stageId/pickup
{
  latitude, longitude, address
}
- Status: accepted → picked_up
- Lưu currentLocation
- Thêm vào locationHistory
```

### 6️⃣ Vận chuyển + Tracking realtime

```
PUT /api/multi-delivery/stages/:stageId/location
{
  latitude, longitude, address, status: 'in_transit_with_gps'
}
- Cập nhật currentLocation liên tục
- Lưu toàn bộ locationHistory
- Frontend polling/WebSocket để hiển thị realtime
```

### 7️⃣ Hoàn thành giai đoạn

```
PUT /api/multi-delivery/stages/:stageId/complete
{
  latitude, longitude, address, notes
}
- Status: in_transit → delivered
- Nếu isLastStage = true:
  - OrderDetail status → delivered
  - Kiểm tra tất cả OrderDetails → nếu toàn delivered → MainOrder = completed
- Nếu không, chuyển sang stage tiếp theo
```

---

## 📡 API Endpoints

### Backend APIs

#### Multi-Stage Delivery

```
POST   /api/multi-delivery/stages/create              # Tạo stages
GET    /api/multi-delivery/stages/:orderDetailId      # Lấy stages
PUT    /api/multi-delivery/stages/:stageId/accept     # Chấp nhận
PUT    /api/multi-delivery/stages/:stageId/pickup     # Lấy hàng
PUT    /api/multi-delivery/stages/:stageId/location   # Cập nhật vị trí
PUT    /api/multi-delivery/stages/:stageId/complete   # Hoàn thành
GET    /api/multi-delivery/shipper/orders             # Danh sách đơn (shipper)
GET    /api/multi-delivery/track/:orderDetailId       # Tracking (khách)
```

#### Shipper Coverage Area

```
POST   /api/shipper-coverage/create                   # Tạo/cập nhật khu vực
GET    /api/shipper-coverage/:shipperId               # Lấy khu vực shipper
GET    /api/shipper-coverage/province/:province       # Shippers của tỉnh
PUT    /api/shipper-coverage/:shipperId/location      # Cập nhật vị trí shipper
PUT    /api/shipper-coverage/:shipperId/status        # Cập nhật status
PUT    /api/shipper-coverage/:shipperId/orders-capacity  # Cập nhật công suất
PUT    /api/shipper-coverage/:shipperId/performance   # Cập nhật hiệu suất
```

---

## 📱 Frontend Components

### 1. **DeliveryStageTracker** - Khách hàng tracking

```jsx
import DeliveryStageTracker from '@/components/tracking/DeliveryStageTracker';

<DeliveryStageTracker orderDetailId={orderDetailId} showMap={true} />;
```

**Hiển thị:**

-   Timeline tất cả stages
-   Trạng thái từng stage
-   Vị trí hiện tại (realtime)
-   Lịch sử vị trí
-   Google Maps integration

### 2. **ShipperDeliveryManagement** - Shipper quản lý

```jsx
import ShipperDeliveryManagement from '@/components/shipper/ShipperDeliveryManagement';

<ShipperDeliveryManagement />;
```

**Hiển thị:**

-   Danh sách đơn chờ pickup (lọc theo province)
-   Địa chỉ pickup + delivery
-   Sản phẩm trong đơn
-   Nút "Nhận đơn hàng"

### 3. **API Client** - multiDeliveryApi

```javascript
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

// Ví dụ
const response = await multiDeliveryApi.getDeliveryStages(orderDetailId);
await multiDeliveryApi.acceptDeliveryStage(stageId);
await multiDeliveryApi.updateShipperLocation(stageId, {
    latitude,
    longitude,
    address,
});
```

---

## 🚀 Hướng dẫn sử dụng

### Cho Admin: Setup shipper coverage areas

```bash
# 1. Tạo coverage areas cho shippers
POST /api/shipper-coverage/create
{
  "shipperId": "shipper_id_tphcm",
  "shipperType": "local",
  "coverageAreas": [
    {
      "province": "TP. Hồ Chí Minh",
      "districts": [],  # Rỗng = toàn tỉnh
      "wards": []
    }
  ],
  "mainWarehouseId": "warehouse_id"
}

# 2. Tạo coverage cho regional carrier (TPHCM ↔ Hà Nội)
POST /api/shipper-coverage/create
{
  "shipperId": "shipper_id_regional",
  "shipperType": "regional",
  "coverageAreas": [
    {
      "province": "TP. Hồ Chí Minh",
      "districts": []
    },
    {
      "province": "Hà Nội",
      "districts": []
    }
  ]
}

# 3. Tạo coverage cho shipper Hà Nội
POST /api/shipper-coverage/create
{
  "shipperId": "shipper_id_hanoi",
  "shipperType": "local",
  "coverageAreas": [
    {
      "province": "Hà Nội",
      "districts": [],
      "wards": []
    }
  ],
  "mainWarehouseId": "warehouse_id"
}
```

### Cho Seller: Ship đơn hàng liên tỉnh

```javascript
// Khi click "Giao hàng"
await orderDetailApi.shipOrderDetail(orderDetailId, {
    trackingNumber: 'ABC123',
    shippingMethod: 'standard',
    carrierName: 'Giao Hàng Nhanh',
});

// Backend sẽ tự động:
// 1. Kiểm tra warehouse province vs customer province
// 2. Nếu khác tỉnh → tạo 3 delivery stages
// 3. Status OrderDetail → "in_delivery_stage"
```

### Cho Shipper: Quản lý đơn hàng

```javascript
// 1. Lấy danh sách đơn chờ pickup
const response = await multiDeliveryApi.getShipperOrders();
// Chỉ hiển thị orders trong khu vực của shipper

// 2. Nhận đơn hàng
await multiDeliveryApi.acceptDeliveryStage(stageId);

// 3. Lấy hàng từ warehouse
await multiDeliveryApi.pickupPackage(stageId, {
    latitude: getCurrentLat(),
    longitude: getCurrentLng(),
    address: getCurrentAddress(),
});

// 4. Bắt đầu vận chuyển
await multiDeliveryApi.updateShipperLocation(
    stageId,
    {
        latitude,
        longitude,
        address,
    },
    'in_transit_with_gps'
);

// 5. Update vị trí liên tục (mỗi 5-10 phút)
setInterval(async () => {
    const { lat, lng } = await getGPSLocation();
    await multiDeliveryApi.updateShipperLocation(stageId, {
        latitude: lat,
        longitude: lng,
        address: await getAddressFromCoordinates(lat, lng),
    });
}, 10000);

// 6. Hoàn thành giao hàng
await multiDeliveryApi.completeDeliveryStage(stageId, {
    latitude: getCurrentLat(),
    longitude: getCurrentLng(),
    address: getCurrentAddress(),
    notes: 'Giao thành công',
});
```

### Cho Khách hàng: Tracking order

```javascript
// Xem vị trí realtime
import DeliveryStageTracker from '@/components/tracking/DeliveryStageTracker';

<DeliveryStageTracker orderDetailId={orderDetailId} showMap={true} />;

// Component sẽ:
// - Lấy tất cả delivery stages
// - Hiển thị timeline
// - Polling location mỗi 30s
// - Cập nhật vị trí trên bản đồ
```

---

## 🧪 Test Scenarios

### Scenario 1: Vận chuyển nội tỉnh (TPHCM → TPHCM)

**Setup:**

-   Seller warehouse: TPHCM
-   Customer location: TPHCM

**Flow:**

```
1. POST /orders/seller/details/XXX/confirm
   → Status: pending → confirmed

2. POST /orders/seller/details/XXX/ship
   → Kiểm tra: province TPHCM = province TPHCM
   → Status: confirmed → shipping
   → Tạo 1 DeliveryStage (nội tỉnh)

3. PUT /multi-delivery/stages/:stageId/accept
   → Shipper TPHCM nhận
   → Status: pending → accepted

4. PUT /multi-delivery/stages/:stageId/pickup
   → Shipper lấy hàng
   → Status: accepted → picked_up

5. PUT /multi-delivery/stages/:stageId/location
   → Update vị trí realtime
   → Status: picked_up → in_transit

6. PUT /multi-delivery/stages/:stageId/complete
   → Giao xong
   → Status: in_transit → delivered
   → OrderDetail.status: shipping → delivered
   → MainOrder.status: confirmed → completed
```

### Scenario 2: Vận chuyển liên tỉnh (TPHCM → Hà Nội)

**Setup:**

-   Seller warehouse: TPHCM
-   Customer location: Hà Nội
-   Shippers: TPHCM, Regional, Hà Nội

**Flow:**

```
1. Seller ship → Tạo 3 DeliveryStages

2. Stage 1 (TPHCM Warehouse → TPHCM Hub):
   - PUT /stages/XXX/accept → Shipper TPHCM
   - PUT /stages/XXX/pickup → Lấy hàng
   - PUT /stages/XXX/location → Vận chuyển
   - PUT /stages/XXX/complete → Tới Transfer Hub TPHCM

3. Stage 2 (TPHCM Hub → Hà Nội Hub):
   - PUT /stages/YYY/accept → Regional Carrier
   - PUT /stages/YYY/location → Vận chuyển liên tỉnh
   - PUT /stages/YYY/complete → Tới Transfer Hub Hà Nội

4. Stage 3 (Hà Nội Hub → Customer):
   - PUT /stages/ZZZ/accept → Shipper Hà Nội
   - PUT /stages/ZZZ/pickup → Lấy từ hub
   - PUT /stages/ZZZ/location → Vận chuyển nội tỉnh
   - PUT /stages/ZZZ/complete → Giao khách
   - OrderDetail.status → delivered
```

### Scenario 3: Shipper chỉ thấy đơn trong khu vực

```
GET /multi-delivery/shipper/orders

Shipper TPHCM:
- Sẽ thấy Stage 1 (TPHCM)
- Sẽ thấy Stage 3 (Hà Nội)? KHÔNG

Shipper Hà Nội:
- Sẽ thấy Stage 3 (Hà Nội)
- Sẽ thấy Stage 1 (TPHCM)? KHÔNG

Regional Carrier:
- Sẽ thấy Stage 2 (TPHCM → Hà Nội)
```

---

## 🗺️ Google Maps Integration (TODO)

```javascript
// frontend/components/tracking/DeliveryStageTracker.jsx

import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';

// Hiển thị:
// 1. Marker warehouse
// 2. Marker customer
// 3. Marker shipper hiện tại (realtime)
// 4. Polyline route
// 5. Các transfer hubs nếu liên tỉnh
```

---

## ✅ Checklist Triển khai

-   [x] DeliveryStage model
-   [x] ShipperCoverageArea model
-   [x] Multi-stage delivery controller
-   [x] Shipper coverage controller
-   [x] Routes + API endpoints
-   [x] Frontend components
-   [x] API client
-   [ ] Google Maps integration
-   [ ] WebSocket untuk realtime location
-   [ ] SMS/Notification khi stage hoàn thành
-   [ ] Admin dashboard để quản lý shippers
-   [ ] Mobile app for shipper
-   [ ] Test & validation

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. Shipper coverage areas đã được setup?
2. Customer location province có hợp lệ?
3. API responses có errors?
4. Database connection OK?
5. Logs server (console)

**Happy Delivering! 🚚✨**
