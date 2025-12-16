# 🏘️ Fix: Province Extraction for Multi-Stage Delivery

## 📋 Vấn đề

Khi implement multi-stage delivery, cần so sánh `warehouse.province` với `customer.province` để xác định:

-   **Nội tỉnh** (cùng tỉnh) → 1 stage
-   **Liên tỉnh** (khác tỉnh) → 3 stages

Nhưng `shippingAddress` trong database **không có field `province`**, chỉ có:

```javascript
shippingAddress: {
  fullName: "uidhjre",
  phone: "0948489489",
  address: "66E Hoàng Diệu 2, Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh"
}
```

---

## ✅ Giải pháp

### 1️⃣ Backend: Thêm `province` field vào OrderDetail schema

**File:** `Server/src/models/orderDetailModel.js`

```javascript
// Shipping address (copy từ MainOrder)
const shippingSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    address: String,
    province: String, // ✅ MỚI: Tỉnh/Thành phố
});
```

---

### 2️⃣ Backend: Extract province khi tạo OrderDetail

**File:** `Server/src/controllers/orderManagementController.js`

```javascript
// ✅ Helper: Extract province từ address string
const extractProvinceFromAddress = (address) => {
    if (!address) return '';
    // Format: "Số nhà, Phường, Quận, Tỉnh/Thành phố"
    const parts = address.split(',').map((p) => p.trim());
    const province = parts[parts.length - 1]; // Lấy phần cuối = tỉnh
    return province;
};

// Khi tạo OrderDetail:
const orderDetail = new OrderDetail({
    mainOrderId,
    sellerId,
    items: sellerItems,
    subtotal,
    totalAmount: subtotal,
    shippingAddress: {
        ...shippingAddress,
        province: extractProvinceFromAddress(shippingAddress.address), // ✅
    },
    status: 'pending',
    paymentStatus: 'unpaid',
});
```

---

### 3️⃣ Frontend: Parse province từ address + Chuẩn hóa tên tỉnh

**File:** `Client/Book4U/src/components/seller/SellerOrdersManagement.jsx`

```javascript
// ✅ Helper: Extract province từ address string (fallback nếu backend chưa có)
const extractProvinceFromAddress = (address) => {
    if (!address) return '';
    const parts = address.split(',').map((p) => p.trim());
    const province = parts[parts.length - 1];

    // Chuẩn hóa tên tỉnh để so sánh chính xác
    const normalized = {
        'Thành phố Hồ Chí Minh': 'TPHCM',
        'Thành phố Hà Nội': 'Hà Nội',
        'TP. Hồ Chí Minh': 'TPHCM',
        'TP. Hà Nội': 'Hà Nội',
    };

    return normalized[province] || province;
};

// Khi click "Giao hàng":
const handleStartShipping = (orderDetail) => {
    const warehouseProvince = orderDetail.warehouseId?.province || 'TPHCM';
    const customerAddress = orderDetail.shippingAddress?.address;
    const customerProvince = extractProvinceFromAddress(customerAddress);

    const isNational = warehouseProvince !== customerProvince;
    const stages = isNational ? 3 : 1;

    setDeliveryInfo({
        orderDetailId: orderDetail._id,
        warehouseName: orderDetail.warehouseId?.name,
        warehouseProvince,
        customerName: orderDetail.shippingAddress?.fullName,
        customerProvince,
        customerAddress, // ✅ Hiển thị full address
        isNational,
        stages,
        totalAmount: orderDetail.totalAmount,
    });
    setShowDeliveryModal(true);
};
```

---

## 📊 Modal Display (Updated)

```
┌──────────────────────────────────┐
│  🚚 Xác nhận giao hàng            │
├──────────────────────────────────┤
│ 📦 Kho hàng                      │
│   Tên: Kho Chính TPHCM           │
│   Tỉnh: TPHCM                    │
│                                  │
│ 📍 Địa chỉ giao                  │
│   Khách: uidhjre                 │
│   Địa chỉ: 66E Hoàng Diệu 2,    │
│            Phường Linh Trung,     │
│            Thành phố Thủ Đức,     │
│            Thành phố Hồ Chí Minh  │
│   Tỉnh: TPHCM                    │
│                                  │
│ 📌 Loại giao hàng                │
│   ✓ Nội tỉnh (1 stage)           │
│   Shipper → Khách                │
│                                  │
│ 💰 Số tiền: 238.000đ             │
│                                  │
│ [Hủy]  [✓ Xác nhận giao]        │
└──────────────────────────────────┘
```

