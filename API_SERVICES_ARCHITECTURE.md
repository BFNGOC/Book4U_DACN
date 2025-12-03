# API Services Architecture - Order-to-Delivery System

**Ngày hoàn thành:** December 3, 2025  
**Trạng thái:** ✅ HOÀN THÀNH - Tách tất cả API calls vào các file service riêng

---

## 📋 Tổng hợp API Services

### **1. orderApi.js** ✅ TẠO MỚI

**Đường dẫn:** `Client/Book4U/src/services/api/orderApi.js`

Quản lý tất cả API liên quan đến đơn hàng khách hàng:

```javascript
// Tạo đơn hàng mới (status = pending)
createOrder(orderData);

// Validate stock trước khi tạo đơn
validateStock(items);

// Lấy chi tiết đơn hàng
getOrderDetail(orderId);

// Lấy danh sách đơn hàng của khách hàng
getUserOrders(profileId, (filters = {}));

// Hủy đơn hàng
cancelOrder(orderId, reason);

// Xác nhận đơn hàng từ seller (chuyển pending → confirmed)
confirmOrder(orderId);

// Yêu cầu hoàn hàng
requestReturn(orderId, reason);

// Duyệt/từ chối hoàn hàng
approveReturn(orderId, approved, reason);
```

**Sử dụng trong:**

-   Checkout.jsx (createOrder)
-   Orders.jsx (getUserOrders, cancelOrder)
-   OrderDetail.jsx (getOrderDetail, requestReturn)

---

### **2. deliveryApi.js** ✅ TẠO MỚI

**Đường dẫn:** `Client/Book4U/src/services/api/deliveryApi.js`

Quản lý tất cả API liên quan đến vận chuyển và tracking:

```javascript
// Lấy thông tin tracking/vận chuyển
getDeliveryInfo(orderId);

// Cập nhật vị trí GPS (shipper)
updateDeliveryLocation(orderId, latitude, longitude, address);

// Ghi nhận lần giao hàng (shipper)
recordDeliveryAttempt(orderId, success, reason, notes);

// Cập nhật trạng thái vận chuyển
updateDeliveryStatus(orderId, status);

// Lấy lịch sử tracking (timeline)
getTrackingTimeline(orderId);
```

**Sử dụng trong:**

-   OrderTracking.jsx (getDeliveryInfo - auto-refresh 10s)
-   OrderDetail.jsx (thông qua OrderTracking)

---

### **3. sellerOrderApi.js** ✅ CẬP NHẬT/MỞ RỘNG

**Đường dẫn:** `Client/Book4U/src/services/api/sellerOrderApi.js`

Quản lý tất cả API cho quy trình đơn hàng của seller:

```javascript
// Lấy danh sách đơn hàng của seller (filter theo status)
getSellerOrders((params = {}));

// Lấy chi tiết một đơn hàng
getSellerOrderDetail(orderId);

// Cập nhật trạng thái đơn hàng (generic)
updateOrderStatus(orderId, status);

// Bắt đầu picking (pending → picking)
startPicking(orderId);

// Đánh dấu đã packed (picking → packed)
markAsPacked(orderId);

// Giao hàng cho vận chuyển (packed → in_transit)
handoffToCarrier(orderId, handoffData);
```

**Sử dụng trong:**

-   SellerConfirmation.jsx (getSellerOrders, confirmOrder)
-   SellerOrdersManagement.jsx (getSellerOrders, startPicking, markAsPacked, handoffToCarrier)

---

### **4. userApi.js** ✅ CẬP NHẬT

**Đường dẫn:** `Client/Book4U/src/services/api/userApi.js`

Thêm hàm lấy profile người dùng:

```javascript
// Lấy thông tin profile của người dùng
getUserProfile(userId);
```

**Sử dụng trong:**

-   Checkout.jsx (lấy profileId)
-   Orders.jsx (lấy profileId)

---

## 📊 File Service Mapping

