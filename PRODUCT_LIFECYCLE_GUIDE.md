# 📦 QUY TRÌNH CHUẨN: PRODUCT LIFECYCLE (3 BƯỚC)

## 🎯 Tổng Quan

Hệ thống bán hàng Book4U sử dụng quy trình chuẩn **3 bước bắt buộc** để đảm bảo chất lượng sản phẩm:

```
BỚ 1️⃣: Tạo Sách (Draft)
   ↓
BỚ 2️⃣: Nhập Kho
   ↓
BỚ 3️⃣: Đăng Bán (Publish)
```

---

## 📝 BỚ 1: TẠO SÁCH (DRAFT)

### Mô Tả

-   Tạo **metadata** sách: tên, tác giả, giá, danh mục, hình ảnh
-   Sách được tạo ở trạng thái **DRAFT** (`isPublished = false`)
-   Tồn kho mặc định **LUÔN = 0** (`stock = 0`)
-   **Không yêu cầu nhập kho** lúc tạo

### API Endpoint

```
POST /api/books
Header: Authorization: Bearer {token}
Content-Type: multipart/form-data

Required Fields:
- title: string (tên sách)
- author: string (tác giả)
- price: number (giá > 0)
- categoryId: ObjectId (danh mục)
- format: enum['bìa mềm', 'bìa cứng', 'ebook']
- numPages: number (số trang > 0)
- language: string (mặc định: 'Tiếng Việt')

Optional Fields:
- publisher: string
- publicationYear: number (1900 - năm hiện tại)
- description: string
- discount: number (0-100)
- tags: array<string>
- images: file[] (tối đa 10 ảnh)
```

### Response Example

```json
{
    "success": true,
    "message": "Tạo sách (draft) thành công. Bước tiếp: Nhập kho → Đăng bán",
    "data": {
        "_id": "book_123",
        "title": "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
        "author": "Nguyễn Nhật Ánh",
        "price": 95000,
        "stock": 0, // ✅ ALWAYS 0
        "isPublished": false, // ✅ ALWAYS false
        "sellerId": "seller_1",
        "categoryId": "cat_1",
        "createdAt": "2025-11-30T10:00:00Z"
    }
}
```

### Frontend Code (React)

```javascript
import { createBook } from '../services/api/bookApi';

// Bước 1: Tạo sách
const handleCreateBook = async (formData) => {
    try {
        const response = await createBook(formData);
        if (response.success) {
            const bookId = response.data._id;
            console.log('✅ Sách tạo thành công (draft)');
            console.log('📌 BookID để nhập kho:', bookId);

            // Chuyển sang Bước 2: Nhập kho
            navigateToWarehouse(bookId);
        }
    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
};
```

---

## 📦 BỚ 2: NHẬP KHO (IMPORT STOCK)

### Mô Tả

-   Nhập tồn kho cho sách **DRAFT** từ bước 1
-   Sử dụng `bookId` từ bước 1 + `warehouseId` từ kho của seller
-   Cập nhật **WarehouseStock** → tăng **Book.stock**
-   Tạo **WarehouseLog** (audit trail)
-   **Atomic transaction** chống race condition

### API Endpoint

```
POST /api/warehouse/import-stock
Header: Authorization: Bearer {token}

Required Fields:
- bookId: ObjectId (từ Bước 1)
- warehouseId: ObjectId (kho của seller)
- quantity: number (số lượng > 0)
- reason: string (lý do: 'Nhập kho', 'Hàng bổ sung', etc.)
```

### Request Example

```javascript
const importPayload = {
    bookId: 'book_123', // Từ Bước 1
    warehouseId: 'warehouse_1', // Kho của seller
    quantity: 50, // Nhập 50 cuốn
    reason: 'Nhập kho ban đầu',
};

const response = await warehouseApi.importStock(importPayload);
```

### Response Example

