# 🔧 FIX: Cannot PUT /api/warehouse/warehouses/:id

## 🔍 Nguyên Nhân Lỗi

### Vấn đề 1: Không có Route PUT

**Status**: `Cannot PUT /api/warehouse/warehouses/6921b0ee1510c477adb46a17`

Routes chỉ có:

-   ✅ POST `/warehouses` - Tạo kho
-   ✅ GET `/warehouses` - Lấy danh sách

Nhưng **không có**:

-   ❌ PUT `/warehouses/:id` - Cập nhật kho
-   ❌ DELETE `/warehouses/:id` - Xóa kho

**Giải pháp**: Thêm route PUT và controller `updateWarehouse`

### Vấn đề 2: Dữ Liệu Gửi Lên Chứa Fields Lạ

Client gửi:

```json
{
    "street": "48", // ❌ Không dùng
    "country": "Vietnam", // ❌ Không dùng (hằng số)
    "isDefault": false, // ❌ Không dùng (managed by server)
    "_id": "6921b0ee1510c477adb46a17", // ❌ Không nên gửi
    "provinceName": "Tỉnh Thái Nguyên", // ❌ Dùng để hiển thị, không cần update
    "districtName": "Thành phố Phổ Yên", // ❌ Dùng để hiển thị, không cần update
    "wardName": "Phường Thuận Thành", // ❌ Dùng để hiển thị, không cần update
    "provinceCode": 19, // ❌ Không cần gửi (có province name)
    "districtCode": 172, // ❌ Không cần gửi (có district name)
    "wardCode": 5905, // ❌ Không cần gửi (có ward name)

    // ✅ Chỉ cần gửi này
    "name": "Kho hàng 1",
    "detail": "45",
    "managerName": "gegeg",
    "managerPhone": "0454564564",
    "province": "Tỉnh Thái Nguyên",
    "district": "Thành phố Phổ Yên",
    "ward": "Phường Thuận Thành"
}
```

---

## ✅ Các Thay Đổi Đã Thực Hiện

### 1️⃣ Server - Thêm Controller `updateWarehouse`

**File**: `Server/src/controllers/warehouseController.js`

```javascript
// 2️⃣B CẬP NHẬT KHO HÀNG
exports.updateWarehouse = async (req, res) => {
    try {
        const { id: warehouseId } = req.params;
        const sellerId = req.user?.userId;
        const {
            name,
            street,
            detail,
            ward,
            district,
            province,
            managerName,
            managerPhone,
        } = req.body;

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn phải đăng nhập để cập nhật kho',
            });
        }

        // Validate input
        if (!name || !ward || !district || !province) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin kho',
            });
        }

        // Tìm profile
        const profile = await SellerProfile.findOne({ userId: sellerId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile không tồn tại',
            });
        }

        // Tìm warehouse trong array
        const warehouse = profile.warehouses.id(warehouseId);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Kho không tồn tại',
            });
        }

        // Cập nhật
        warehouse.name = name;
        warehouse.street = street || warehouse.street;
        warehouse.detail = detail || warehouse.detail;
        warehouse.ward = ward;
        warehouse.district = district;
        warehouse.province = province;
        warehouse.managerName = managerName || warehouse.managerName;
        warehouse.managerPhone = managerPhone || warehouse.managerPhone;

        // Lưu
        await profile.save();

        res.json({
            success: true,
            message: 'Cập nhật kho thành công',
            data: warehouse,
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
```

### 2️⃣ Server - Thêm Route PUT

**File**: `Server/src/routes/warehouseRoutes.js`

```javascript
// 1️⃣B Cập nhật kho
router.put(
    '/warehouses/:id',
    authMiddleware,
    roleMiddleware('seller'),
    warehouseController.updateWarehouse
);
```

### 3️⃣ Client - Clean Dữ Liệu Gửi Lên

**File**: `Client/Book4U/src/components/modal/WarehouseModal.jsx`

**Trước**: Gửi `...form` (tất cả fields, bao gồm cả dữ liệu cũ)

```javascript
const warehouseData = {
    ...form, // ❌ Gửi tất cả, bao gồm fields lạ
    province: provinceObj?.name || '',
    district: districtObj?.name || '',
    ward: wardObj?.name || '',
    provinceCode: provinceObj?.code || '',
    districtCode: districtObj?.code || '',
    wardCode: wardObj?.code || '',
};
```

