# 🚚 Update: Multi-Stage Delivery Flow Implementation

## 📋 Thay đổi trong SellerOrdersManagement.jsx

### ✨ Mô tả

Thay đổi flow giao hàng từ **Traditional Shipping** (VNPost/GHN) sang **Multi-Stage Delivery System**:

-   **Nội tỉnh** (cùng tỉnh kho & khách): 1 stage → Shipper giao trực tiếp
-   **Liên tỉnh** (khác tỉnh kho & khách): 3 stages → Shipper → Hub 1 → Hub 2 → Khách

---

## 🔄 Chi tiết thay đổi

### 1️⃣ Import

**Trước:**

```jsx
import {
    getSellerOrderDetails,
    shipOrderDetail,
    cancelOrderDetail,
    confirmOrderDetail,
} from '../../services/api/sellerOrderApi.js';
```

**Sau:**

```jsx
import {
    getSellerOrderDetails,
    shipOrderDetail,
    cancelOrderDetail,
    confirmOrderDetail,
} from '../../services/api/sellerOrderApi.js';
import { createDeliveryStages } from '../../services/api/multiDeliveryApi.js';
```

---

### 2️⃣ State Management

**Trước:**

```jsx
const [showShippingModal, setShowShippingModal] = useState(null);
const [shippingData, setShippingData] = useState({
    trackingNumber: '',
    carrierName: '',
    estimatedDeliveryDate: '',
});
```

**Sau:**

```jsx
const [showDeliveryModal, setShowDeliveryModal] = useState(null);
const [deliveryInfo, setDeliveryInfo] = useState(null);
```

---

### 3️⃣ Handler: handleStartShipping

**Trước:**

```jsx
const handleStartShipping = (orderDetailId) => {
    setShowShippingModal(orderDetailId);
    setShippingData({
        trackingNumber: '',
        carrierName: '',
        estimatedDeliveryDate: '',
    });
};
```

**Sau:**

```jsx
const handleStartShipping = (orderDetail) => {
    // ✅ Kiểm tra nội tỉnh vs liên tỉnh
    const warehouseProvince = orderDetail.warehouseId?.province;
    const customerProvince = orderDetail.shippingAddress?.province;

    const isNational = warehouseProvince !== customerProvince;
    const stages = isNational ? 3 : 1;

    setDeliveryInfo({
        orderDetailId: orderDetail._id,
        warehouseName: orderDetail.warehouseId?.name,
        warehouseProvince,
        customerName: orderDetail.shippingAddress?.fullName,
        customerProvince,
        isNational,
        stages,
        totalAmount: orderDetail.totalAmount,
    });
    setShowDeliveryModal(true);
};
```

**Điểm chính:**

-   Nhận `orderDetail` object (không chỉ ID)
-   So sánh `warehouse.province` với `customer.province`
-   Tự động xác định nội tỉnh (1 stage) vs liên tỉnh (3 stages)
-   Lưu thông tin để hiển thị modal

---

### 4️⃣ Handler: handleConfirmDelivery (MỚI)

```jsx
const handleConfirmDelivery = async () => {
    if (!deliveryInfo) return;

    try {
        // ✅ Gọi createDeliveryStages thay vì shipOrderDetail
        const response = await createDeliveryStages({
            orderDetailId: deliveryInfo.orderDetailId,
        });

        if (response.success) {
            toast.success(
                `Tạo ${deliveryInfo.stages} stage(s) giao hàng thành công`
            );
            setShowDeliveryModal(false);
            setDeliveryInfo(null);
            fetchOrderDetails();
        } else {
            toast.error(response.message || 'Lỗi tạo stages giao hàng');
        }
    } catch (error) {
        toast.error('Lỗi tạo stages giao hàng');
        console.error(error);
    }
};
```

**Điểm chính:**

-   Gọi `createDeliveryStages()` thay vì `shipOrderDetail()`
-   Backend tự động:
    -   Tạo 1 stage nếu nội tỉnh
    -   Tạo 3 stages nếu liên tỉnh
    -   Assign shippers dựa trên province
    -   Tạo delivery stages tracking

---

### 5️⃣ Modal: Delivery Modal (Thay thế Shipping Modal)

**Hiển thị:**

