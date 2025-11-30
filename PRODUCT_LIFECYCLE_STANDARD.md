# HỆCHTỒNG CHUẨN THƯƠNG Mại ĐIỆN TỬ - QUY TRÌNH 3 BƯỚC

## 📋 TỔNG QUAN

Hệ thống bán sách được xây dựng theo quy trình chuẩn 3 bước để đảm bảo quản lý inventory chặt chẽ và trải nghiệm người dùng tốt:

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: TẠO SẢN PHẨM (DRAFT)                                │
│ • Nhập thông tin cơ bản: tên, tác giả, giá, hình ảnh, tags │
│ • Stock = 0, isPublished = false                             │
│ • Trả về bookId dùng cho bước 2                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: NHẬP KHO                                            │
│ • Chọn warehouse                                             │
│ • Nhập số lượng                                              │
│ • Cập nhật WarehouseStock (collection riêng)               │
│ • Tăng Book.stock (tổng tồn)                               │
│ • Ghi log: WarehouseLog (type=import)                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: ĐĂNG BÁN                                            │
│ • Kiểm tra: stock > 0 ✓, seller verified ✓                 │
│ • Thông tin đầy đủ ✓                                        │
│ • Set: isPublished = true                                   │
│ • Sản phẩm xuất hiện ở quầy bán                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ BƯỚC 1: TẠO SẢN PHẨM (DRAFT)

### API Endpoint

```
POST /api/books
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

### Request Body

```javascript
{
  title: "Cây Cam Ngố Ra Hoa",
  author: "Nguyễn Nhật Ánh",
  publisher: "NXB Kim Đồng",
  categoryId: "507f1f77bcf86cd799439011",
  price: 85000,
  discount: 0,
  description: "Một câu chuyện tình cảm...",
  numPages: 408,
  format: "bìa mềm",
  publicationYear: 2021,
  language: "Tiếng Việt",
  tags: ["Tiểu thuyết", "Lãng mạn", "Hiện đại"],
  images: [file1, file2, ...] // Multipart files
}
```

### Response

```javascript
{
  success: true,
  message: "Tạo sách (draft) thành công. Bước tiếp: Nhập kho → Đăng bán",
  data: {
    _id: "507f1f77bcf86cd799439012", // bookId for step 2
    title: "Cây Cam Ngố Ra Hoa",
    stock: 0,
    isPublished: false,
    ...
  }
}
```

### Điều Kiện

-   ✅ Tất cả field bắt buộc phải có
-   ✅ CategoryId phải tồn tại
-   ✅ Seller phải có profile
-   ✅ Stock **luôn = 0** ở stage này
-   ✅ isPublished **luôn = false**

### Ghi Chú

-   Không cho người dùng nhập stock ở bước này
-   ProductModal render với mode='create' - ẩn field stock
-   Hình ảnh được upload lên `/uploads/books/`

---

## 2️⃣ BƯỚC 2: NHẬP KHO (WAREHOUSE IMPORT)

### API Endpoint

```
POST /api/warehouses/import-stock
Content-Type: application/json
Authorization: Bearer {token}
```

### Request Body

```javascript
{
  bookId: "507f1f77bcf86cd799439012",      // Từ bước 1
  warehouseId: "507f191e810c19729de860ea", // Từ seller.warehouses
  quantity: 50,
  reason: "Nhập kho sản phẩm mới"
}
```

### Response

```javascript
{
  success: true,
  message: "Nhập kho thành công",
  data: {
    warehouseStock: {
      sellerId: "...",
      bookId: "507f1f77bcf86cd799439012",
      warehouseId: "507f191e810c19729de860ea",
      quantity: 50,
      quantityBefore: 0,
      quantityAfter: 50
    },
    log: {
      type: "import",
      quantity: 50,
      quantityBefore: 0,
      quantityAfter: 50
    },
    bookStock: 50  // Book.stock được tăng
  }
}
```

### Server Side Changes

1. **WarehouseStock** được tạo/cập nhật

    - Unique index: `(sellerId, bookId, warehouseId)`
    - Quantity = cộng dồn

2. **Book.stock** được tăng atomically

    - Stock = ∑ tất cả WarehouseStock[bookId].quantity

3. **WarehouseLog** được ghi
    ```javascript
    {
      type: "import",
      quantity: 50,
      quantityBefore: 0,
      quantityAfter: 50,
      performedBy: userId,
      status: "success"
    }
    ```

### Kiểm Tra Hợp Lệ

-   ✅ Warehouse phải thuộc seller
-   ✅ Book phải thuộc seller
-   ✅ Quantity > 0
-   ✅ Transaction atomicity

### UI: ImportStockModal

-   Dropdown chọn warehouse
-   Input quantity
-   Textarea ghi chú (optional)
-   Button "Nhập Kho"
-   Toast success/error

---

## 3️⃣ BƯỚC 3: ĐĂNG BÁN (PUBLISH)

### API Endpoint

```
PATCH /api/books/:id/publish
Authorization: Bearer {token}
```

### Validation Requirements

```javascript
// Điều kiện MUST
1. book.stock > 0  // Phải nhập kho trước
   if (!book.stock) return "Tồn kho = 0. Phải nhập kho trước"

