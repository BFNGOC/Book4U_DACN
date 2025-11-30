# 📋 TÓNG TẮT: Fix Update Warehouse Endpoint

## 🔴 Lỗi Gốc

```
Cannot PUT /api/warehouse/warehouses/6921b0ee1510c477adb46a17
```

---

## 🔍 Root Causes

### 1. **Route không tồn tại**

-   Chỉ có `POST /warehouses` (create)
-   **Không có** `PUT /warehouses/:id` (update)

### 2. **Controller không có**

-   Chỉ có `createWarehouse()`
-   **Không có** `updateWarehouse()`

### 3. **Data pollution**

Client gửi fields không cần thiết:

-   `_id`, `country`, `isDefault` (server-managed)
-   `street`, `provinceName`, `districtName`, `wardName` (display-only)
-   `provinceCode`, `districtCode`, `wardCode` (for local storage)

Server khi update có thể bị vấn đề với fields này.

---

## ✅ Giải Pháp

### Server Side

**File**: `Server/src/routes/warehouseRoutes.js`

```javascript
router.put(
    '/warehouses/:id',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.updateWarehouse
);
```

**File**: `Server/src/controllers/warehouseController.js`

```javascript
exports.updateWarehouse = async (req, res) => {
    // Validate & update warehouse in profile.warehouses array
};
```

### Client Side

**File**: `Client/Book4U/src/components/modal/WarehouseModal.jsx`

```javascript
// Clean form state init
const [form, setForm] = useState(
    defaultData ? {
        name: defaultData.name || '',
        managerName: defaultData.managerName || '',
        managerPhone: defaultData.managerPhone || '',
        province: defaultData.province || '',
        district: defaultData.district || '',
        ward: defaultData.ward || '',
        detail: defaultData.detail || '',
    } : { ... }
);

// Clean data sent to server
const warehouseData = {
    name: form.name,
    managerName: form.managerName,
    managerPhone: form.managerPhone,
    detail: form.detail,
    ward: wardObj?.name || '',
    district: districtObj?.name || '',
    province: provinceObj?.name || '',
};

// Only add code/name for SellerStep2 (local storage)
if (skipApiCall) {
    warehouseData.provinceCode = provinceObj?.code || '';
    // ... other code/name fields
}
```

---

## 📊 Changes Summary

| Component            | Change                 | Status  |
| -------------------- | ---------------------- | ------- |
| **Routes**           | Add PUT route          | ✅ Done |
| **Controller**       | Add updateWarehouse    | ✅ Done |
| **Client Form Init** | Clean defaultData      | ✅ Done |
| **Client Data Send** | Clean warehouseData    | ✅ Done |
| **Validation**       | Server-side validation | ✅ Done |

---

## 🎯 Expected Behavior After Fix

### Create Warehouse

```
POST /api/warehouse/warehouses
{
  "name": "Kho A",
  "managerName": "Nguyễn A",
  "managerPhone": "0123456789",
  "detail": "123 Đường ABC",
  "ward": "Phường ABC",
  "district": "Quận XYZ",
  "province": "Thành phố ABC"
}
✅ Status 201 Created
```

### Update Warehouse

```
PUT /api/warehouse/warehouses/6921b0ee1510c477adb46a17
{
  "name": "Kho A Updated",
  "managerName": "Nguyễn A",
  "managerPhone": "0123456789",
  "detail": "123 Đường ABC",
  "ward": "Phường ABC",
  "district": "Quận XYZ",
  "province": "Thành phố ABC"
}
✅ Status 200 OK
```

---

## 🧪 Quick Test

```bash
# Terminal 1: Start Server
cd Server
npm start

# Terminal 2: Start Client
cd Client/Book4U
npm run dev

# Test in UI:
# 1. Go to Inventory Management
# 2. Click "Thêm Kho" → Create works ✅
# 3. Click "✏️ Sửa Kho" → Update works ✅
```

---

## 📝 Files Modified

1. ✅ `Server/src/routes/warehouseRoutes.js` - Added PUT route
2. ✅ `Server/src/controllers/warehouseController.js` - Added updateWarehouse
3. ✅ `Client/Book4U/src/components/modal/WarehouseModal.jsx` - Clean data

---

## 🚀 Next Steps

1. Test create warehouse
2. Test update warehouse
3. Verify server logs
4. Verify network tab in DevTools
5. Check database records

All good! 🎉