```
┌─────────────────────────────┐
│  🚚 Xác nhận giao hàng       │
├─────────────────────────────┤
│ 📦 Kho hàng                 │
│   Tên kho: ...              │
│   Tỉnh: TPHCM               │
│                             │
│ 📍 Địa chỉ giao             │
│   Tên khách: ...            │
│   Tỉnh: Hà Nội              │
│                             │
│ 📌 Loại giao hàng           │
│   Liên tỉnh (3 stages)      │
│   Shipper → Hub1 → Hub2 → Khách │
│                             │
│ 💰 Số tiền: 238.000đ        │
│                             │
│ [Hủy]  [✓ Xác nhận giao]   │
└─────────────────────────────┘
```

**Nội dung modal:**

-   ✅ Thông tin kho (tên, tỉnh)
-   ✅ Thông tin khách (tên, tỉnh)
-   ✅ Tự động detect nội tỉnh/liên tỉnh
-   ✅ Hiển thị số stages sẽ tạo
-   ✅ Hiển thị flow giao hàng
-   ✅ Hiển thị số tiền
-   ✅ Nút Hủy + Xác nhận

---

### 6️⃣ Button Handler

**Trước:**

```jsx
{
    orderDetail.status === 'confirmed' && (
        <button
            onClick={() => handleStartShipping(orderDetail._id)}
            className="...">
            🚚 Giao hàng
        </button>
    );
}
```

**Sau:**

```jsx
{
    orderDetail.status === 'confirmed' && (
        <button
            onClick={() => handleStartShipping(orderDetail)}
            className="...">
            🚚 Giao hàng
        </button>
    );
}
```

**Thay đổi:** Pass `orderDetail` object thay vì `orderDetail._id`

---

## 📊 Flow mới

### Nội tỉnh (1 Stage)

```
Seller bấm "Giao hàng"
    ↓
Modal: Kho TPHCM → Khách TPHCM
       → "Nội tỉnh (1 stage)"
    ↓
Seller xác nhận
    ↓
Backend: createDeliveryStages()
    - Tạo 1 stage
    - Assign shipper TPHCM
    ↓
DeliveryStage.status = 'created'
OrderDetail.status = 'shipping'
```

### Liên tỉnh (3 Stages)

```
Seller bấm "Giao hàng"
    ↓
Modal: Kho TPHCM → Khách Hà Nội
       → "Liên tỉnh (3 stages)"
       → "Shipper → Hub1 → Hub2 → Khách"
    ↓
Seller xác nhận
    ↓
Backend: createDeliveryStages()
    - Tạo 3 stages
    - Stage 1: Shipper TPHCM → Hub TPHCM
    - Stage 2: Auto (Hub chuyển)
    - Stage 3: Shipper HN → Khách
    ↓
DeliveryStages created
Shippers HN thấy Stage 3 trong dashboard
```

---

## 🎯 Lợi ích

✅ **Tự động detect:** Nội tỉnh vs liên tỉnh  
✅ **Minh bạch:** Seller thấy rõ flow giao hàng  
✅ **Đơn giản:** Chỉ cần bấm "Xác nhận giao"  
✅ **Tích hợp:** Tự động tạo stages + assign shippers  
✅ **Tracking:** Khách hàng thấy 3 stages rõ ràng

---

## 🧪 Test Cases

### Case 1: Nội tỉnh

```
Warehouse: Hà Nội (Hoàn Kiếm)
Customer: Hà Nội (Ba Đình)

→ Modal hiển thị: "Nội tỉnh (1 stage)"
→ Xác nhận → 1 DeliveryStage created
→ Shipper HN thấy đơn
```

### Case 2: Liên tỉnh

```
Warehouse: TPHCM (Q1)
Customer: Hà Nội (Hoàn Kiếm)

→ Modal hiển thị: "Liên tỉnh (3 stages)"
→ Xác nhận → 3 DeliveryStages created
→ Shipper TPHCM thấy stage 1
→ Shipper HN thấy stage 3
```

---

## 📝 Ghi chú

-   `warehouseId` phải có field `province` được populate từ backend
-   `shippingAddress` phải có field `province` (đã có)
-   Backend `createDeliveryStages()` tự động xử lý logic:
    -   Kiểm tra warehouse vs customer province
    -   Tạo 1 hoặc 3 stages
    -   Assign shippers dựa trên province coverage

---

**Status:** ✅ Ready to test