```json
{
    "success": true,
    "message": "Nhập kho thành công",
    "data": {
        "warehouseStock": {
            "sellerId": "seller_1",
            "bookId": "book_123",
            "warehouseId": "warehouse_1",
            "warehouseName": "Kho Hà Nội",
            "quantity": 50,
            "quantityBefore": 0,
            "quantityAfter": 50
        },
        "book": {
            "_id": "book_123",
            "stock": 50 // ✅ Book.stock tăng từ 0 → 50
        },
        "log": {
            "type": "import",
            "quantity": 50,
            "quantityBefore": 0,
            "quantityAfter": 50,
            "createdAt": "2025-11-30T10:05:00Z"
        }
    }
}
```

### Validation Rules

✅ `book` phải tồn tại  
✅ `book` phải thuộc về `seller` (sellerId match)  
✅ `warehouse` phải thuộc về `seller` (warehouses[] contain)  
✅ `quantity > 0`  
✅ **Transaction-protected**: Tất cả hoặc không có gì

### Frontend Code (React)

```javascript
import { importStock } from '../services/api/warehouseApi';

// Bước 2: Nhập kho
const handleImportStock = async (bookId, quantity) => {
    try {
        const payload = {
            bookId,
            warehouseId: selectedWarehouse._id,
            quantity,
            reason: 'Nhập kho ban đầu',
        };

        const response = await importStock(payload);
        if (response.success) {
            console.log('✅ Nhập kho thành công');
            console.log('📦 Tồn kho hiện tại:', response.data.book.stock);

            // Chuyển sang Bước 3: Đăng bán
            navigateToPublish(bookId);
        }
    } catch (error) {
        toast.error(error.message);
    }
};
```

### Lỗi Thường Gặp

| Error                                        | Nguyên Nhân                            | Giải Pháp                            |
| -------------------------------------------- | -------------------------------------- | ------------------------------------ |
| "Sách không tồn tại hoặc không thuộc về bạn" | `bookId` sai hoặc sách của seller khác | Kiểm tra `bookId` từ Bước 1          |
| "Kho không tồn tại hoặc không thuộc về bạn"  | `warehouseId` sai                      | Chọn kho từ danh sách `warehouses[]` |
| "Dữ liệu nhập không hợp lệ"                  | `quantity <= 0`                        | Nhập `quantity > 0`                  |

---

## 📢 BỚ 3: ĐĂNG BÁN (PUBLISH)

### Mô Tả

-   **Chuyển** sách từ trạng thái **DRAFT** → **PUBLISHED**
-   Sách sẽ **xuất hiện** trên trang công khai
-   Khách hàng có thể tìm kiếm & mua

### Điều Kiện Yêu Cầu (MUST-HAVE)

```
✅ Book.stock > 0         → Phải nhập kho trước
✅ Seller.isVerified      → Seller phải verified
✅ Thông tin đầy đủ       → title, author, price, categoryId
✅ isPublished: false     → Sách phải ở trạng thái draft
```

### API Endpoint

```
PATCH /api/books/:id/publish
Header: Authorization: Bearer {token}
Body: {} (trống)

Path Parameter:
- id: ObjectId (bookId từ Bước 1)
```

### Request Example

```javascript
import { publishBook } from '../services/api/bookApi';

// Bước 3: Đăng bán
const handlePublishBook = async (bookId) => {
    try {
        const response = await publishBook(bookId);
        if (response.success) {
            toast.success(
                '✅ Đăng bán thành công! Sách đã xuất hiện trên trang công khai'
            );
            console.log('📊 Sách ID:', response.data._id);
            console.log('📦 Tồn kho:', response.data.stock);
            console.log('📢 Trạng thái:', 'Published');
        }
    } catch (error) {
        toast.error(error.message);
    }
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Đăng bán sách thành công! 🎉",
    "data": {
        "_id": "book_123",
        "title": "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
        "author": "Nguyễn Nhật Ánh",
        "price": 95000,
        "stock": 50,
        "isPublished": true, // ✅ CHANGED to true
        "discount": 0,
        "soldCount": 0,
        "createdAt": "2025-11-30T10:00:00Z",
        "updatedAt": "2025-11-30T10:10:00Z"
    }
}
```

