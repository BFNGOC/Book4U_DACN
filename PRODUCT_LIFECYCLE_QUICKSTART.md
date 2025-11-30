# 🚀 QUICK START - PRODUCT LIFECYCLE WORKFLOW

## Overview

The system implements a standardized 3-step product lifecycle for sellers:

```
CREATE (Draft) → IMPORT STOCK → PUBLISH (Live)
```

## Files Modified/Created

### Server-side (Already Implemented ✅)

-   `bookController.js` - `createBook()`, `publishBook()`
-   `warehouseController.js` - `importStock()`
-   `bookModel.js` - stock & isPublished fields
-   `warehouseStockModel.js` - Track stock per warehouse
-   `warehouseLogModel.js` - Audit trail

### Client-side (New/Modified)

-   ✅ `ProductModal.jsx` - Updated with 3 modes (create/edit/published)
-   ✅ `ImportStockModal.jsx` - NEW component for step 2
-   ✅ `SellerProductsManagement.jsx` - Updated workflow orchestration

## Step-by-Step Flow

### Step 1: Create Product (Draft)

```javascript
// UI: Click "Thêm sản phẩm" button
// Modal opens in mode='create'
// User fills:
  - Tên, Tác giả, Giá
  - Danh mục, Tags
  - Hình ảnh (10 max)
  - Mô tả, Format, Năm, Trang

// ⚠️ STOCK FIELD IS HIDDEN in create mode
// ⚠️ Cannot enter stock - will be 0

// Submit:
  POST /api/books
  → Returns: bookId, stock=0, isPublished=false
  → Toast: "✅ Tạo sản phẩm thành công! Bước tiếp: Nhập kho"
```

### Step 2: Import Stock

```javascript
// UI: Product appears in list with "📝 Draft" badge
// Click "📦 Upload" icon (purple button)
// ImportStockModal opens with:
  - Warehouse dropdown (loaded from seller's warehouses)
  - Quantity input
  - Reason textarea

// Fill & Submit:
  POST /api/warehouses/import-stock
  {
    bookId: "...",
    warehouseId: "...",
    quantity: 50,
    reason: "..."
  }

  → WarehouseStock created/updated
  → Book.stock += 50
  → WarehouseLog recorded
  → Toast: "✅ Nhập kho thành công!"
  → Product list refreshes, stock shows "50"
```

### Step 3: Publish/Go Live

```javascript
// UI: Product now has stock > 0
// "✈️ Publish" button becomes enabled (was disabled)
// Click to publish:
  PATCH /api/books/:id/publish

  Server checks:
  ✓ stock > 0?
  ✓ seller.isVerified?
  ✓ required fields complete?

  → isPublished = true
  → Product moves to "🟢 Đang bán" badge
  → Toast: "🎉 Đăng bán sản phẩm thành công!"
```

## Key Features

### ProductModal Modes

```javascript
// CREATE mode (Step 1)
<ProductModal mode="create" product={null} />
- Stock field: HIDDEN
- Header: "Tạo Sản Phẩm Mới"
- Button: "Tạo sản phẩm"

// EDIT mode (Draft)
<ProductModal mode="edit" product={draftProduct} />
- Stock field: VISIBLE (can edit before import)
- Header: "Cập Nhật Sản Phẩm (Draft)"
- Button: "Cập nhật"

// PUBLISHED mode (Live)
<ProductModal mode="published" product={liveProduct} />
- All fields: READ-ONLY
- Stock display only
- Header: "Thông Tin Sản Phẩm (Đang Bán)"
- New section: Toggle on/off selling
```

### ImportStockModal

```javascript
<ImportStockModal
    isOpen={true}
    product={draftProduct}
    warehouses={sellerWarehouses}
    onSuccess={handleRefresh}
/>
```

Features:

-   Warehouse selector
-   Quantity input with validation
-   Reason/note field
-   Transaction-based import (atomic)
-   Auto-refresh product list

### Product List Indicators

```javascript
// Draft Product
[Tên sách] 📝 Draft
- Buttons: Edit | Import | Publish (disabled if stock=0)

// Published Product
[Tên sách] 🟢 Đang bán
- Buttons: View | Status Toggle | Delete
```

## API Endpoints

### 1. Create Book

```
POST /api/books
Content-Type: multipart/form-data

Response: {
  success: true,
  data: { _id, title, stock: 0, isPublished: false, ... }
}
```

### 2. Import Stock (Transaction)

```
POST /api/warehouses/import-stock
Content-Type: application/json

Body: {
  bookId: "...",
  warehouseId: "...",
  quantity: 50,
  reason: "..."
}

Response: {
  success: true,
  data: {
    warehouseStock: { ... },
    log: { ... },
    bookStock: 50
  }
}
```

### 3. Publish Book

```
PATCH /api/books/:id/publish

Response: {
  success: true,
  message: "Đăng bán sách thành công! 🎉",
  data: { ..., isPublished: true }
}

Errors:
- stock === 0: "Tồn kho = 0. Phải nhập kho trước"
- seller not verified: "Chưa xác minh"
- missing fields: "Thiếu thông tin: ..."
```

## State Management

### SellerProductsManagement Component