**Sau**: Gửi chỉ fields cần thiết

```javascript
const warehouseData = {
    name: form.name,
    managerName: form.managerName,
    managerPhone: form.managerPhone,
    detail: form.detail,
    ward: wardObj?.name || '',
    district: districtObj?.name || '',
    province: provinceObj?.name || '',
};

// Chỉ khi skipApiCall=true (SellerStep2), thêm code & name fields
if (skipApiCall) {
    warehouseData.provinceCode = provinceObj?.code || '';
    warehouseData.districtCode = districtObj?.code || '';
    warehouseData.wardCode = wardObj?.code || '';
    warehouseData.provinceName = provinceObj?.name || '';
    warehouseData.districtName = districtObj?.name || '';
    warehouseData.wardName = wardObj?.name || '';
}
```

### 4️⃣ Client - Clean defaultData Khi Edit

**Trước**: Dùng `defaultData` directly (có thể chứa fields cũ)

```javascript
const [form, setForm] = useState(defaultData || { ... });
```

**Sau**: Clean defaultData, chỉ lấy fields cần thiết

```javascript
const [form, setForm] = useState(
    defaultData
        ? {
              name: defaultData.name || '',
              managerName: defaultData.managerName || '',
              managerPhone: defaultData.managerPhone || '',
              province: defaultData.province || '',
              district: defaultData.district || '',
              ward: defaultData.ward || '',
              detail: defaultData.detail || '',
          }
        : {
              name: '',
              managerName: '',
              managerPhone: '',
              province: '',
              district: '',
              ward: '',
              detail: '',
          }
);
```

---

## 📊 So Sánh Before/After

| Aspeck                   | Before            | After            |
| ------------------------ | ----------------- | ---------------- |
| **Route PUT**            | ❌ Không có       | ✅ Có            |
| **Controller Update**    | ❌ Không có       | ✅ Có            |
| **Data Sent**            | ❌ Tất cả fields  | ✅ Chỉ cần thiết |
| **defaultData Handling** | ⚠️ Dùng trực tiếp | ✅ Clean fields  |
| **Create**               | ✅ Hoạt động      | ✅ Hoạt động     |
| **Update**               | ❌ Lỗi 404        | ✅ Hoạt động     |

---

## 🧪 Testing

### Test Create

```
1. Mở SellerInventoryManagement
2. Click "Thêm Kho"
3. Điền thông tin → "Lưu"
4. Verify: Kho mới xuất hiện trong danh sách
5. Network tab: POST /api/warehouse/warehouses → 201
```

### Test Update

```
1. Mở SellerInventoryManagement
2. Click "✏️ Sửa Kho"
3. Modify fields → "Lưu"
4. Verify: Dữ liệu kho được cập nhật
5. Network tab: PUT /api/warehouse/warehouses/:id → 200
```

### Test SellerStep2 (Local)

```
1. Mở Seller Registration Step 2
2. Click "+ Tạo kho hàng mới"
3. Điền thông tin → "Lưu"
4. Verify: Kho lưu trong component state (không call API)
5. Network tab: Không có request gửi đi
```

---

## 🎯 Key Points

✅ **Server**:

-   Thêm `updateWarehouse` controller
-   Thêm PUT route
-   Validate đầu vào
-   Tìm warehouse trong array warehouses

✅ **Client**:

-   Clean dữ liệu gửi lên (chỉ fields cần thiết)
-   Clean defaultData khi init form
-   Không gửi `_id`, `country`, `isDefault`, `*Name` fields
-   Giữ `provinceCode`, `districtCode`, `wardCode` cho SellerStep2 local

✅ **Data Flow**:

-   Create: POST → Lưu lên DB
-   Update: PUT → Cập nhật trên DB
-   SellerStep2: No API → Lưu local

---

## 📝 Commit Message

```
fix: Add warehouse update endpoint and clean request data

- Add updateWarehouse controller in warehouseController.js
- Add PUT /warehouses/:id route
- Clean warehouse data sent from client (remove unnecessary fields)
- Clean defaultData when editing to prevent field pollution
- Validate warehouse updates on server
- Support both create and update operations
```

---

## ✅ Status

-   [x] Thêm Route PUT
-   [x] Thêm Controller updateWarehouse
-   [x] Clean dữ liệu gửi từ client
-   [x] Clean defaultData khi init form
-   [x] Validation server
-   [x] Test case
-   [x] No compile errors