---

## 🎯 Flow Hoạt Động

### Nội tỉnh (TPHCM → TPHCM)

```
Seller bấm "Giao hàng"
  ↓
Modal parse: Warehouse tỉnh "TPHCM" vs Customer tỉnh "TPHCM"
  ↓
Hiển thị: "✓ Nội tỉnh (1 stage)"
  ↓
Seller xác nhận
  ↓
Backend: createDeliveryStages({orderDetailId})
  - Auto detect warehouse.province === customer.province
  - Tạo 1 stage
  - Assign shipper TPHCM
```

### Liên tỉnh (TPHCM → Hà Nội)

```
Seller bấm "Giao hàng"
  ↓
Modal parse: Warehouse tỉnh "TPHCM" vs Customer tỉnh "Hà Nội"
  ↓
Hiển thị: "🌍 Liên tỉnh (3 stages)"
  ↓
Seller xác nhận
  ↓
Backend: createDeliveryStages({orderDetailId})
  - Auto detect warehouse.province ≠ customer.province
  - Tạo 3 stages
  - Stage 1: Shipper TPHCM → Hub TPHCM
  - Stage 2: Auto (Hub chuyển)
  - Stage 3: Shipper HN → Khách
```

---

## 📝 Address Format

Hệ thống dự tính địa chỉ có format:

```
"Số nhà, Phường, Quận, Tỉnh/Thành phố"

Ví dụ:
- "66E Hoàng Diệu 2, Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh"
- "123 Lê Lợi, Hoàn Kiếm, Hà Nội"
```

**Parse logic:**

```javascript
parts = address.split(','); // ["66E Hoàng Diệu 2", " Phường Linh Trung", " Thành phố Thủ Đức", " Thành phố Hồ Chí Minh"]
province = parts[parts.length - 1].trim(); // "Thành phố Hồ Chí Minh"
normalized = 'TPHCM'; // Chuẩn hóa
```

---

## ✅ Checklist

-   [x] Thêm `province` field vào OrderDetail.shippingAddress schema
-   [x] Thêm helper function extract province
-   [x] Cập nhật OrderDetail creation để lưu province
-   [x] Frontend parse province từ address
-   [x] Chuẩn hóa tên tỉnh (TPHCM, Hà Nội, etc.)
-   [x] Hiển thị full address trong modal
-   [x] So sánh warehouse.province vs customer.province

---

## 🧪 Test Cases

### Case 1: Nội tỉnh (Lần đầu order sẽ extract, lần sau dùng từ DB)

```
OrderDetail được tạo:
  shippingAddress.address = "66E Hoàng Diệu 2, Phường Linh Trung, Thành phố Thủ Đức, Thành phố Hồ Chí Minh"
  shippingAddress.province = "Thành phố Hồ Chí Minh" (từ extract)

Warehouse:
  province = "TPHCM"

Frontend:
  customerProvince = extractProvinceFromAddress(address) → "TPHCM"
  warehouseProvince = "TPHCM"
  isNational = false
  stages = 1
  → Hiển thị "✓ Nội tỉnh (1 stage)"
```

### Case 2: Liên tỉnh

```
OrderDetail được tạo:
  shippingAddress.address = "123 Lê Lợi, Phường Hoàn Kiếm, Hà Nội"
  shippingAddress.province = "Hà Nội"

Warehouse:
  province = "TPHCM"

Frontend:
  customerProvince = "Hà Nội"
  warehouseProvince = "TPHCM"
  isNational = true
  stages = 3
  → Hiển thị "🌍 Liên tỉnh (3 stages)"
```

---

## 🔍 Migration (Nếu có existing orders)

Nếu database đã có OrderDetail cũ **không có province** field:

```javascript
// CLI command để update:
db.orderdetails.updateMany({ 'shippingAddress.province': { $exists: false } }, [
    {
        $set: {
            'shippingAddress.province': {
                $arrayElemAt: [
                    { $split: ['$shippingAddress.address', ','] },
                    -1,
                ],
            },
        },
    },
]);
```

---

**Status:** ✅ Ready to test