```javascript
const [products, setProducts] = useState([]); // All seller products
const [warehouses, setWarehouses] = useState([]); // Seller warehouses
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingProduct, setEditingProduct] = useState(null);
const [modalMode, setModalMode] = useState('create'); // 'create'|'edit'|'published'
const [showImportModal, setShowImportModal] = useState(false);
const [importingProduct, setImportingProduct] = useState(null);

// Fetch both on mount
useEffect(() => {
    if (user?._id) {
        fetchProducts(); // Get all seller products
        fetchWarehouses(); // Get seller warehouses
    }
}, []);
```

## Handlers

```javascript
// Step 1: Create
handleCreateProduct(formData)
  → POST /api/books
  → fetchProducts() refresh
  → Show toast

// Step 2: Import
openImportModal(product)
  → setImportingProduct(product)
  → setShowImportModal(true)
  → User fills ImportStockModal
  → onSuccess() → fetchProducts()

// Step 3: Publish
handlePublishProduct(bookId)
  → PATCH /api/books/:id/publish
  → If error (stock=0, not verified), show toast
  → If success, fetchProducts() refresh
  → Show toast: "🎉 Đăng bán thành công!"
```

## Validation Rules

### Create Step

-   ✅ Title required
-   ✅ Author required
-   ✅ Price > 0
-   ✅ Category required
-   ✅ At least 1 image
-   ✅ At least 1 tag
-   ✅ Stock ALWAYS 0 (automatic)

### Import Step

-   ✅ Warehouse selected
-   ✅ Quantity > 0
-   ✅ Reason optional
-   ✅ Warehouse must belong to seller
-   ✅ Book must belong to seller

### Publish Step

-   ✅ Book.stock > 0 (must import first)
-   ✅ Seller.isVerified === true
-   ✅ All required fields filled
-   ✅ isPublished must be false (draft)

## Database Transactions

### Import Stock (Atomic)

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  1. Validate permissions
  2. Find/Create WarehouseStock
  3. Update WarehouseStock.quantity
  4. Update Book.stock (atomic increment)
  5. Create WarehouseLog entry

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
}
```

Ensures:

-   No race conditions
-   Stock always consistent
-   Complete audit trail
-   Rollback on any error

## Testing the Workflow

### Manual Test

```
1. Login as seller
2. Click "Thêm sản phẩm"
3. Fill form (stock field hidden) → Create
4. Verify: Product list shows "📝 Draft", stock=0
5. Click "📦" button → ImportStockModal
6. Select warehouse, enter quantity → Import
7. Verify: stock updated, Publish button enabled
8. Click "✈️" → Publish
9. Verify: "🟢 Đang bán" badge, appear in public store
```

### API Test (curl)

```bash
# Step 1: Create
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer TOKEN" \
  -F "title=Test Book" \
  -F "author=Test Author" \
  -F "price=100000" \
  -F "categoryId=507f1f77bcf86cd799439011" \
  -F "images=@book.jpg"

# Step 2: Import
curl -X POST http://localhost:3000/api/warehouses/import-stock \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "BOOK_ID",
    "warehouseId": "WAREHOUSE_ID",
    "quantity": 50
  }'

# Step 3: Publish
curl -X PATCH http://localhost:3000/api/books/BOOK_ID/publish \
  -H "Authorization: Bearer TOKEN"
```

## Common Issues & Fixes

### Issue: Publish button disabled but stock > 0

**Solution:** Check if `seller.isVerified === true` in database

### Issue: Import fails with "Warehouse not found"

**Solution:** Ensure warehouseId is from seller's own warehouses array

### Issue: Stock not updated after import

**Solution:** Check if transaction completed successfully in logs

### Issue: Duplicate WarehouseStock entries

**Solution:** Unique index ensures only 1 per (seller, book, warehouse) combo

## Performance Considerations

-   WarehouseStock has composite index for fast lookup
-   WarehouseLog only used for audit (not real-time)
-   Book.stock is denormalized (calculated from WarehouseStock)
-   Pagination: 10 products per page
-   Warehouses loaded once on component mount

## Security

All endpoints check:

-   JWT token validity
-   User owns the profile
-   Profile owns the warehouse/book
-   Role verification (seller only)

## UI/UX Flow Diagram

```
┌─────────────────────┐
│ SellerProducts Page │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │          │
      ↓          ↓
   ┌────┐    ┌────┐
   │NEW │    │LIST│
   └─┬──┘    └─┬──┘
     │         │
     ↓         ├→ Draft [Edit|Import|Publish]
  Create       │
     ↓         └→ Published [View|Status|Delete]
   Modal
     │
     ├─ Product created (stock=0, draft)
     │
     ↓
  Import
  Modal
     │
     ├─ Stock imported
     │
     ↓
  Publish
  Button
     │
     └─ Goes live (isPublished=true)
```

## Next Steps

1. ✅ Review & test the workflow
2. ✅ Verify all APIs working
3. ✅ Check UI responsiveness on mobile
4. ✅ Add analytics/logging if needed
5. ✅ Consider adding product templates
6. ✅ Bulk import feature (future)

---

**For full technical details, see:** `PRODUCT_LIFECYCLE_STANDARD.md`
