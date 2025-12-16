# 🚀 QUICK START - HỆ THỐNG VẬN CHUYỂN LIÊN TỈNH

## ⚡ 5 bước setup nhanh

### 1️⃣ Cài đặt Models

✅ Đã tạo:

-   `Server/src/models/deliveryStageModel.js`
-   `Server/src/models/shipperCoverageAreaModel.js`
-   Cập nhật `Server/src/models/orderDetailModel.js`

### 2️⃣ Cài đặt Controllers

✅ Đã tạo:

-   `Server/src/controllers/multiStageDeliveryController.js`
-   `Server/src/controllers/shipperCoverageController.js`
-   Cập nhật `Server/src/controllers/orderDetailSellerController.js`

### 3️⃣ Cài đặt Routes

✅ Đã tạo:

-   `Server/src/routes/multiStageDeliveryRoutes.js`
-   `Server/src/routes/shipperCoverageRoutes.js`
-   Cập nhật `Server/src/routes/index.js`

### 4️⃣ Frontend Components

✅ Đã tạo:

-   `Client/Book4U/src/components/tracking/DeliveryStageTracker.jsx`
-   `Client/Book4U/src/components/shipper/ShipperDeliveryManagement.jsx`
-   `Client/Book4U/src/services/api/multiDeliveryApi.js`

### 5️⃣ Documentation

✅ Đã tạo:

-   `MULTI_STAGE_DELIVERY_GUIDE.md` (hướng dẫn chi tiết)
-   `QUICK_START_MULTI_DELIVERY.md` (file này)

---

## 📝 Setup Admin - Tạo Shipper Coverage Areas

### Bước 1: Tạo shipper TPHCM

```bash
curl -X POST http://localhost:5000/api/shipper-coverage/create \
  -H "Content-Type: application/json" \
  -d '{
    "shipperId": "SHIPPER_TPHCM_ID",
    "shipperType": "local",
    "coverageAreas": [
      {
        "province": "TP. Hồ Chí Minh",
        "districts": [],
        "wards": []
      }
    ],
    "mainWarehouseId": "WAREHOUSE_TPHCM_ID",
    "mainWarehouseName": "Warehouse TPHCM"
  }'
```

### Bước 2: Tạo Regional Carrier (TPHCM ↔ HN)

```bash
curl -X POST http://localhost:5000/api/shipper-coverage/create \
  -H "Content-Type: application/json" \
  -d '{
    "shipperId": "SHIPPER_REGIONAL_ID",
    "shipperType": "regional",
    "coverageAreas": [
      {
        "province": "TP. Hồ Chí Minh",
        "districts": [],
        "wards": []
      },
      {
        "province": "Hà Nội",
        "districts": [],
        "wards": []
      }
    ]
  }'
```

### Bước 3: Tạo shipper Hà Nội

```bash
curl -X POST http://localhost:5000/api/shipper-coverage/create \
  -H "Content-Type: application/json" \
  -d '{
    "shipperId": "SHIPPER_HANOI_ID",
    "shipperType": "local",
    "coverageAreas": [
      {
        "province": "Hà Nội",
        "districts": [],
        "wards": []
      }
    ],
    "mainWarehouseId": "WAREHOUSE_HANOI_ID",
    "mainWarehouseName": "Warehouse Hà Nội"
  }'
```

---

## 🧪 Test Flow - TPHCM → Hà Nội

### Giả sử:

-   Seller TPHCM có warehouse ở TP.HCM
-   Customer ở Hà Nội
-   Order detail ID: `ORDER_DETAIL_123`

### Step 1: Seller confirm order

```bash
curl -X POST http://localhost:5000/api/orders/seller/details/ORDER_DETAIL_123/confirm \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerLocation": {
      "address": "123 Đường Tây Sơn, Hà Nội",
      "latitude": 21.0070,
      "longitude": 105.8333
    }
  }'

# Response: status = "confirmed"
```

### Step 2: Seller ship order (tự động tạo stages)

```bash
curl -X POST http://localhost:5000/api/orders/seller/details/ORDER_DETAIL_123/ship \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRACK123",
    "shippingMethod": "standard",
    "carrierName": "Giao Hàng Nhanh"
  }'

# Response: status = "in_delivery_stage"
# Backend tự động tạo 3 DeliveryStages
```

### Step 3: Kiểm tra stages được tạo

```bash
curl -X GET http://localhost:5000/api/multi-delivery/stages/ORDER_DETAIL_123

# Response: 3 stages
# [
#   { stageNumber: 1, status: "pending", ... },
#   { stageNumber: 2, status: "pending", ... },
#   { stageNumber: 3, status: "pending", ... }
# ]
```

### Step 4: Shipper TPHCM nhận stage 1

```bash
curl -X GET http://localhost:5000/api/multi-delivery/shipper/orders \
  -H "Authorization: Bearer SHIPPER_TPHCM_TOKEN"

# Response: Danh sách stages trong khu vực TPHCM
# [
#   { _id: "STAGE_1_ID", stageNumber: 1, ... }
# ]
```

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_1_ID/accept \
  -H "Authorization: Bearer SHIPPER_TPHCM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response: Stage 1 status = "accepted"
```

### Step 5: Shipper TPHCM lấy hàng

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_1_ID/pickup \
  -H "Authorization: Bearer SHIPPER_TPHCM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.7769,
    "longitude": 106.7009,
    "address": "Warehouse TPHCM"
  }'

# Response: Stage 1 status = "picked_up"
```

### Step 6: Tracking (khách hàng xem realtime)