| Service File          | Hàm                    | Sử dụng trong                              |
| --------------------- | ---------------------- | ------------------------------------------ |
| **orderApi.js**       | createOrder            | Checkout.jsx                               |
|                       | getUserOrders          | Orders.jsx                                 |
|                       | getOrderDetail         | OrderDetail.jsx                            |
|                       | cancelOrder            | Orders.jsx                                 |
|                       | requestReturn          | OrderDetail.jsx                            |
|                       | confirmOrder           | SellerConfirmation.jsx                     |
| **deliveryApi.js**    | getDeliveryInfo        | OrderTracking.jsx                          |
|                       | updateDeliveryLocation | (Shipper app)                              |
|                       | recordDeliveryAttempt  | (Shipper app)                              |
|                       | updateDeliveryStatus   | (Shipper app)                              |
| **sellerOrderApi.js** | getSellerOrders        | SellerConfirmation, SellerOrdersManagement |
|                       | startPicking           | SellerOrdersManagement                     |
|                       | markAsPacked           | SellerOrdersManagement                     |
|                       | handoffToCarrier       | SellerOrdersManagement                     |
| **userApi.js**        | getUserProfile         | Checkout, Orders                           |

---

## 🔄 Import Pattern

### Trước (sử dụng axios trực tiếp)

```javascript
import axios from 'axios';
import API_URL from '../configs/api.js';

const response = await axios.get(`${API_URL}/api/orders/user/${profileId}`, {
    headers: { Authorization: `Bearer ${token}` },
});
```

### Sau (sử dụng API services)

```javascript
import { getUserOrders } from '../services/api/orderApi.js';

const response = await getUserOrders(profileId, { status: 'confirmed' });
if (response.success) {
    setOrders(response.data);
}
```

---

## ✨ Lợi ích của tách API services

### 1. **Centralized Management**

-   Tất cả API calls ở một nơi
-   Dễ bảo trì và cập nhật

### 2. **Consistency**

-   Sử dụng fetchHandler chung
-   Error handling thống nhất
-   Response format chung

### 3. **Reusability**

-   Có thể dùng lại các hàm ở nhiều component
-   Tránh duplicate code

### 4. **Type Safety** (khi migrate sang TypeScript)

-   Định nghĩa rõ input/output types
-   IDE autocomplete tốt hơn

### 5. **Easy Testing**

-   Dễ mock và test các API calls
-   Có thể test riêng business logic và API logic

---

## 📁 Cấu trúc thư mục

```
Client/Book4U/src/
├── services/
│   └── api/
│       ├── orderApi.js           ✅ NEW
│       ├── deliveryApi.js        ✅ NEW
│       ├── sellerOrderApi.js     ✅ UPDATED
│       ├── userApi.js            ✅ UPDATED
│       ├── fetchHandler.js       (sử dụng cho tất cả)
│       ├── cartApi.js
│       ├── bookApi.js
│       └── ...
├── pages/
│   ├── Checkout.jsx              ✅ UPDATED (dùng orderApi, userApi)
│   ├── Orders.jsx                ✅ UPDATED (dùng orderApi, userApi)
│   ├── OrderDetail.jsx           ✅ UPDATED (dùng orderApi)
│   └── SellerConfirmation.jsx    ✅ UPDATED (dùng sellerOrderApi)
├── components/
│   ├── common/
│   │   └── OrderTracking.jsx     ✅ UPDATED (dùng deliveryApi)
│   └── seller/
│       └── SellerOrdersManagement.jsx ✅ UPDATED (dùng sellerOrderApi)
└── ...
```

---

## 🔗 API Endpoints Reference

### Customer Order Endpoints

```
POST   /api/orders/create                 → createOrder()
GET    /api/orders/{id}                   → getOrderDetail()
GET    /api/orders/user/{profileId}       → getUserOrders()
POST   /api/orders/{id}/cancel            → cancelOrder()
POST   /api/orders/{id}/confirm           → confirmOrder()
POST   /api/orders/{id}/return/request    → requestReturn()
POST   /api/orders/{id}/return/approve    → approveReturn()
```

### Delivery Endpoints

```
GET    /api/delivery/{id}                 → getDeliveryInfo()
PUT    /api/delivery/{id}/location        → updateDeliveryLocation()
PUT    /api/delivery/{id}/attempt         → recordDeliveryAttempt()
PUT    /api/delivery/{id}/status          → updateDeliveryStatus()
GET    /api/delivery/{id}/timeline        → getTrackingTimeline()
```

### Seller Order Endpoints

```
GET    /api/seller-orders                 → getSellerOrders()
GET    /api/seller-orders/{id}            → getSellerOrderDetail()
PUT    /api/seller-orders/{id}/status     → updateOrderStatus()
PUT    /api/seller-orders/{id}/status/picking    → startPicking()
PUT    /api/seller-orders/{id}/status/packed     → markAsPacked()
PUT    /api/seller-orders/{id}/handoff-carrier   → handoffToCarrier()
```

