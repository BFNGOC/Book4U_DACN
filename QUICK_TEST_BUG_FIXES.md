# 🧪 Quick Test Guide - Bug Fixes

**After applying these 3 bug fixes, test with:**

---

## ✅ Test 1: Basic Order Confirmation

```
1. Create order for 5 items from Quận 3
2. Seller confirms order
3. Check response:
   ✅ success: true
   ✅ data.status: "confirmed"
   ✅ data.warehouseId: ObjectId (NOT null!)
   ✅ data.warehouseName: "Kho TP.HCM Quận 1"

4. Database check:
   db.orders.findOne({_id: ObjectId("...")})
   ✅ warehouseId exists
   ✅ warehouseName exists
```

---

## ✅ Test 2: Stock Deduction is Atomic

```
1. Warehouse A has 100 units of Book X
2. Seller confirms order for 20 units
3. Check database:
   db.warehousestocks.findOne({bookId: X, warehouseId: A})
   ✅ quantity: 80 (reduced from 100)

4. Book total stock:
   db.books.findOne({_id: X})
   ✅ stock: 80
```

---

## ✅ Test 3: Fallback Warehouse Works

```
1. Warehouse A: 5 units (nearest, Quận 1)
2. Warehouse B: 50 units (farther, Quận 7)
3. Customer orders 10 units (from Quận 3)
4. Seller confirms

Expected:
✅ Primary warehouse A fails (only 5 units)
✅ Fallback to warehouse B succeeds
✅ warehouseId points to B
✅ Stock deducted from B
```

Check logs:

```
⚠️ Primary warehouse failed, trying fallbacks...
   Trying fallback: Kho TP.HCM Quận 7
   ✅ Fallback succeeded: Kho TP.HCM Quận 7
```

---

## ✅ Test 4: Geocoding with Different Locations

```
Test various customer addresses:
- "Quận 1, TP.HCM" → Should select Quận 1 warehouse
- "Quận 7, TP.HCM" → Should select Quận 7 warehouse
- "Hà Nội" → Geocoded to Hà Nội coords
- "Đà Nẵng" → Geocoded to Đà Nẵng coords

Each should select the NEAREST warehouse correctly.
```

---

## ✅ Test 5: Multiple Items/Sellers

```
1. Order with items from 2 sellers:
   - Seller A sells Book X (at Quận 1 warehouse)
   - Seller B sells Book Y (at Quận 7 warehouse)

2. Confirm order
3. Check:
   ✅ order.warehouseId: points to first item's warehouse
   ✅ Both items get deducted correctly
   ✅ Logs show both warehouses processed
```

---

## ✅ Test 6: No False "Stock Not Enough" Errors

```
Before fix:
- Error: "Kho Kho hàng A không đủ stock" even though it HAS stock

After fix:
✅ Only error if warehouse ACTUALLY doesn't have stock
✅ Fallback warehouses work
✅ Atomic operation prevents race conditions
```

---

## 🔍 Server Console Logs to Watch

After fix, should see:

```
📡 Geocoding customer address: "Quận 3, TP.HCM"
✅ Geocoded to: TP. Hồ Chí Minh (10.7933, 106.6931)
📍 Selected Kho TP.HCM Quận 1 (2.4 km away)
   Fallbacks: Kho TP.HCM Quận 7 (5.2 km away)
✓ Stock deducted: -20 items from Kho TP.HCM Quận 1
✓ Confirm order successful
```

---

## ❌ Errors That Should NO LONGER Appear

### Before Fix

```json
{
    "success": false,
    "message": "Kho Kho hàng A không đủ stock cho 692c5001a45ffbe889f4f30c. Có người khác vừa mua hàng.",
    "type": "error"
}
```

### After Fix

✅ Should see `warehouseId` in response
✅ Only error if warehouse TRULY insufficient  
✅ Fallback works instead of erroring

---

## 📊 Database Verification Commands

```javascript
// Verify warehouseId saved
db.orders.findOne(
    { status: 'confirmed' },
    { warehouseId: 1, warehouseName: 1 }
);
// Must have: warehouseId: ObjectId(...), warehouseName: String

// Verify stock deducted
db.warehousestocks.findOne({ bookId: ObjectId('...') });
// quantity should match what was ordered

// Verify WarehouseLog created
db.warehouselogs.findOne({ type: 'order_create' });
// Should show: quantity deducted, reason, timestamp
```

---

## ✅ Checklist

After deploying fixes, verify:

-   [ ] Order confirmation succeeds (no false errors)
-   [ ] warehouseId is saved in database
-   [ ] Stock is deducted correctly
-   [ ] Fallback warehouses work
-   [ ] Geocoding works with different addresses
-   [ ] Multiple items handled correctly
-   [ ] No race conditions (test concurrent orders)
-   [ ] Server logs show proper flow

---

## 🚀 If All Tests Pass

Your auto warehouse selection system is now working correctly!

Next: Monitor production for any edge cases.
