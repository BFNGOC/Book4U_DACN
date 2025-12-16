# 🎯 CLIENT TESTING GUIDE - Multi-Stage Delivery (No Postman)

**Ngày:** 16/12/2025  
**Purpose:** Test giao hàng nội tỉnh & liên tỉnh hoàn toàn từ UI

---

## 📋 Mục lục

1. [Test Environment Setup](#test-environment-setup)
2. [Scenario 1: Nội Tỉnh (Local)](#scenario-1-nội-tỉnh-local)
3. [Scenario 2: Liên Tỉnh (Inter-Provincial)](#scenario-2-liên-tỉnh-inter-provincial)
4. [Troubleshooting](#troubleshooting)

---

## Test Environment Setup

### Prerequisites

✅ Backend running: `http://localhost:5000`  
✅ Frontend running: `http://localhost:5173`  
✅ MongoDB connected  
✅ 2+ browser tabs/windows (for multiple users)

### Test Data Needed

#### 1️⃣ Create Test Accounts

**Seller TPHCM:**

```
Email: seller_hcm@test.com
Password: password123
Role: Seller
Province: TP. Hồ Chí Minh
```

**Seller Hà Nội:**

```
Email: seller_hn@test.com
Password: password123
Role: Seller
Province: Hà Nội
```

**Shipper TPHCM:**

```
Email: shipper_hcm@test.com
Password: password123
Role: Shipper
Province: TP. Hồ Chí Minh
```

**Shipper Hà Nội:**

```
Email: shipper_hn@test.com
Password: password123
Role: Shipper
Province: Hà Nội
```

**Customer:**

```
Email: customer@test.com
Password: password123
Role: Customer
```

#### 2️⃣ Create via UI

**Windows/Tabs Layout:**

```
Tab 1: Admin/Management (setup shippers)
Tab 2: Seller TPHCM (ship order)
Tab 3: Shipper TPHCM (accept & pickup)
Tab 4: Shipper HN (accept & deliver) - for inter-provincial
Tab 5: Customer (track order)
```

---

## Scenario 1: Nội Tỉnh (Local)

### Test Flow: TPHCM → TPHCM (1 Stage)

#### **Step 1: Customer - Create Order**

1. Login as Customer (`customer@test.com`)
2. Navigate to Shop TPHCM
3. Add book to cart
4. Go to Checkout
5. Fill shipping address:
    ```
    Name: Nguyễn A
    Phone: 0912345678
    Province: TP. Hồ Chí Minh
    District: Quận 1
    Ward: Phường Bến Thành
    Address: 123 Đường Lê Lợi
    ```
6. Choose COD payment
7. **Click "Đặt hàng"**
8. ✅ Order created with status: **pending**
9. **Note down: Order ID**

📸 _Expected: Success message + order in "My Orders"_

---

#### **Step 2: Seller - Confirm Order**

1. Login as Seller TPHCM (`seller_hcm@test.com`)
2. Go to **Dashboard → Đơn Hàng**
3. Find the order from customer
4. Order status: `pending` → Click **"Xác Nhận"**
5. ✅ Status changes to: **confirmed**
6. Seller can now see order in "Đơn Hàng Đã Xác Nhận"

📸 _Expected: Order moves to confirmed section_

---

#### **Step 3: Seller - Ship Order (Auto-Create Stage)**

1. In the same Seller Dashboard
2. Find confirmed order
3. Click on order → **"Chi Tiết Đơn Hàng"**
4. Scroll down to "Vận Chuyển"
5. Fill shipping info:
    ```
    Tracking Number: VN001-LOCAL
    Shipping Method: standard
    ```
6. **Click "Giao cho vận chuyển"**
7. ✅ Backend auto-creates **1 delivery stage** (nội tỉnh)
8. Order status: `in_delivery_stage`

📸 _Expected: See delivery stage created in SellerDeliveryManagement_

---

#### **Step 4: Verify Delivery Stage Created**

1. Stay in Seller Dashboard
2. You should now see **"Theo dõi vận chuyển"** section
3. Should show **1 stage** with:
    - Stage 1: Lấy hàng từ kho → Giao hàng cho khách
    - Status: ⏳ Chờ nhận
    - From: Warehouse TPHCM
    - To: Customer TPHCM (Quận 1, Phường Bến Thành)

📸 _Expected: SellerDeliveryManagement shows stage details_

---

#### **Step 5: Shipper - Get Pending Orders**

1. Login as Shipper TPHCM (`shipper_hcm@test.com`)
2. Go to **Dashboard → Đơn Hàng Chờ Pickup**
3. Should see the order in list:
    ```
    Name: Nguyễn A
    Address: Quận 1, Phường Bến Thành
    Stage: 1/1
    Price: xxx đ
    ```

📸 _Expected: Order shows in ShipperDeliveryManagement_

---

#### **Step 6: Shipper - Accept Order**

1. In Shipper Dashboard
2. Click on the order card → **Expand it**
3. Should see:
    - 📍 Lấy hàng tại: Warehouse TPHCM
    - 📍 Giao tới: Customer address
    - 📚 Sản phẩm: Book details
4. **Click "Nhận Đơn Hàng"** button
5. ✅ Status changes to: **✓ Đã chấp nhận**
6. Order disappears from pending list (on refresh)

📸 _Expected: Button changes to disabled, order status updated_

---

#### **Step 7: Shipper - Pickup Package**

1. Order now in "Đơn Hàng Đang Xử Lý" tab
2. Click on order again → **Expand**
3. Look for **"Lấy Hàng"** button
4. **Click "Lấy Hàng"**
5. Browser requests location permission
6. **Allow geolocation**
7. ✅ Pickup recorded with current location
8. Status: **📦 Đã lấy hàng**

📸 _Expected: GPS coordinates + address recorded_

**Location will be from your current browser location (can use DevTools to simulate)**

---

#### **Step 8: Shipper - Update Location (Realtime)**

1. Order is now in delivery
2. Look for **"Cập Nhật Vị Trí"** button or input
3. If available, you can manually update location:
    ```
    - Latitude: 10.785
    - Longitude: 106.705
    - Address: Trên đường Nguyễn Huệ
    ```
4. Status changes to: **🚚 Đang vận chuyển**

📸 _Expected: Location history grows_

---

#### **Step 9: Shipper - Complete Delivery**

1. Order still in delivery
2. Navigate to customer address location
3. Click **"Hoàn Thành Giao Hàng"** button
4. Browser requests location again
5. **Allow geolocation**
6. ✅ Delivery completed
7. Status: **✅ Đã giao**

📸 _Expected: Stage marked as delivered, timestamps recorded_

---

#### **Step 10: Customer - Track Order**

1. Login as Customer
2. Go to **"Đơn Hàng Của Tôi"**
3. Find the order
4. Click **"Tracking"** or **"Chi Tiết Vận Chuyển"**
5. Should see:

    ```
    Timeline:
    └─ Stage 1: Lấy hàng (✅ 10:30)
    └─ Stage 1: Đang vận chuyển (✅ 10:45)
    └─ Stage 1: Đã giao (✅ 11:00)

    Map:
    └─ Markers: Warehouse → Shipper → Customer
    └─ Route line: Shows path
    ```

6. **Click on map markers** to see details
7. **Expand stages** to see location history

📸 _Expected: Full timeline visible, map loads (if API key set)_

---

#### **Step 11: Verify Order Status Updated**

1. Go back to Customer **"Đơn Hàng Của Tôi"**
2. Order status: **✅ Đã giao**
3. Seller Dashboard (refresh):
    - Order status: **completed**
    - Delivery: **✅ Đã giao**

📸 _Expected: All statuses synced across roles_

---

## Scenario 2: Liên Tỉnh (Inter-Provincial)

### Test Flow: TPHCM → Hà Nội (3 Stages)

#### **Step 1: Customer - Create Order (HN)**

1. Login as Customer
2. Navigate to Seller TPHCM shop
3. Add book to cart
4. Go to Checkout
5. Fill shipping address:
    ```
    Name: Trần B
    Phone: 0987654321
    Province: Hà Nội           ← DIFFERENT PROVINCE
    District: Quận Hoàn Kiếm
    Ward: Phường Hàng Bông
    Address: 789 Phố Hàng Ngang
    ```
6. **Click "Đặt hàng"**
7. ✅ Order created
8. **Note down: Order ID**

---

#### **Step 2: Seller - Confirm Order**

1. Login as Seller TPHCM
2. Dashboard → Đơn Hàng → Find order
3. **Click "Xác Nhận"**
4. Status: **confirmed**

---

#### **Step 3: Seller - Ship Order (Auto-Create 3 Stages)**

1. In Seller Dashboard
2. Click order → **"Chi Tiết Đơn Hàng"**
3. Fill shipping info:
    ```
    Tracking Number: VN002-INTER
    Shipping Method: standard
    ```
4. **Click "Giao cho vận chuyển"**
5. ✅ Backend detects **different province**
6. **AUTO-CREATES 3 STAGES:**
    - Stage 1: TPHCM Warehouse → TPHCM Hub (Shipper TPHCM)
    - Stage 2: TPHCM Hub → HN Hub (Regional Carrier)
    - Stage 3: HN Hub → Customer HN (Shipper HN)

📸 _Expected: SellerDeliveryManagement shows 3 stages_

---

#### **Step 4: Verify All 3 Stages**

1. In Seller Dashboard, expand each stage
2. Should see:

    ```
    Stage 1:
    ├─ From: Warehouse TPHCM (Quận 1)
    ├─ To: Hub TPHCM (Quận 1)
    └─ Status: ⏳ Chờ nhận

    Stage 2:
    ├─ From: Hub TPHCM (Quận 1)
    ├─ To: Hub Hà Nội (Hoàn Kiếm)
    └─ Status: ⏳ Chờ nhận

    Stage 3:
    ├─ From: Hub Hà Nội
    ├─ To: Customer HN (Hoàn Kiếm)
    └─ Status: ⏳ Chờ nhận
    ```

📸 _Expected: 3 separate stages with different locations_

---

#### **Step 5: Shipper TPHCM - Accept Stage 1**

1. Login as Shipper TPHCM
2. Dashboard → Đơn Hàng Chờ Pickup
3. Should see **1 order** (only stage 1)
    ```
    Stage: 1/3
    ```
4. Expand order
5. **Click "Nhận Đơn Hàng"**
6. Status: **✓ Đã chấp nhận**

📸 _Expected: Shipper TPHCM only sees stage 1_

---

#### **Step 6: Shipper TPHCM - Pickup → Deliver**

1. Order in delivery
2. **Click "Lấy Hàng"** → Allow geolocation
3. Status: **📦 Đã lấy hàng**
4. **Optional: Update location** (simulating in-transit)
5. When ready: **Click "Hoàn Thành Giao Hàng"**
6. Status: **✅ Đã giao Stage 1**
7. ✅ **Stage 2 automatically becomes available**

📸 _Expected: Stage 1 marked delivered, Stage 2 ready_

---

#### **Step 7: Shipper HN - Get Stage 3 (NEW)**

1. Login as Shipper HN (`shipper_hn@test.com`)
2. Dashboard → Đơn Hàng Chờ Pickup
3. **NOW SEES the order** (didn't see before!)
4. Shows: **Stage 3/3**
5. **NOTE:** Shipper HN only sees stage 3, not stages 1-2

📸 _Expected: Shipper HN can now see order in pending list_

---

#### **Step 8: Shipper HN - Accept & Deliver Stage 3**

1. Expand order from pending list
2. Should show:
    ```
    📍 Lấy hàng tại: Hub Hà Nội
    📍 Giao tới: Customer HN (Hàng Bông, Hoàn Kiếm)
    ```
3. **Click "Nhận Đơn Hàng"**
4. **Click "Lấy Hàng"** → Allow geolocation
5. Status: **📦 Đã lấy hàng**
6. **Click "Hoàn Thành Giao Hàng"**
7. Status: **✅ Đã giao Stage 3**

📸 _Expected: All 3 stages completed_

---

#### **Step 9: Customer - Track Full Timeline**

1. Login as Customer
2. Go to **"Đơn Hàng Của Tôi"**
3. Find the order
4. Click **"Tracking"**
5. Should see **FULL TIMELINE:**

    ```
    Timeline (3 stages):
    ├─ Stage 1: Lấy hàng từ kho TPHCM ✅
    │  └─ 10:30: Lấy hàng
    │  └─ 10:45: Đang vận chuyển
    │  └─ 10:50: Tới trung tâm TPHCM
    │
    ├─ Stage 2: Vận chuyển liên tỉnh ✅
    │  └─ 10:50: Lấy hàng tại hub
    │  └─ 15:00: Đang vận chuyển
    │  └─ 19:00: Tới trung tâm Hà Nội
    │
    └─ Stage 3: Giao hàng tại Hà Nội ✅
       └─ 19:00: Lấy hàng tại hub
       └─ 19:30: Đang giao hàng
       └─ 20:00: Đã giao

    Map:
    └─ Shows all 3 locations: HCM Warehouse → HCM Hub → HN Hub → Customer
    ```

6. **Click on map** to see detailed route

📸 _Expected: Complete inter-provincial journey visible_

---

#### **Step 10: Verify Shipper Visibility**

**Important Test: Verify shippers ONLY see their province**

Login as Shipper TPHCM:

```
✅ Should see: Stage 1 (TPHCM → TPHCM)
❌ Should NOT see: Stage 3 (HN → Customer)
```

Login as Shipper HN:

```
❌ Should NOT see: Stage 1 (only when it's pending)
✅ Should see: Stage 3 (HN → Customer)
```

📸 _Expected: Each shipper sees only their province orders_

---

## Testing Checklist

### Nội Tỉnh ✅

-   [ ] Customer creates order (same province)
-   [ ] Seller confirms order
-   [ ] Seller ships → **1 stage created**
-   [ ] Shipper accepts
-   [ ] Shipper picks up → location recorded
-   [ ] Shipper completes → status updated
-   [ ] Customer sees timeline
-   [ ] Order marked as delivered

### Liên Tỉnh ✅

-   [ ] Customer creates order (different province)
-   [ ] Seller confirms order
-   [ ] Seller ships → **3 stages created**
-   [ ] Stage 1: Shipper TPHCM handles
-   [ ] Shipper TPHCM only sees stage 1
-   [ ] Shipper TPHCM completes stage 1
-   [ ] Stage 2: Becomes available (ready for carrier)
-   [ ] Stage 2: Can be auto-completed (simulate regional carrier)
-   [ ] Stage 3: Becomes available
-   [ ] Shipper HN only sees stage 3 (not before)
-   [ ] Shipper HN accepts & completes
-   [ ] Customer sees 3-stage timeline
-   [ ] Maps show all 3 locations

### UI Components ✅

-   [ ] **SellerDeliveryManagement** shows stages correctly
-   [ ] **ShipperDeliveryManagement** filters by province
-   [ ] **DeliveryStageTracker** shows timeline
-   [ ] **DeliveryMapTracker** shows map (if API key set)
-   [ ] All expandable sections work
-   [ ] Location history shows with timestamps
-   [ ] Status badges update in real-time
-   [ ] Auto-refresh works (30-60s)

---

## Browser DevTools Tricks

### Simulate Location

1. Open **DevTools** (F12)
2. **Ctrl+Shift+P** → Type "Sensors"
3. Set location to:
    ```
    For TPHCM: Latitude: 10.8231, Longitude: 106.6797
    For HN: Latitude: 21.0285, Longitude: 105.8542
    ```
4. Now geolocation will use this location

### Simulate Offline

1. DevTools → **Network tab**
2. Check **"Offline"** checkbox
3. Test error handling
4. Uncheck to go back online

### Monitor Network Requests

1. DevTools → **Network tab**
2. Look for requests to:
    ```
    POST /api/multi-delivery/stages/create
    GET /api/multi-delivery/stages/:id
    PUT /api/multi-delivery/stages/:id/accept
    PUT /api/multi-delivery/stages/:id/pickup
    PUT /api/multi-delivery/stages/:id/complete
    ```
3. Check response status & payload

### Clear Storage

1. DevTools → **Application tab**
2. **Local Storage → Clear All**
3. **Cookies → Clear All**
4. Forces re-login (clean state)

---

## Troubleshooting

### ❌ "Không thấy Đơn Hàng Chờ Pickup"

**Solution:**

1. Verify shipper coverage area created (backend)
2. Verify order's delivery stage exists in DB
3. Shipper's `coverageAreas` must match order's province exactly
4. Check browser console for API errors

```javascript
// In browser console:
// Check shipper coverage
fetch('/api/shipper-coverage/shipper_id')
    .then((r) => r.json())
    .then(console.log);

// Check pending stages
fetch('/api/multi-delivery/shipper/orders', {
    headers: { Authorization: `Bearer ${token}` },
})
    .then((r) => r.json())
    .then(console.log);
```

### ❌ "Map not loading"

**Solution:**

1. Check `.env` has `VITE_GOOGLE_MAPS_API_KEY`
2. API key must have Maps JavaScript API enabled
3. Check browser console for errors
4. Verify location data exists in stages

### ❌ "Geolocation permission denied"

**Solution:**

1. Check browser geolocation settings
2. Reset permissions: DevTools → Application → Permissions
3. Try in new incognito window
4. Or use DevTools Sensors to simulate location

### ❌ "Stage not updating in real-time"

**Solution:**

1. Component auto-refreshes every 30-60 seconds
2. Click **"Cập Nhật"** button to refresh manually
3. Check network tab for API calls
4. Verify backend responding with updated data

### ❌ "Shipper sees orders from other provinces"

**Solution:**

1. Check shipper's coverage area in DB:
    ```javascript
    db.shippercoverageareas.findOne({ shipperId: 'id' });
    ```
2. Verify stage's `fromLocation.province` matches
3. Check order's province field is correct
4. Verify `getShipperOrders()` controller logic

---

## Test Data Template

### Browser 1: Seller TPHCM

```
Login: seller_hcm@test.com / password123
Dashboard URL: http://localhost:5173/seller/dashboard
Tasks:
- Confirm orders
- Ship orders
- Track delivery stages
```

### Browser 2: Shipper TPHCM

```
Login: shipper_hcm@test.com / password123
Dashboard URL: http://localhost:5173/shipper/dashboard
Tasks:
- View pending orders (stage 1 only)
- Accept → Pickup → Complete
```

### Browser 3: Shipper HN

```
Login: shipper_hn@test.com / password123
Dashboard URL: http://localhost:5173/shipper/dashboard
Tasks:
- View pending orders (stage 3 only, after stage 2 done)
- Accept → Pickup → Complete
```

### Browser 4: Customer

```
Login: customer@test.com / password123
Dashboard URL: http://localhost:5173/my-orders
Tasks:
- Create orders (different provinces)
- Track deliveries
- View maps
```

---

## Success Criteria

### Test Passes ✅ When:

1. **Nội Tỉnh:**

    - 1 delivery stage created automatically
    - Shipper can accept → pickup → deliver
    - Customer sees complete timeline
    - All statuses update correctly

2. **Liên Tỉnh:**

    - 3 delivery stages created automatically
    - Each shipper sees only their province's stage
    - Stages progress in order (1→2→3)
    - Maps show correct locations
    - Customer sees full 3-stage journey

3. **No Postman Needed:**
    - All testing done through UI
    - All interactions work through React components
    - API calls visible in Network tab
    - No manual HTTP requests required

---

## Expected Behavior Summary

| Stage              | Before  | After                            | Shipper Sees? |
| ------------------ | ------- | -------------------------------- | ------------- |
| 1 (Local pickup)   | pending | accepted → picked_up → delivered | ✅ TPHCM      |
| 2 (Regional)       | pending | accepted → in_transit → at_hub   | ❌ Not in UI  |
| 3 (Local delivery) | pending | accepted → picked_up → delivered | ✅ HN         |

---

**Happy Testing! 🚀 No Postman needed - everything works through the UI! 🎉**
