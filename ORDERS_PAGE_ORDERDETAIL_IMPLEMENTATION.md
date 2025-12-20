# Đơn Hàng Của Tôi - Trang Hiển Thị OrderDetail

## Tổng Quan

Cập nhật trang "Đơn hàng của tôi" để hiển thị danh sách **OrderDetail** (chi tiết đơn hàng theo seller) thay vì Order cũ.

## Các Thay Đổi

### 1. API Function (orderApi.js)

**Thêm:**

```javascript
// Lấy danh sách OrderDetail của khách hàng (với delivery stages)
export const getUserOrdersDetail = (filters = {}) =>
    fetchHandler(
        axiosPrivate,
        'api/order-seller/details/list',
        filters,
        'Lỗi khi lấy danh sách chi tiết đơn hàng.'
    );
```

**Endpoint Backend:** `GET /api/order-seller/details/list`

---

### 2. Trang Orders.jsx

#### Import thay đổi:

```javascript
// ❌ TRƯỚC
import { getUserOrders, cancelOrder } from '../services/api/orderApi.js';

// ✅ SAU
import { getUserOrdersDetail, cancelOrder } from '../services/api/orderApi.js';
```

#### Hàm fetchOrders():

```javascript
const fetchOrders = async () => {
    try {
        setLoading(true);
        const params = filter !== 'all' ? { status: filter } : {};

        // Gọi API mới để lấy OrderDetails
        const response = await getUserOrdersDetail(params);

        if (response.success) {
            setOrders(response.data || []);
        } else {
            toast.error(response.message || 'Lỗi tải danh sách đơn hàng');
        }
    } catch (error) {
        toast.error('Lỗi tải danh sách đơn hàng');
        console.error(error);
    } finally {
        setLoading(false);
    }
};
```

**Thay đổi:**

-   Không cần kiểm tra `user._id` (API tự động lấy từ token)
-   Gọi `getUserOrdersDetail()` thay vì `getUserOrders(user._id, params)`

---

### 3. Giao Diện Order Card

**Nội dung hiển thị:**

```
┌─────────────────────────────────────────────┐
│ Đơn hàng #ABC123      [Trạng thái badge]   │
│ Cửa hàng: Tên shop  | 20/12/2024 10:30     │
│ ─────────────────────────────────────────── │
│ 📦 Sản phẩm (3)                            │
│   • Sách 1 x2                              │
│   • Sách 2 x1                              │
│   ... và 0 sản phẩm khác                   │
│                                             │
│ 📍 Giao đến: Nguyễn Văn A - 123 Tạ Quang  │
│ ─────────────────────────────────────────── │
│ Tổng tiền: 150.000₫  [Xem chi tiết] [Hủy] │
└─────────────────────────────────────────────┘
```

**Cải tiến:**

-   ✅ Hiển thị tên cửa hàng (seller.shopName)
-   ✅ Danh sách preview sản phẩm (tối đa 2, rest +N)
-   ✅ Địa chỉ giao hàng đầy đủ
-   ✅ Format tiền tệ dễ đọc
-   ✅ Nút "Xem chi tiết" → `/order-detail/{id}`

---

## Data Structure (OrderDetail)

```javascript
{
    _id: ObjectId,
    mainOrderId: ObjectId,        // Link tới MainOrder
    sellerId: {
        _id: ObjectId,
        firstName: "Hải",
        lastName: "Nguyễn",
        shopName: "Book Store",
        role: "seller"
    },
    customerId: ObjectId,         // Khách hàng
    items: [
        {
            bookId: {title: "Sách lập trình", ...},
            quantity: 2,
            price: 75000,
            warehouseId: ObjectId
        },
        ...
    ],
    status: "confirmed",          // pending, confirmed, picking, ...
    totalAmount: 150000,
    shippingAddress: {
        fullName: "Nguyễn Văn A",
        phone: "0901234567",
        address: "123 Tạ Quang Bửu",
        province: "Thành phố Hồ Chí Minh"
    },
    deliveryStages: [ObjectId, ObjectId, ObjectId],  // Stage 1, 2, 3
    createdAt: "2024-12-20T10:30:00Z",
    updatedAt: "2024-12-20T10:30:00Z"
}
```

---

## Status Filters

Giữ nguyên các bộ lọc cũ:

-   🔁 **all** - Tất cả đơn hàng
-   ⏳ **pending** - Chờ xác nhận
-   ✅ **confirmed** - Đã xác nhận
-   📦 **picking** - Đang lấy hàng
-   📮 **packed** - Đã đóng gói
-   🚚 **in_transit** - Đang vận chuyển
-   🎉 **completed** - Đã giao
-   ❌ **cancelled** - Hủy

---

## Điểm Khác Biệt So Với Cũ

| Tính Năng           | Order Cũ                    | OrderDetail Mới                  |
| ------------------- | --------------------------- | -------------------------------- |
| **Dữ liệu**         | MainOrder                   | Chi tiết theo seller             |
| **API**             | `/api/orders/user/{userId}` | `/api/order-seller/details/list` |
| **Seller Info**     | Không có                    | ✅ Có (shopName, ...)            |
| **Delivery Stages** | Không có                    | ✅ Có (Stage 1,2,3)              |
| **Items Chi tiết**  | Có                          | ✅ Có (link bookId)              |
| **Cancel Logic**    | Cơ bản                      | ✅ Tương tự                      |
| **Auth**            | Pass userId                 | ✅ Automatic (từ token)          |

---

## Luồng Dữ Liệu

```
User truy cập /orders
    ↓
Component mount → fetchOrders()
    ↓
getUserOrdersDetail() → POST /api/order-seller/details/list
    ↓
Backend lấy user từ JWT token (automatic)
    ↓
Query OrderDetail.find({customerId: user._id})
    ↓
Populate: sellerId, items.bookId, deliveryStages
    ↓
Return array of OrderDetails
    ↓
Render Order Cards with:
    ✓ Seller shop name
    ✓ Items list
    ✓ Shipping address
    ✓ Status badge
    ✓ Total amount
```

---

## Thử Nghiệm

### 1. Kiểm tra Danh Sách

-   [ ] Truy cập `/orders`
-   [ ] Xem danh sách OrderDetails
-   [ ] Kiểm tra tên cửa hàng hiển thị
-   [ ] Kiểm tra sản phẩm preview

### 2. Kiểm tra Bộ Lọc

-   [ ] Bộ lọc "Tất cả" hiển thị tất cả
-   [ ] Bộ lọc theo status hoạt động
-   [ ] URL không thay đổi (client-side filter)

### 3. Kiểm tra Chi Tiết

-   [ ] Click "Xem chi tiết" → `/order-detail/{id}`
-   [ ] Click order card → `/order-detail/{id}`

### 4. Kiểm tra Hủy Đơn

-   [ ] Nút "Hủy đơn" chỉ hiện với status: pending, confirmed, picking, packed
-   [ ] Click "Hủy" → confirm dialog
-   [ ] Sau hủy → refresh danh sách

---

## Files Thay Đổi

| File                           | Thay Đổi                                                 |
| ------------------------------ | -------------------------------------------------------- |
| `src/services/api/orderApi.js` | Rename `getCustomerOrderDetails` → `getUserOrdersDetail` |
| `src/pages/Orders.jsx`         | Update import, fetchOrders(), UI card                    |

---

## Notes

-   ✅ Không cần thay đổi backend (endpoint đã tồn tại)
-   ✅ Không cần migration database
-   ✅ Tương thích với workflow vận chuyển đa giai đoạn
-   ✅ Giữ nguyên logic hủy đơn
-   ✅ Tương thích với Navbar link `/orders`
