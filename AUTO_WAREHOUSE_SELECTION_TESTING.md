# Quick Testing Guide - Auto Warehouse Selection

## 🚀 Quick Start Testing

### Prerequisites

-   Server running on `http://localhost:5000`
-   MongoDB connected
-   Client running on `http://localhost:5173`
-   Seller account created with at least 1 warehouse
-   Books added with proper stock

---

## Test 1: Auto-Geocoding Warehouse Address

### Step 1: Create/Update Warehouse

1. Go to **Seller Dashboard** → **Manage Warehouses**
2. Create new warehouse with address:
    ```
    Name: Kho TP.HCM Quận 1
    Address: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM
    Manager: Nguyễn Văn A
    Phone: 0912345678
    ```
3. Submit form

### Step 2: Verify Geocoding

-   Check server console → should see logs like:
    ```
    📍 Geocoding warehouse address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM, Vietnam"
    ✅ Warehouse geocoded: TP. Hồ Chí Minh (10.7758, 106.7019)
    ```
-   Warehouse should have location coordinates

### Step 3: Check Database (Optional)

```javascript
// In MongoDB compass or mongosh
db.profiles.findOne(
    { profileType: 'seller' },
    { 'warehouses.location': 1 }
);

// Should show:
{
    "warehouses": [
        {
            "_id": ObjectId("..."),
            "name": "Kho TP.HCM Quận 1",
            "location": {
                "latitude": 10.7758,
                "longitude": 106.7019,
                "address": "TP. Hồ Chí Minh",
                "accuracy": "city",
                "geocodedAt": ISODate("...")
            }
        }
    ]
}
```

---

## Test 2: Multiple Warehouses + Distance Selection

### Setup: Create 3 Warehouses

```
Warehouse 1 (Quận 1):
- Location: Quận 1, TP.HCM
- Stock: 100 units of each book

Warehouse 2 (Hà Nội):
- Location: Hà Nội
- Stock: 50 units

Warehouse 3 (Quận 7):
- Location: Quận 7, TP.HCM
- Stock: 30 units
```

### Test Case: Order from Quận 3 → Should Select Quận 1

1. **Customer Checkout:**

    - Add books to cart
    - Go to checkout
    - Enter delivery address: **"123 Nguyễn Thái Học, Quận 3, TP.HCM"**
    - Complete checkout → Order created with status=pending

2. **Seller Confirms:**

    - Go to **Seller Confirmation** page
    - Click "Confirm" button on pending order
    - Server will:
        - Geocode customer address (Quận 3 → 10.7933, 106.6931)
        - Calculate distances:
            - Quận 1: ~2.4 km
            - Quận 7: ~5.2 km
            - Hà Nội: ~1700 km
        - Select **Quận 1** (nearest with stock)

3. **Verify:**
    - UI should show: ✅ "Xác nhận thành công. Kho: Kho TP.HCM Quận 1"
    - Check server logs:
        ```
        📡 Geocoding customer address: "123 Nguyễn Thái Học, Quận 3, TP.HCM"
        ✅ Geocoded to: TP. Hồ Chí Minh (10.7933, 106.6931)
        📍 Selected Kho TP.HCM Quận 1 (2.4 km away)
        ```

---

## Test 3: Fallback Warehouse Selection

### Setup: Test Insufficient Stock Scenario

1. **Create 2 Warehouses:**

    - Warehouse A (Quận 1): 5 units
    - Warehouse B (Quận 7): 50 units

2. **Order 10 Items:**

    - Customer orders 10 units from Quận 3
    - Should select Warehouse B (Quận 7) because A doesn't have enough

3. **Verify:**
    - Server logs should show:
        ```
        ⚠️ Primary warehouse failed, trying fallbacks...
           Trying fallback: Kho TP.HCM Quận 7
           ✅ Fallback succeeded: Kho TP.HCM Quận 7
        ```

---

## Test 4: Stock Deduction (Atomic Operation)

### Verify No Race Conditions

1. **Setup:**

    - Warehouse with exactly 10 units
    - 2 concurrent orders for 5 units each

2. **Execute:**

    - Open 2 browser tabs
    - Both tabs create order for 5 units
    - Both tabs seller-confirm simultaneously

3. **Expected:**
    - ✅ Order 1: Confirmed, stock deducted (5 units left)
    - ✅ Order 2: FAILED - "Không có kho nào có đủ tồn kho" (fallback also insufficient)
    - ✅ Book.stock = 5 (exactly)
    - ✅ WarehouseStock.quantity = 5 (exactly)
    - No duplication or race condition

---

## Test 5: Address Format Variations

### Test Various Address Formats

1. **Short format:**

    ```
    "Q1, HCM" → Should geocode to TP.HCM
    ```

2. **Long format:**

    ```
    "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh, Việt Nam"
    → Should geocode correctly
    ```

3. **Different cities:**

    ```
    "Hà Nội" → 21.0285, 105.8542
    "Đà Nẵng" → 16.0544, 108.2022
    "Hải Phòng" → 20.8449, 106.6881
    "Cần Thơ" → 10.0379, 105.7869
    ```