```bash
curl -X GET http://localhost:5000/api/multi-delivery/track/ORDER_DETAIL_123

# Response:
# {
#   "currentStageIndex": 0,
#   "totalStages": 3,
#   "currentStage": {
#     "stageNumber": 1,
#     "status": "picked_up",
#     "currentLocation": {
#       "latitude": 10.7769,
#       "longitude": 106.7009,
#       "address": "Warehouse TPHCM"
#     },
#     "locationHistory": [...]
#   },
#   "stages": [...]
# }
```

### Step 7: Shipper TPHCM vận chuyển (update location realtime)

```bash
# Mỗi 5-10 phút, shipper gửi location
curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_1_ID/location \
  -H "Authorization: Bearer SHIPPER_TPHCM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.8000,
    "longitude": 106.7200,
    "address": "Đang vận chuyển - Bình Thạnh",
    "status": "in_transit_with_gps"
  }'

# Frontend polling mỗi 30s sẽ cập nhật vị trí
```

### Step 8: Shipper TPHCM hoàn thành stage 1

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_1_ID/complete \
  -H "Authorization: Bearer SHIPPER_TPHCM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.8261,
    "longitude": 106.6848,
    "address": "Transfer Hub TPHCM",
    "notes": "Đã tới transfer hub"
  }'

# Response: Stage 1 status = "delivered"
# Stage 2 tự động chuyển thành "pending" (chờ regional carrier)
```

### Step 9: Regional Carrier nhận stage 2

```bash
curl -X GET http://localhost:5000/api/multi-delivery/shipper/orders \
  -H "Authorization: Bearer SHIPPER_REGIONAL_TOKEN"

# Response: Stage 2 (TPHCM Hub → Hà Nội Hub)

curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_2_ID/accept \
  -H "Authorization: Bearer SHIPPER_REGIONAL_TOKEN"
```

### Step 10: Shipper Hà Nội nhận stage 3

```bash
# Sau khi Regional Carrier hoàn thành stage 2

curl -X GET http://localhost:5000/api/multi-delivery/shipper/orders \
  -H "Authorization: Bearer SHIPPER_HANOI_TOKEN"

# Response: Stage 3 (Hub Hà Nội → Customer)

curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_3_ID/accept \
  -H "Authorization: Bearer SHIPPER_HANOI_TOKEN"
```

### Step 11: Shipper Hà Nội giao hàng

```bash
curl -X PUT http://localhost:5000/api/multi-delivery/stages/STAGE_3_ID/complete \
  -H "Authorization: Bearer SHIPPER_HANOI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 21.0070,
    "longitude": 105.8333,
    "address": "123 Đường Tây Sơn, Hà Nội"
  }'

# Response: Stage 3 status = "delivered"
# OrderDetail.status → "delivered"
# MainOrder.status → "completed"
```

---

## 🎨 Frontend Integration

### Customer Tracking Page

```jsx
import DeliveryStageTracker from '@/components/tracking/DeliveryStageTracker';

export function OrderTrackingPage({ orderDetailId }) {
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Tracking đơn hàng</h1>
            <DeliveryStageTracker
                orderDetailId={orderDetailId}
                showMap={true}
            />
        </div>
    );
}
```

### Shipper Dashboard

```jsx
import ShipperDeliveryManagement from '@/components/shipper/ShipperDeliveryManagement';

export function ShipperDashboard() {
    return (
        <div>
            <ShipperDeliveryManagement />
        </div>
    );
}
```

---

## ✅ Checklist Verify

-   [ ] Models compiled thành công (không lỗi MongoDB)
-   [ ] Routes đã được register trong `routes/index.js`
-   [ ] Shipper coverage areas đã được tạo cho 3 shippers
-   [ ] API endpoints responding đúng
-   [ ] Seller có thể ship order
-   [ ] DeliveryStages được tạo khi ship order liên tỉnh
-   [ ] Shipper chỉ thấy orders trong khu vực mình
-   [ ] Frontend components loading OK
-   [ ] Realtime tracking hoạt động
-   [ ] Google Maps placeholder visible

---

## 🐛 Troubleshooting

### Problem: DeliveryStage model not found

**Solution:** Restart server sau khi tạo file model

```bash
cd Server
npm restart
```

### Problem: Shipper không thấy orders

**Solution:** Kiểm tra:

1. ShipperCoverageArea có province = customer province?
2. Status = "active"?
3. Shipper type = "local" hoặc "regional"?

```bash
# Check coverage
curl http://localhost:5000/api/shipper-coverage/SHIPPER_ID
```

### Problem: Multi-stage không được tạo

**Solution:** Kiểm tra:

1. Warehouse province ≠ customer province?
2. Geocoding thành công?
3. Console có errors?

```bash
# Check order detail
curl http://localhost:5000/api/orders/seller/details/ORDER_DETAIL_ID
```

---

## 📊 API Summary

| Endpoint                              | Method | Purpose             |
| ------------------------------------- | ------ | ------------------- |
| `/multi-delivery/stages/create`       | POST   | Tạo delivery stages |
| `/multi-delivery/stages/:id`          | GET    | Lấy stages          |
| `/multi-delivery/stages/:id/accept`   | PUT    | Shipper chấp nhận   |
| `/multi-delivery/stages/:id/pickup`   | PUT    | Lấy hàng            |
| `/multi-delivery/stages/:id/location` | PUT    | Update vị trí       |
| `/multi-delivery/stages/:id/complete` | PUT    | Hoàn thành          |
| `/multi-delivery/shipper/orders`      | GET    | Danh sách shipper   |
| `/multi-delivery/track/:id`           | GET    | Tracking khách      |
| `/shipper-coverage/create`            | POST   | Tạo coverage        |
| `/shipper-coverage/:id`               | GET    | Lấy coverage        |
| `/shipper-coverage/province/:name`    | GET    | Shippers tỉnh       |

---

**Ready to test! 🎉**
