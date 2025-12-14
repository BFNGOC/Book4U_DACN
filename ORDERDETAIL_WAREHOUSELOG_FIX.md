# ✅ OrderDetail WarehouseLog Validation Fix

## 🎯 Problem

The `orderDetailSellerController.js` was creating WarehouseLog entries with incorrect field names, causing validation errors:

```json
{
    "success": false,
    "message": "WarehouseLog validation failed: performedBy: Path `performedBy` is required., quantityAfter: Path `quantityAfter` is required., quantityBefore: Path `quantityBefore` is required., quantity: Path `quantity` is required., type: Path `type` is required."
}
```

### Root Cause

The controller was using **wrong field names and structure**:

-   `transactionType` instead of `type`
-   `quantityChange` instead of `quantity`, `quantityBefore`, `quantityAfter`
-   Missing required fields: `performedBy`, `quantity`, `quantityBefore`, `quantityAfter`

## 🔧 Solution Applied

Applied the **same proper pattern** from `orderManagementController.js` confirmOrder method.

### 1. Fixed `confirmOrderDetail` (Lines 290-327)

**Before:**

```javascript
await WarehouseLog.create(
    [
        {
            warehouseId: item.warehouseId,
            bookId,
            transactionType: 'order_confirmed', // ❌ WRONG
            quantityChange: -quantity, // ❌ WRONG
            orderId: orderDetail.mainOrderId,
            orderDetailId: orderDetail._id,
            sellerId: seller._id,
        },
    ],
    { session }
);
```

**After:**

```javascript
const quantityBefore = updatedStock.quantity + quantity;
const quantityAfter = updatedStock.quantity;

const log = new WarehouseLog({
    sellerId: seller._id,
    bookId,
    warehouseId: item.warehouseId,
    warehouseName,
    type: 'order_create', // ✅ CORRECT
    quantity, // ✅ CORRECT
    quantityBefore, // ✅ CORRECT
    quantityAfter, // ✅ CORRECT
    orderId: orderDetail.mainOrderId,
    reason: `Order confirm ${orderDetail.mainOrderId}`,
    performedBy: userId, // ✅ CORRECT
    status: 'success',
});

await log.save({ session });
```

### 2. Fixed `cancelOrderDetail` (Lines 511-566)

**Before:**

```javascript
// ❌ Using wrong WarehouseLog structure
await WarehouseLog.create(
    [
        {
            warehouseId: item.warehouseId,
            bookId: item.bookId,
            transactionType: 'order_cancelled', // ❌ WRONG
            quantityChange: item.quantity, // ❌ WRONG
            orderId: orderDetail.mainOrderId,
            orderDetailId: orderDetail._id,
            sellerId: seller._id,
        },
    ],
    { session }
);
```

**After:**

```javascript
// ✅ Using proper WarehouseLog structure
const cancelLog = new WarehouseLog({
    sellerId: seller._id,
    bookId,
    warehouseId,
    warehouseName: warehouseStock?.warehouseName || '',
    type: 'order_cancel', // ✅ CORRECT
    quantity, // ✅ CORRECT
    quantityBefore: warehouseStock?.quantity || 0,
    quantityAfter: (warehouseStock?.quantity || 0) + quantity,
    orderId: orderDetail.mainOrderId,
    reason: reason || `Cancel OrderDetail ${orderDetail._id}`,
    performedBy: userId, // ✅ CORRECT
    status: 'success',
});

await cancelLog.save({ session });
```

## 📋 WarehouseLog Schema Requirements

All these fields are **required** by the schema:

| Field            | Type        | Description                                                          |
| ---------------- | ----------- | -------------------------------------------------------------------- |
| `sellerId`       | ObjectId    | ID của seller                                                        |
| `bookId`         | ObjectId    | ID của sách                                                          |
| `warehouseId`    | ObjectId    | ID của kho                                                           |
| `warehouseName`  | String      | Tên kho (cache)                                                      |
| `type`           | String enum | Loại giao dịch: `'order_create'`, `'order_cancel'`, `'import'`, etc. |
| `quantity`       | Number      | Số lượng thay đổi (luôn dương)                                       |
| `quantityBefore` | Number      | Tồn kho TRƯỚC giao dịch                                              |
| `quantityAfter`  | Number      | Tồn kho SAU giao dịch                                                |
| `orderId`        | ObjectId    | Tham chiếu đến đơn hàng (optional)                                   |
| `reason`         | String      | Lý do/ghi chú (optional)                                             |
| `performedBy`    | ObjectId    | Người thực hiện                                                      |
| `status`         | String enum | Trạng thái: `'success'`, `'failed'`, `'reversed'`                    |

## ✅ Benefits

1. **Consistency**: Both `orderManagementController` và `orderDetailSellerController` now use the same WarehouseLog structure
2. **Validation**: All required fields are properly provided
3. **Auditability**: Complete warehouse transaction history with `quantityBefore` và `quantityAfter`
4. **Traceability**: `performedBy` field tracks who performed the action
5. **Flexibility**: Supports multiple transaction types with enum validation

## 🧪 Testing

To verify the fix:

```bash
# Start the server
npm start

# Test confirm OrderDetail
POST /api/orders/seller/details/:orderDetailId/confirm
{
  "customerLocation": {
    "latitude": 10.7769,
    "longitude": 106.7009,
    "address": "TP. Hồ Chí Minh"
  }
}

# Test cancel OrderDetail
POST /api/orders/seller/details/:orderDetailId/cancel
{
  "reason": "Test cancel"
}
```

Both should now return `success: true` without WarehouseLog validation errors.

## 📝 Files Changed

-   [orderDetailSellerController.js](src/controllers/orderDetailSellerController.js)
    -   `confirmOrderDetail()` - Lines 154-361
    -   `cancelOrderDetail()` - Lines 481-599

---

**Status**: ✅ Complete  
**Date**: 2025-12-14