2. profile.isVerified === true  // Seller phải xác minh
   if (!profile.isVerified) return "Seller chưa xác minh"

3. Thông tin đầy đủ: title, author, price, categoryId
   if (missingFields) return `Thiếu: ${fields.join(', ')}`

4. book.isPublished === false  // Chỉ publish draft
   if (book.isPublished) return "Sản phẩm đã được đăng bán"
```

### Response

```javascript
{
  success: true,
  message: "Đăng bán sách thành công! 🎉",
  data: {
    _id: "507f1f77bcf86cd799439012",
    title: "Cây Cam Ngố Ra Hoa",
    stock: 50,
    isPublished: true,  // ← Thay đổi
    ...
  }
}
```

### UI: ProductModal (mode='published')

-   Hiển thị read-only mode
-   Thông tin sản phẩm (không chỉnh sửa)
-   **Thêm section: Trạng thái bán**
    -   Toggle: "Đang bán" / "Dừng bán"
    -   Hiển thị tổng tồn kho
    -   Cảnh báo nếu stock = 0 khi toggle "Bán"

---

## 🔄 MỐI QUAN HỆ DỮ LIỆU

### Book Model

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref Profile),
  title: String,
  price: Number,
  stock: Number,           // ← Tổng tồn (∑ WarehouseStock)
  isPublished: Boolean,    // ← false (draft) / true (published)
  images: [String],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### WarehouseStock Model

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref Profile),
  bookId: ObjectId (ref Book),
  warehouseId: ObjectId,   // ← ID từ Profile.warehouses[].\_id
  warehouseName: String,   // ← Cache tên kho
  quantity: Number,        // ← Tồn tại warehouse này
  soldCount: Number,       // ← Snapshot
  lastUpdatedStock: Date,
  createdAt: Date,
  updatedAt: Date
}
// Unique Index: (sellerId, bookId, warehouseId)
```

### WarehouseLog Model

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref Profile),
  bookId: ObjectId (ref Book),
  warehouseId: ObjectId,
  type: String,            // 'import', 'export', 'order_create', ...
  quantity: Number,        // Số lượng thay đổi
  quantityBefore: Number,  // Tồn kho trước
  quantityAfter: Number,   // Tồn kho sau
  reason: String,
  performedBy: ObjectId (ref User),
  status: String,          // 'success', 'failed'
  createdAt: Date
}
```

### Profile Model (Seller)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref User),
  warehouses: [
    {
      _id: ObjectId,
      name: String,
      detail: String,      // Địa chỉ chi tiết
      district: String,
      province: String,
      managerName: String,
      managerPhone: String,
      ...
    }
  ],
  isVerified: Boolean,     // ← Kiểm tra ở bước 3
  createdAt: Date
}
```

---

## 💾 DATABASE OPERATIONS FLOW

### Bước 1: Create Book

