# Thiết Kế Chức Năng Tạo/Cập Nhật Kho Hàng

## 📋 Tổng Quan

Ứng dụng hiện có hai nơi sử dụng `WarehouseModal`:

1. **SellerStep2** (Đăng ký bán hàng Step 2): Tạo kho hàng LOCAL, không gọi API
2. **SellerInventoryManagement** (Quản lý kho): Tạo/Cập nhật kho, gọi API

## 🏗️ Kiến Trúc Thiết Kế

### WarehouseModal Component

**Props:**

```jsx
{
    onClose, // Function: Đóng modal
        onSave, // Function: Xử lý lưu (nhận warehouseData, skipApiCall)
        defaultData, // Object: Dữ liệu ban đầu (khi edit)
        skipApiCall; // Boolean: true = local mode, false = API mode
}
```

**Behavior:**

-   Validate form data
-   Gọi API province/district/ward để lấy tên địa phương
-   Truyền `warehouseData` (có đầy đủ tên và code địa lý) + `skipApiCall` flag về parent

---

## 📍 Flow 1: SellerStep2 (Local Mode)

### Khi Tạo Kho

```
User bấm "+ Tạo kho hàng mới"
    ↓
SellerStep2 mở WarehouseModal
    - defaultData = null
    - skipApiCall = true
    ↓
User điền thông tin, bấm "Lưu"
    ↓
WarehouseModal validate & gọi onSave(warehouseData, true)
    ↓
SellerStep2 xử lý:
  - Thêm warehouseData vào state warehouses
  - Không gọi API
  - setState & close modal
    ↓
Dữ liệu kho lưu trong state cho đến khi submit form (Step 3)
```

### Khi Chỉnh Sửa Kho

```
User bấm icon Edit trên kho
    ↓
SellerStep2 mở WarehouseModal
    - defaultData = selectedWarehouse (dữ liệu cũ)
    - skipApiCall = true
    - editMode = true
    ↓
User chỉnh sửa, bấm "Lưu"
    ↓
WarehouseModal validate & gọi onSave(warehouseData, true)
    ↓
SellerStep2 xử lý:
  - Cập nhật warehouseData vào danh sách warehouses (thay thế cái cũ)
  - Không gọi API
  - setState & close modal
    ↓
Dữ liệu kho được cập nhật trong state
```

---

## 📍 Flow 2: SellerInventoryManagement (API Mode)

### Khi Tạo Kho

```
User bấm "Thêm Kho"
    ↓
SellerInventoryManagement mở WarehouseModal
    - defaultData = null
    - skipApiCall = false
    - editingWarehouse = null
    ↓
User điền thông tin, bấm "Lưu"
    ↓
WarehouseModal validate & gọi onSave(warehouseData, false)
    ↓
SellerInventoryManagement xử lý:
  - handleWarehouseModalSave(warehouseData, false)
  - skipApiCall = false → gọi API
  - editingWarehouse = null → gọi handleCreateWarehouse()
  - API: POST /api/warehouse/warehouses
    ↓
  - Toast thành công
  - Gọi fetchWarehouseData() để refresh danh sách
  - Close modal
    ↓
Danh sách kho được cập nhật từ server
```

### Khi Chỉnh Sửa Kho

```
User bấm "✏️ Sửa Kho"
    ↓
SellerInventoryManagement mở WarehouseModal
    - defaultData = editingWarehouse (dữ liệu cũ từ server)
    - skipApiCall = false
    - editingWarehouse = { _id, ...warehouse data }
    ↓
WarehouseModal tự động populate các trường
    ↓
User chỉnh sửa, bấm "Lưu"
    ↓
WarehouseModal validate & gọi onSave(warehouseData, false)
    ↓
SellerInventoryManagement xử lý:
  - handleWarehouseModalSave(warehouseData, false)
  - skipApiCall = false → gọi API
  - editingWarehouse ≠ null → gọi handleUpdateWarehouse()
  - API: PUT /api/warehouse/warehouses/:id
    ↓
  - Toast thành công
  - Gọi fetchWarehouseData() để refresh danh sách
  - Close modal
    ↓
Dữ liệu kho được cập nhật từ server
```