---

## 🧪 Ví dụ sử dụng

### Checkout.jsx

```jsx
import { createOrder } from '../services/api/orderApi.js';
import { getUserProfile } from '../services/api/userApi.js';

const handlePlaceOrder = async () => {
    const profileRes = await getUserProfile(userId);
    if (!profileRes.success) return;

    const orderData = {
        profileId: profileRes.data._id,
        items: [...],
        totalAmount: total,
        paymentMethod: 'COD',
        shippingAddress: {...}
    };

    const response = await createOrder(orderData);
    if (response.success) {
        navigate(`/orders/${response.data._id}`);
    }
};
```

### Orders.jsx

```jsx
import { getUserOrders, cancelOrder } from '../services/api/orderApi.js';
import { getUserProfile } from '../services/api/userApi.js';

const fetchOrders = async () => {
    const profileRes = await getUserProfile(userId);
    const params = filter !== 'all' ? { status: filter } : {};
    const response = await getUserOrders(profileRes.data._id, params);
    setOrders(response.data);
};

const handleCancelOrder = async (orderId) => {
    const response = await cancelOrder(orderId, 'Khách hủy');
    if (response.success) fetchOrders();
};
```

### OrderTracking.jsx

```jsx
import { getDeliveryInfo } from '../../services/api/deliveryApi.js';

const fetchTrackingInfo = async () => {
    const response = await getDeliveryInfo(orderId);
    if (response.success) {
        setTrackingInfo(response.data);
    }
};

// Auto-refresh mỗi 10s
useEffect(() => {
    fetchTrackingInfo();
    const interval = setInterval(fetchTrackingInfo, 10000);
    return () => clearInterval(interval);
}, [orderId]);
```

### SellerOrdersManagement.jsx

```jsx
import {
    getSellerOrders,
    startPicking,
    markAsPacked,
    handoffToCarrier,
} from '../../services/api/sellerOrderApi.js';

const fetchOrders = async () => {
    const response = await getSellerOrders({ status: filter });
    setOrders(response.data);
};

const handleStartPicking = async (orderId) => {
    const response = await startPicking(orderId);
    if (response.success) fetchOrders();
};

const handleConfirmHandoff = async () => {
    const response = await handoffToCarrier(orderId, handoffData);
    if (response.success) fetchOrders();
};
```

---

## 🎯 Response Format (fetchHandler)

Tất cả API services trả về format chung:

```javascript
{
    success: true/false,
    data: {...},      // Dữ liệu từ server (res.data.data)
    meta: {...},      // Metadata (pagination, etc)
    message: "..."    // Error message (nếu có)
}
```

---

## ✅ Đã cập nhật các file

| File                       | Loại    | Thay đổi                  |
| -------------------------- | ------- | ------------------------- |
| orderApi.js                | NEW     | Tạo mới                   |
| deliveryApi.js             | NEW     | Tạo mới                   |
| sellerOrderApi.js          | UPDATED | Mở rộng thêm hàm          |
| userApi.js                 | UPDATED | Thêm getUserProfile       |
| Checkout.jsx               | UPDATED | Sử dụng orderApi, userApi |
| Orders.jsx                 | UPDATED | Sử dụng orderApi, userApi |
| OrderDetail.jsx            | UPDATED | Sử dụng orderApi          |
| OrderTracking.jsx          | UPDATED | Sử dụng deliveryApi       |
| SellerConfirmation.jsx     | UPDATED | Sử dụng sellerOrderApi    |
| SellerOrdersManagement.jsx | UPDATED | Sử dụng sellerOrderApi    |

---

## 🚀 Lợi ích trong tương lai

1. **Dễ migrate sang TypeScript**

    - Định nghĩa interface cho request/response

2. **Dễ thêm caching**

    - Lưu cache response API

3. **Dễ thêm interceptors**

    - Xử lý retry, timeout, etc

4. **Dễ thêm analytics**

    - Track API calls, performance

5. **Dễ testing**
    - Mock tất cả API calls

---

**✅ Tất cả API services đã được tách riêng và tích hợp vào các component!**

Phần còn lại của codebase giờ sạch hơn, dễ bảo trì hơn, và tái sử dụng được tốt hơn.