### Error Responses

#### ❌ Tồn kho = 0

```json
{
    "success": false,
    "message": "Không thể đăng bán sách khi tồn kho = 0. Vui lòng nhập kho trước.",
    "required": "Bước 2: Nhập kho"
}
```

**Giải pháp**: Quay lại Bước 2, nhập kho với `quantity > 0`

#### ❌ Seller chưa verified

```json
{
    "success": false,
    "message": "Bạn chưa xác minh. Vui lòng hoàn tất xác minh để đăng bán."
}
```

**Giải pháp**: Hoàn tất xác minh thông tin tài khoản (ID, địa chỉ, v.v.)

#### ❌ Thông tin không đầy đủ

```json
{
    "success": false,
    "message": "Thiếu thông tin: publisher, description"
}
```

**Giải pháp**: Cập nhật sách (Bước UPDATE) để điền đầy đủ thông tin

---

## 🔄 WORKFLOW FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                   PRODUCT LIFECYCLE                          │
└──────────────────────────────────────────────────────────────┘

  BƯỚC 1: TẠO SÁCH (DRAFT)
  ┌─────────────────────────┐
  │ POST /api/books         │
  │ → stock = 0             │
  │ → isPublished = false   │
  └─────────────┬───────────┘
                │
                ↓
  BƯỚC 2: NHẬP KHO
  ┌─────────────────────────┐
  │ POST /api/warehouse/    │
  │       import-stock      │
  │ → WarehouseStock++      │
  │ → Book.stock++          │
  │ → WarehouseLog +        │
  └─────────────┬───────────┘
                │
                ↓ (stock > 0)
  BƯỚC 3: ĐĂNG BÁN
  ┌─────────────────────────┐
  │ PATCH /api/books/       │
  │       :id/publish       │
  │ → isPublished = true    │
  │ → Xuất hiện trên trang  │
  │   công khai             │
  └─────────────┬───────────┘
                │
                ↓
         🎉 PUBLISHED 🎉
        Khách hàng có thể mua