---

## 🔄 Data Flow

### WarehouseModal Output

```javascript
warehouseData = {
    name: 'Kho A',
    managerName: 'Nguyễn A',
    managerPhone: '0123456789',
    province: 'Hà Nội', // Tên (từ API province)
    district: 'Hoàn Kiếm', // Tên (từ API district)
    ward: 'Phủ Lỵ', // Tên (từ API ward)
    detail: '123 Đường ABC', // Địa chỉ chi tiết
    provinceCode: '01', // Code (từ API province)
    districtCode: '001', // Code (từ API district)
    wardCode: '00001', // Code (từ API ward)
};
```

### SellerStep2 - Lưu trong State

```javascript
warehouses = [
    {
        name: 'Kho A',
        managerName: 'Nguyễn A',
        managerPhone: '0123456789',
        province: 'Hà Nội',
        district: 'Hoàn Kiếm',
        ward: 'Phủ Lỵ',
        detail: '123 Đường ABC',
        provinceCode: '01',
        districtCode: '001',
        wardCode: '00001',
    },
];
```

Khi submit step 2 → gửi warehouses array này lên API Step 3 để tạo toàn bộ

### SellerInventoryManagement - Gọi API

```javascript
// Tạo mới
POST /api/warehouse/warehouses
{
  name: "Kho A",
  managerName: "Nguyễn A",
  managerPhone: "0123456789",
  province: "Hà Nội",
  district: "Hoàn Kiếm",
  ward: "Phủ Lỵ",
  detail: "123 Đường ABC",
  // provinceCode, districtCode, wardCode là optional (server có thể xử lý)
}

// Cập nhật
PUT /api/warehouse/warehouses/:warehouseId
{ ...cùng structure như create }

// Response từ server sẽ lưu vào state
setWarehouses(res.data)
```

---

## 📝 Các File Được Sửa

### 1. `WarehouseModal.jsx`

-   Thêm prop `skipApiCall = false`
-   Truyền `skipApiCall` trong hàm `onSave`
-   Comment giải thích 2 mode

### 2. `SellerStep2.jsx`

-   Thêm `skipApiCall={true}` khi render WarehouseModal
-   Giữ nguyên logic xử lý local

### 3. `SellerInventoryManagement.jsx`

-   Thêm `skipApiCall={false}` khi render WarehouseModal
-   Cập nhật `handleWarehouseModalSave` để nhận tham số `skipApiCall`
-   Chỉ gọi API khi `skipApiCall = false`

---

## ✅ Checklist Verify

-   [x] WarehouseModal nhận props `skipApiCall`
-   [x] WarehouseModal truyền `skipApiCall` trong callback `onSave`
-   [x] SellerStep2 pass `skipApiCall={true}`
-   [x] SellerInventoryManagement pass `skipApiCall={false}`
-   [x] `handleWarehouseModalSave` xử lý tham số `skipApiCall`
-   [x] Khi `skipApiCall=true`: không gọi API
-   [x] Khi `skipApiCall=false`: gọi `handleCreateWarehouse` hoặc `handleUpdateWarehouse`
-   [ ] Test tạo kho ở SellerStep2 (local)
-   [ ] Test chỉnh sửa kho ở SellerStep2 (local)
-   [ ] Test tạo kho ở SellerInventoryManagement (API)
-   [ ] Test chỉnh sửa kho ở SellerInventoryManagement (API)

---

## 🎯 Benefit của Design Này

1. **Reusable**: Một component `WarehouseModal` dùng cho 2 flow khác nhau
2. **Clear**: Props `skipApiCall` làm rõ ý định sử dụng
3. **Flexible**: Dễ extend thêm mode khác nếu cần
4. **Maintainable**: Logic tập trung, dễ debug
5. **Type-safe**: Có thể thêm TypeScript types nếu cần
