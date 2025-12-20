# Trang "Đơn Hàng Của Tôi" - Quick Reference

## Tóm Tắt Thay Đổi

✅ **Hoàn Thành:** Trang hiển thị đơn hàng OrderDetail

### 1. API Thay Đổi

```javascript
// src/services/api/orderApi.js
export const getUserOrdersDetail = (filters = {}) =>
    fetchHandler(axiosPrivate, 'api/order-seller/details/list', ...)
```

### 2. Trang Orders.jsx Cập Nhật

**Import:**

```javascript
import { getUserOrdersDetail, cancelOrder } from '../services/api/orderApi.js';
```

**Fetch Orders:**

```javascript
const response = await getUserOrdersDetail(params);
```

**UI Cải Tiến:**

-   👤 Hiển thị tên cửa hàng
-   📦 Danh sách sản phẩm (preview 2, +N còn lại)
-   📍 Địa chỉ giao hàng đầy đủ
-   💰 Tổng tiền formatted
-   🔗 Link `/order-detail/{id}` (thay vì `/orders/{id}`)

---

## Hiển Thị Trên Giao Diện

```
┌─ FILTERS ───────────────────────────────┐
│ Tất cả | Chờ xác nhận | Đã xác nhận ... │
└─────────────────────────────────────────┘

┌─ ORDER CARD 1 ──────────────────────────┐
│ Đơn hàng #ABC123     ✅ Đã xác nhận    │
│ Cửa hàng: Book Store | 20/12/2024      │
│ ─────────────────────────────────────── │
│ 📦 Sản phẩm (2)                        │
│   • Lập trình Python x1                │
│   • Clean Code x1                      │
│ 📍 Giao: Nguyễn Văn A - HCM            │
│ ─────────────────────────────────────── │
│ Tổng: 150.000₫    [Xem chi tiết] [Hủy]│
└─────────────────────────────────────────┘

┌─ ORDER CARD 2 ──────────────────────────┐
│ Đơn hàng #DEF456     🎉 Đã giao       │
│ Cửa hàng: Tech Books | 18/12/2024     │
│ ...
└─────────────────────────────────────────┘
```

---

## Test Checklist

-   [ ] Trang `/orders` load danh sách OrderDetails
-   [ ] Hiển thị tên cửa hàng đúng
-   [ ] Bộ lọc status hoạt động
-   [ ] Click card → `/order-detail/{id}`
-   [ ] Nút "Hủy" chỉ hiện đúng statuses
-   [ ] Toast error/success hiển thị

---

## API Response Example

```json
{
    "success": true,
    "data": [
        {
            "_id": "ABC123...",
            "sellerId": {
                "_id": "seller_123",
                "shopName": "Book Store",
                "firstName": "Hải"
            },
            "items": [
                {
                    "bookId": {
                        "_id": "book_1",
                        "title": "Lập trình Python"
                    },
                    "quantity": 1,
                    "price": 75000
                }
            ],
            "status": "confirmed",
            "totalAmount": 150000,
            "shippingAddress": {
                "fullName": "Nguyễn Văn A",
                "address": "123 Tạ Quang Bửu"
            },
            "createdAt": "2024-12-20T10:30:00Z"
        }
    ]
}
```

---

## Files Thay Đổi

| File          | Dòng    | Thay Đổi            |
| ------------- | ------- | ------------------- |
| `orderApi.js` | 86      | Rename function     |
| `Orders.jsx`  | 4       | Import new function |
| `Orders.jsx`  | 62      | Call new API        |
| `Orders.jsx`  | 142-220 | Update UI card      |

---

## Status Labels (Giữ Nguyên)

| Status     | Label              | Color  |
| ---------- | ------------------ | ------ |
| pending    | ⏳ Chờ xác nhận    | yellow |
| confirmed  | ✅ Đã xác nhận     | blue   |
| picking    | 📦 Đang lấy hàng   | purple |
| packed     | 📮 Đã đóng gói     | orange |
| in_transit | 🚚 Đang vận chuyển | indigo |
| completed  | 🎉 Đã giao         | green  |
| cancelled  | ❌ Hủy             | gray   |

---

## Lợi Ích

✅ Hiển thị chính xác đơn hàng theo seller
✅ Tích hợp delivery stages (vận chuyển đa giai đoạn)
✅ UX tốt hơn (chi tiết seller, sản phẩm, địa chỉ)
✅ Chuẩn bị cho tracking order chi tiết
✅ Giảm confusion (khách biết mua từ ai)
