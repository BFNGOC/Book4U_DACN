# 🚚 Fix: createDeliveryStages API Error

## ❌ Lỗi Ban Đầu

```
POST http://localhost:5000/api/multi-delivery/stages/create
Body: { orderDetailId: "..." }

Response:
{
  success: false,
  message: "Thiếu thông tin yêu cầu"
}
```

### Nguyên nhân

Backend expect `fromWarehouse` và `toCustomer` objects, nhưng frontend chỉ gửi `orderDetailId`.

---

## ✅ Giải pháp

Backend được update để **tự động lấy thông tin** từ OrderDetail:

```javascript
exports.createDeliveryStages = async (req, res) => {
    const { orderDetailId } = req.body;

    // ✅ Validate
    if (!orderDetailId) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu orderDetailId',
        });
    }

    // ✅ Lấy OrderDetail
    const orderDetail = await OrderDetail.findById(orderDetailId).populate(
        'mainOrderId sellerId'
    );

    // ✅ Lấy Seller + Warehouse
    const seller = await SellerProfile.findById(orderDetail.sellerId);
    const warehouse = seller.warehouses.find(
        (w) => w._id.toString() === orderDetail.warehouseId.toString()
    );

    // ✅ Xây dựng fromWarehouse
    const fromWarehouse = {
        warehouseId: warehouse._id,
        name: warehouse.name,
        address: `${warehouse.street}, ${warehouse.ward}, 
                  ${warehouse.district}, ${warehouse.province}`,
        province: warehouse.province,
        latitude: warehouse.location?.latitude || 0,
        longitude: warehouse.location?.longitude || 0,
    };

    // ✅ Xây dựng toCustomer
    const toCustomer = {
        address: orderDetail.shippingAddress?.address || '',
        province: orderDetail.shippingAddress?.province || '',
        latitude: 0,
        longitude: 0,
        customerName: orderDetail.shippingAddress?.fullName || '',
        customerPhone: orderDetail.shippingAddress?.phone || '',
    };

    // ✅ Auto-detect nội tỉnh vs liên tỉnh
    const isInterProvincial = fromWarehouse.province !== toCustomer.province;

    // ✅ Tạo stages (1 nếu nội tỉnh, 3 nếu liên tỉnh)
    // ... rest of logic
};
```

---

## 📡 API Usage (Frontend)

**Trước:**

```javascript
// ❌ Không hoạt động - backend expect thêm fields
const response = await createDeliveryStages({
    orderDetailId: '123...',
    // Missing: fromWarehouse, toCustomer
});
```

**Sau:**

```javascript
// ✅ Hoạt động - backend tự handle
const response = await createDeliveryStages({
    orderDetailId: deliveryInfo.orderDetailId,
});

if (response.success) {
    console.log(`Tạo ${response.data.stages.length} stage(s) thành công`);
    // response.data = {
    //   stages: [stage1, stage2, ...],
    //   totalStages: 1 or 3,
    //   isInterProvincial: true/false,
    //   fromProvince: "TPHCM",
    //   toProvince: "Hà Nội"
    // }
}
```

---

## 🔄 Data Flow

```
SellerOrdersManagement.jsx
  ↓
User click "Giao hàng"
  ↓
handleStartShipping(orderDetail)
  - Extract province từ address
  - Set deliveryInfo state
  - Show modal
  ↓
User click "Xác nhận giao"
  ↓
handleConfirmDelivery()
  - Call: createDeliveryStages({ orderDetailId })
  ↓
multiDeliveryApi.createDeliveryStages()
  - POST /api/multi-delivery/stages/create
  - Body: { orderDetailId }
  ↓
multiStageDeliveryController.createDeliveryStages()
  - ✅ Fetch OrderDetail
  - ✅ Fetch Seller + Warehouse
  - ✅ Extract toCustomer từ shippingAddress
  - ✅ Auto-detect nội tỉnh vs liên tỉnh
  - ✅ Tạo 1 hoặc 3 stages
  - ✅ Save và return response
  ↓
Frontend toast: "Tạo X stage(s) thành công"
Reload order list
```

---