```

---

## 📊 DATABASE SCHEMA CHANGES

### Book Model

```javascript
{
  ...existing fields,

  // ✨ NEW: Trạng thái publish
  isPublished: {
    type: Boolean,
    default: false,    // Draft mặc định
    index: true
  },

  // ⏰ AUTO: Timestamps
  createdAt: Date,   // Lúc tạo (Bước 1)
  updatedAt: Date    // Lúc publish (Bước 3)
}
```

### WarehouseStock Model (Existing - No Changes)

```javascript
{
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  warehouseName: String,     // Cache field
  quantity: Number,
  quantityBefore: Number,    // Tự track
  quantityAfter: Number,
  lastUpdatedStock: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### WarehouseLog Model (Existing - No Changes)

```javascript
{
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  warehouseName: String,
  type: enum['import', 'export', 'order_create', 'order_cancel'],
  quantity: Number,
  quantityBefore: Number,
  quantityAfter: Number,
  orderId: ObjectId,         // Nếu type = order*
  reason: String,
  performedBy: ObjectId,
  status: enum['success', 'failed'],
  createdAt: Date
}
```

---

## 🔒 VALIDATION CHECKLIST

### Bước 1: Tạo Sách

-   ✅ User là seller
-   ✅ categoryId tồn tại
-   ✅ Thông tin bắt buộc đầy đủ
-   ✅ Tự động set `stock = 0`, `isPublished = false`

### Bước 2: Nhập Kho

-   ✅ `bookId` tồn tại & thuộc seller
-   ✅ `warehouseId` tồn tại & thuộc seller
-   ✅ `quantity > 0`
-   ✅ Transaction-protected
-   ✅ Cập nhật cả WarehouseStock & Book.stock

### Bước 3: Đăng Bán

-   ✅ `bookId` tồn tại & thuộc seller
-   ✅ `Book.stock > 0`
-   ✅ `Seller.isVerified = true`
-   ✅ Thông tin bắt buộc đầy đủ
-   ✅ Chuyển `isPublished: false → true`

---

## 💻 FRONTEND INTEGRATION EXAMPLE

### SellerProductWorkflow.jsx

```jsx
import { useState } from 'react';
import { createBook } from '../services/api/bookApi';
import { importStock } from '../services/api/warehouseApi';
import { publishBook } from '../services/api/bookApi';
import toast from 'react-hot-toast';

function SellerProductWorkflow() {
    const [step, setStep] = useState(1); // 1, 2, or 3
    const [bookId, setBookId] = useState(null);

    // BƯỚC 1: Tạo sách
    const handleStep1 = async (formData) => {
        const res = await createBook(formData);
        if (res.success) {
            setBookId(res.data._id);
            toast.success('✅ Sách tạo thành công (draft)');
            setStep(2);
        }
    };

    // BƯỚC 2: Nhập kho
    const handleStep2 = async (warehouseId, quantity) => {
        const res = await importStock({
            bookId,
            warehouseId,
            quantity,
            reason: 'Nhập kho ban đầu',
        });
        if (res.success) {
            toast.success('✅ Nhập kho thành công');
            setStep(3);
        }
    };

    // BƯỚC 3: Đăng bán
    const handleStep3 = async () => {
        const res = await publishBook(bookId);
        if (res.success) {
            toast.success('✅ Đăng bán thành công! 🎉');
            setStep(1);
            setBookId(null);
        }
    };

    return (
        <div>
            {step === 1 && <StepCreateBook onNext={handleStep1} />}
            {step === 2 && (
                <StepImportStock bookId={bookId} onNext={handleStep2} />
            )}
            {step === 3 && <StepPublish onNext={handleStep3} />}
        </div>
    );
}
```

---

## 📈 BUSINESS LOGIC

### Tại sao 3 bước?

1. **Tách biệt metadata & inventory**:

    - Bước 1 giải phóng seller từ việc phải có sẵn tồn kho
    - Bước 2 đảm bảo inventory tracking chính xác

2. **Chất lượng dữ liệu**:

    - Yêu cầu `stock > 0` trước publish giảm sản phẩm "fake"
    - Yêu cầu seller verified tăng độ tin tưởng

3. **Audit trail**:

    - WarehouseLog ghi lại toàn bộ thao tác nhập/xuất
    - Tracking cho orders & cancellations

4. **Race condition prevention**:
    - MongoDB transactions trên Bước 2 chống double-booking
    - Atomicity đảm bảo consistency

---

## 🚀 DEPLOYMENT CHECKLIST

-   [ ] Migrate `bookModel` thêm `isPublished` field
-   [ ] Deploy `publishBook` endpoint
-   [ ] Update `getAllBooks` filter `isPublished = true`
-   [ ] Test Bước 1: Tạo sách (stock = 0)
-   [ ] Test Bước 2: Nhập kho (stock++ → Book.stock++)
-   [ ] Test Bước 3: Publish (yêu cầu stock > 0)
-   [ ] Test error cases (chưa verified, stock = 0)
-   [ ] Update frontend UI: Add "Publish" button after import
-   [ ] Update API documentation
-   [ ] Notify sellers about new workflow

---

## 📚 QUICK REFERENCE

| Endpoint                      | Method | Purpose             | Auth   |
| ----------------------------- | ------ | ------------------- | ------ |
| `/api/books`                  | POST   | Tạo sách (Bước 1)   | Seller |
| `/api/warehouse/import-stock` | POST   | Nhập kho (Bước 2)   | Seller |
| `/api/books/:id/publish`      | PATCH  | Đăng bán (Bước 3)   | Seller |
| `/api/books`                  | GET    | Lấy published books | Public |

---

**Document Version**: 1.0  
**Last Updated**: November 30, 2025  
**Status**: ✅ IMPLEMENTATION COMPLETE