4. **Check logs:**
    - Offline lookup (fast): "✅ Found offline"
    - API lookup (slower): "✅ Found via Nominatim"
    - Fallback: "⚠️ Could not geocode, using default HCM location"

---

## Test 6: Order Workflow

### Full Order Lifecycle

1. **Customer Checkout:**

    ```
    POST /api/orders/create
    {
        "profileId": "...",
        "items": [...],
        "shippingAddress": {
            "fullName": "Nguyễn Văn A",
            "phone": "0912345678",
            "address": "123 Nguyễn Thái Học, Quận 3, TP.HCM"
        },
        "customerLocation": {
            "address": "123 Nguyễn Thái Học, Quận 3, TP.HCM"
        }
    }

    Response: { status: 'pending', _id: '...' }
    ```

2. **Seller Confirms:**

    ```
    POST /api/orders/{orderId}/confirm
    {
        "customerLocation": {
            "address": "123 Nguyễn Thái Học, Quận 3, TP.HCM"
        }
    }

    Response: {
        status: 'confirmed',
        warehouseId: '...',
        warehouseName: 'Kho TP.HCM Quận 1'
    }
    ```

3. **Verify Stock:**

    ```
    GET /api/books/{bookId}

    Response: { stock: 95 }  // Decreased from 100
    ```

---

## 🔍 Server Console Logs to Watch

### Healthy Logs

```
📡 Geocoding customer address: "..."
✅ Geocoded to: "..." (lat, lon)
📍 Selected Kho... (X.X km away)
Fallbacks: [...] (sorted by distance)
✅ Fallback succeeded: Kho...
✓ Stock deducted successfully
```

### Error Logs (to fix)

```
❌ Geocoding error: ...
⚠️ Could not geocode, using default HCM location
❌ Không có kho nào có đủ tồn kho
❌ Kho ... không đủ stock (có người khác vừa mua hàng)
```

---

## 📊 Manual Verification (Postman/cURL)

### Test Geocoding Service Directly

```bash
# Get warehouse with location
curl -X GET http://localhost:5000/api/warehouses \
  -H "Authorization: Bearer {token}"

# Expected response includes:
# "location": {
#   "latitude": 10.7758,
#   "longitude": 106.7019,
#   "address": "TP. Hồ Chí Minh",
#   "accuracy": "city"
# }
```

### Test Order Confirmation

```bash
curl -X POST http://localhost:5000/api/orders/{orderId}/confirm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerLocation": {
      "address": "Quận 1, TP.HCM"
    }
  }'

# Expected response:
# "warehouseId": "...",
# "warehouseName": "Kho TP.HCM Quận 1"
```

---

## ✅ Success Criteria

-   [ ] Warehouses auto-geocode when created/updated
-   [ ] Multiple warehouses show in list with coordinates
-   [ ] Customer orders geocode correctly
-   [ ] Nearest warehouse selected (check distances in logs)
-   [ ] Stock deducted atomically (no race conditions)
-   [ ] Fallback warehouse selection works
-   [ ] Various address formats handled
-   [ ] UI shows selected warehouse after confirmation
-   [ ] Order status progresses: pending → confirmed → picking → ...

---

## 🐛 Debugging Tips

1. **Enable server logging:**

    ```javascript
    // In terminal
    tail -f server.log  // or check console output
    ```

2. **Check database state:**

    ```javascript
    // MongoDB compass
    db.orders.findOne({ _id: ObjectId('...') }, { warehouseId: 1, status: 1 });
    db.warehouseStocks.findOne({ bookId: ObjectId('...') });
    ```

3. **Check API responses:**

    - Open DevTools (F12)
    - Network tab
    - Check request/response for confirmOrder endpoint

4. **Common issues:**
    - ❌ warehouseId is null → warehouse selection failed
    - ❌ Stock not decremented → atomic operation failed
    - ❌ Wrong warehouse selected → geocoding incorrect
    - ❌ Order stuck in pending → confirm endpoint failed

---

## 📝 Test Report Template

```
Test Date: ____
Tester: ____

TEST 1: Auto-Geocoding
- [ ] Warehouse created
- [ ] Geocoding logged
- [ ] Coordinates saved
- Status: PASS / FAIL
- Notes: ____

TEST 2: Distance Selection
- [ ] Multiple warehouses created
- [ ] Order from different location
- [ ] Correct warehouse selected
- Status: PASS / FAIL
- Notes: ____

TEST 3: Fallback
- [ ] Primary warehouse insufficient stock
- [ ] Fallback warehouse selected
- Status: PASS / FAIL
- Notes: ____

TEST 4: Atomic Deduction
- [ ] Concurrent orders
- [ ] No race condition
- [ ] Stock correct
- Status: PASS / FAIL
- Notes: ____

Overall Status: ✅ PASS / ❌ FAIL
Issues found: ____
```

---

**Last Updated:** December 4, 2024
