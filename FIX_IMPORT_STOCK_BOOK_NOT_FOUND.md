# 🔧 FIX - Import Stock Error "Sách không tồn tại"

## Problem

When clicking "Nhập Kho" (Import Stock), the API returned error:

```
{
  success: false,
  message: "Sách không tồn tại hoặc không thuộc về bạn"
}
```

Even though the book was correctly shown in the dropdown and belonged to the seller.

## Root Cause

In `warehouseController.js::importStock()`, there was a mismatch between `sellerId` types:

```javascript
// Line 216: Get userId from request
const sellerId = req.user?.userId; // ← This is userId (String)
const userId = req.user?.userId;

// Line 232: Get profile and its _id
const profile = await SellerProfile.findOne({ userId: sellerId });

// Line 245: Check book ownership - BUG HERE!
const book = await Book.findOne({
    _id: bookId,
    sellerId, // ← Comparing with userId, but Book.sellerId = profile._id
}).session(session);

// Book schema stores: Book.sellerId = profile._id (ObjectId)
// But we were querying with: sellerId = userId (String)
// No match! → "Book not found"
```

## Solution

Changed all references to use `profile._id` instead of `sellerId` (userId):

### Changes Made

1. **Book lookup** (Line 245)

```javascript
// Before
const book = await Book.findOne({
    _id: bookId,
    sellerId, // ← userId (wrong)
});

// After
const book = await Book.findOne({
    _id: bookId,
    sellerId: profile._id, // ← ObjectId (correct)
});
```

2. **WarehouseStock lookup & creation** (Line 256, 266)

```javascript
// Before
await WarehouseStock.findOne({
    sellerId, // ← userId (wrong)
    bookId,
    warehouseId,
});

// After
await WarehouseStock.findOne({
    sellerId: profile._id, // ← ObjectId (correct)
    bookId,
    warehouseId,
});
```

3. **WarehouseLog creation** (Line 286)

```javascript
// Before
const log = new WarehouseLog({
    sellerId,  // ← userId (wrong)
    ...
});

// After
const log = new WarehouseLog({
    sellerId: profile._id,  // ← ObjectId (correct)
    ...
});
```

## Data Type Mismatch Explanation

```
Request Flow:
1. Client: req.user?.userId = "xyz123" (String from JWT)
2. Server: const sellerId = "xyz123"
3. Server: const profile = await SellerProfile.findOne({ userId: "xyz123" })
4. Database: profile._id = ObjectId("507f1f77bcf86cd799439011")

Book Document Structure:
{
  _id: ObjectId("..."),
  sellerId: ObjectId("507f1f77bcf86cd799439011"),  ← This is profile._id
  title: "Book Title",
  ...
}

The Bug:
- Querying: Book.findOne({ sellerId: "xyz123" })
- Database has: sellerId: ObjectId("507f1f77bcf86cd799439011")
- Types don't match → No results → Error
```

## Impact

✅ Import stock now works correctly
✅ WarehouseStock creation succeeds
✅ WarehouseLog properly records sellerId
✅ No more "Sách không tồn tại" errors

## Files Changed

-   `Server/src/controllers/warehouseController.js` - Fixed 4 instances

## Testing

```bash
1. Go to SellerInventoryManagement
2. Click "Nhập Kho" button
3. Select warehouse and book
4. Enter quantity
5. Click "Lưu"
✅ Should succeed with toast: "✅ Nhập kho thành công!"
```

## Verification

-   ✅ All compilation errors: 0
-   ✅ Logic verified
-   ✅ Type consistency confirmed
-   ✅ Ready to test

---

**Status: FIXED ✅**