```javascript
1. Validate input
2. Check categoryId exists
3. Check seller profile exists
4. Create Book {
     sellerId: profile._id,
     stock: 0,
     isPublished: false,
     ...
   }
5. Return bookId
```

### Bước 2: Import Stock (TRANSACTION)

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  1. Validate warehouseId belongs to seller
  2. Validate bookId belongs to seller

  3. Find or create WarehouseStock {
       sellerId, bookId, warehouseId
     }

  4. Update quantity:
     WarehouseStock.quantity += importQty

  5. Update Book.stock:
     Book.stock += importQty

  6. Create WarehouseLog {
       type: "import",
       quantity: importQty,
       quantityBefore: oldQty,
       quantityAfter: newQty
     }

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
}
```

### Bước 3: Publish Book

```javascript
1. Fetch book
2. Check ownership (book.sellerId == req.user's profile._id)
3. Validate:
   - book.stock > 0
   - seller.isVerified === true
   - All required fields present
4. Update: book.isPublished = true
5. Return success
```

---

## 🎨 UI/UX COMPONENTS

### ProductModal States

```javascript
// Create mode (Bước 1)
<ProductModal mode="create" product={null} onSubmit={handleCreate} />
// - Ẩn field: stock
// - Header: "Tạo Sản Phẩm Mới"
// - Button: "Tạo sản phẩm"
// - Ghi chú: "Stock sẽ được cập nhật ở bước 2"

// Edit mode (Draft)
<ProductModal mode="edit" product={draftProduct} onSubmit={handleEdit} />
// - Hiện field: stock (nhưng disable nếu có import)
// - Header: "Cập Nhật Sản Phẩm (Draft)"
// - Button: "Cập nhật"

// Published mode (Read-only)
<ProductModal mode="published" product={publishedProduct} onSubmit={null} />
// - Tất cả input disable
// - Header: "Thông Tin Sản Phẩm (Đang Bán)"
// - Section riêng: Trạng thái bán + toggle
// - Button: chỉ "Đóng"
```

### ImportStockModal

```javascript
<ImportStockModal
    isOpen={true}
    product={draftProduct} // Phải là draft
    warehouses={sellerWarehouses}
    onSuccess={handleRefresh}
/>
```

### Product List Actions

```javascript
// Draft Status
- Edit (icon: ✏️)          → ProductModal mode='edit'
- Import (icon: 📦)        → ImportStockModal
- Publish (icon: ✈️)       → Call API + refresh
  - Disabled if stock === 0 + tooltip

// Published Status
- View (icon: 👁️)          → ProductModal mode='published'
- Status (icon: ✈️)        → Toggle published state
- Delete (icon: 🗑️)        → Confirm delete
```

---

## ⚠️ EDGE CASES & VALIDATION

### Create Phase

```
❌ Missing required fields → 400 error
❌ Invalid categoryId → 400 error
❌ No seller profile → 400 error
✅ Multiple images → Accept up to 10
✅ Tags (0 or more) → Accept
```

### Import Phase

```
❌ Warehouse không thuộc seller → Error
❌ Book không thuộc seller → Error
❌ Quantity <= 0 → Error
❌ Concurrent imports (race condition) → Transaction handles
✅ Multiple imports same book, diff warehouse → Allowed
✅ Zero quantity import → Error
```

### Publish Phase

```
❌ stock === 0 → Error + message "Phải nhập kho trước"
❌ seller.isVerified === false → Error + message "Chưa xác minh"
❌ Missing required fields → Error + list fields
❌ Already published → Silent skip or error?
✅ Valid draft with stock > 0 → Publish immediately
✅ Re-publish failed product → Check all conditions again
```

### Stock Management

```
• Import: stock luôn tăng
• Export: stock luôn giảm (không được âm)
• Order create: stock giảm tự động
• Order cancel: stock tăng lại
• Destroy/Damage: stock giảm
• Adjustment: manual ±
```

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────┐
│   Seller Login  │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│ SellerProductsManagement │
├──────────────────────────┤
│ - fetchProducts()        │
│ - fetchWarehouses()      │
│ - State management       │
└────┬──────────────────────┘
     │
     ├─→ ProductModal (mode='create')
     │   │
     │   ├─ Input form fields
     │   ├─ handleSubmit()
     │   └─ POST /api/books
     │      └─ Return: bookId, stock=0, isPublished=false
     │
     ├─→ ProductModal (mode='edit')
     │   │
     │   ├─ Pre-fill form
     │   ├─ handleSubmit()
     │   └─ PUT /api/books/:id
     │
     ├─→ ImportStockModal
     │   │
     │   ├─ Warehouse selector
     │   ├─ Quantity input
     │   ├─ handleSubmit()
     │   └─ POST /api/warehouses/import-stock
     │      ├─ Update WarehouseStock
     │      ├─ Update Book.stock
     │      └─ Create WarehouseLog
     │
     └─→ PublishButton
         │
         ├─ Check: stock > 0? ✓
         ├─ Check: seller.verified? ✓
         ├─ PATCH /api/books/:id/publish
         └─ Set: isPublished = true

┌──────────────────────────────┐
│ Database (MongoDB)           │
├──────────────────────────────┤
│ • Book                       │
│ • WarehouseStock             │
│ • WarehouseLog               │
│ • Profile (seller)           │
│ • Category                   │
└──────────────────────────────┘
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests

-   [ ] Create book with all required fields
-   [ ] Create book missing required field → 400
-   [ ] Import stock valid case
-   [ ] Import stock invalid warehouse → 400
-   [ ] Import stock invalid book → 400
-   [ ] Publish valid book → success
-   [ ] Publish book stock=0 → error
-   [ ] Publish unverified seller → error

### Integration Tests

-   [ ] Full flow: Create → Import → Publish
-   [ ] Create multiple products
-   [ ] Import to multiple warehouses
-   [ ] Verify stock calculation (∑ all warehouses)
-   [ ] Verify WarehouseLog entries

### UI Tests

-   [ ] ProductModal create mode renders correctly
-   [ ] Stock field hidden in create mode
-   [ ] ImportStockModal warehouse dropdown populated
-   [ ] Publish button disabled when stock=0
-   [ ] Draft badge shown on list
-   [ ] Tooltips display correctly

---

## 📝 IMPLEMENTATION NOTES

### Server Implementation Status

-   ✅ `createBook` - POST /api/books (creates draft with stock=0)
-   ✅ `updateBook` - PUT /api/books/:id
-   ✅ `publishBook` - PATCH /api/books/:id/publish (with validations)
-   ✅ `importStock` - POST /api/warehouses/import-stock (with transactions)
-   ✅ WarehouseStock & WarehouseLog models

### Client Implementation Status

-   ✅ `ProductModal` - 3 modes: create, edit, published
-   ✅ `ImportStockModal` - Step 2 UI
-   ✅ `SellerProductsManagement` - Workflow orchestration
-   ✅ Action buttons based on product status
-   ✅ Toast notifications

### Remaining Tasks

-   [ ] Test complete workflow end-to-end
-   [ ] Handle edge cases (concurrent requests)
-   [ ] Add loading states
-   [ ] Error boundary components
-   [ ] Analytics tracking
-   [ ] Seller verification endpoint (if not exists)

---

## 🔐 SECURITY

```javascript
// All endpoints require:
- Authentication (JWT token)
- Authorization (seller owns resource)
- Input validation
- Rate limiting (recommended)

// Data access:
- Sellers see only their own products
- Can't import to others' warehouses
- Can't publish others' products
```

---

## 📱 MOBILE RESPONSIVENESS

All components are responsive:

-   ProductModal: Full width on mobile
-   ImportStockModal: Fixed width with padding
-   Product list: Stack vertically on mobile
-   Action buttons: Flex column on small screens

---

## 🌍 LOCALIZATION

Current: Vietnamese only

-   Toast messages: Vietnamese
-   Labels & placeholders: Vietnamese
-   Status badges: Vietnamese with emojis

---

**Document Version:** 1.0
**Last Updated:** 2024
**Status:** Complete & Ready for Testing