## 📝 Request/Response

### Request

```json
POST /api/multi-delivery/stages/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderDetailId": "693ed382a3d1e8b406613a6e"
}
```

### Response (Success - Nội tỉnh)

```json
{
    "success": true,
    "message": "Đã tạo giai đoạn vận chuyển",
    "data": {
        "stages": [
            {
                "_id": "...",
                "stageNumber": 1,
                "totalStages": 1,
                "status": "pending",
                "fromLocation": {
                    "locationType": "warehouse",
                    "warehouseName": "Kho Chính TPHCM",
                    "province": "TPHCM",
                    "address": "..."
                },
                "toLocation": {
                    "locationType": "customer",
                    "province": "TPHCM",
                    "address": "66E Hoàng Diệu 2, ..., TPHCM"
                }
            }
        ],
        "totalStages": 1,
        "isInterProvincial": false,
        "fromProvince": "TPHCM",
        "toProvince": "TPHCM"
    }
}
```

### Response (Success - Liên tỉnh)

```json
{
    "success": true,
    "message": "Đã tạo giai đoạn vận chuyển",
    "data": {
        "stages": [
            {
                "_id": "...",
                "stageNumber": 1,
                "totalStages": 3,
                "fromLocation": {
                    "locationType": "warehouse",
                    "province": "TPHCM"
                },
                "toLocation": {
                    "locationType": "transfer_hub",
                    "province": "TPHCM"
                }
            },
            {
                "_id": "...",
                "stageNumber": 2,
                "totalStages": 3,
                "fromLocation": {
                    "locationType": "transfer_hub",
                    "province": "TPHCM"
                },
                "toLocation": {
                    "locationType": "transfer_hub",
                    "province": "Hà Nội"
                }
            },
            {
                "_id": "...",
                "stageNumber": 3,
                "totalStages": 3,
                "fromLocation": {
                    "locationType": "transfer_hub",
                    "province": "Hà Nội"
                },
                "toLocation": {
                    "locationType": "customer",
                    "province": "Hà Nội"
                }
            }
        ],
        "totalStages": 3,
        "isInterProvincial": true,
        "fromProvince": "TPHCM",
        "toProvince": "Hà Nội"
    }
}
```

### Response (Error)

```json
{
    "success": false,
    "message": "OrderDetail không tồn tại"
}
```

---

## 🧪 Test với Postman

### Setup

```
POST http://localhost:5000/api/multi-delivery/stages/create
Headers:
  Authorization: Bearer <your_token>
  Content-Type: application/json

Body (raw JSON):
{
  "orderDetailId": "693ed382a3d1e8b406613a6e"
}
```

### Expected Flow

1. ✅ OrderDetail được lấy
2. ✅ Seller profile được fetch
3. ✅ Warehouse được tìm từ seller
4. ✅ Customer province được extract từ address
5. ✅ Warehouse province vs customer province được so sánh
6. ✅ 1 hoặc 3 stages được tạo
7. ✅ OrderDetail.deliveryStages được update
8. ✅ Response trả về stages array

---

## 🔧 Changes Made

### Backend: multiStageDeliveryController.js

**Import:**

-   ✅ Thêm `SellerProfile` để fetch seller + warehouse

**createDeliveryStages function:**

-   ✅ Remove: expect `fromWarehouse`, `toCustomer` từ request
-   ✅ Add: tự động fetch `OrderDetail`
-   ✅ Add: tự động fetch `Seller` + `Warehouse`
-   ✅ Add: tự động fetch `shippingAddress.province`
-   ✅ Add: tự động build `fromWarehouse` object
-   ✅ Add: tự động build `toCustomer` object
-   ✅ Keep: logic tạo stages (1 hay 3)

---

## ✅ Ready to Test

```bash
# 1. Make sure server is running
cd Server
npm start

# 2. Open Postman / curl
# 3. Create order (pending → confirmed)
# 4. Get orderDetailId
# 5. POST /api/multi-delivery/stages/create
#    Body: { "orderDetailId": "..." }
# 6. Should return success with stages array
```

---

**Status:** ✅ Fixed and Ready
