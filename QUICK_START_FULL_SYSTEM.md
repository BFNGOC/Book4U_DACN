# 🚀 QUICK START - Test Full Order-to-Delivery System

## 1️⃣ **Setup & Configuration**

### Backend Environment Variables

```env
# File: Server/.env

# VNPAY Payment Gateway
VNPAY_TMN_CODE=TESTMERCHANT
VNPAY_HASH_SECRET=TESTSECRET

# MOMO Payment Gateway
MOMO_PARTNER_CODE=MOMO
MOMO_SECRET_KEY=MOMOTEST

# URLs
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

### Start Services

```bash
# Terminal 1: Backend
cd Server
npm install  # if needed
node index.js

# Terminal 2: Frontend
cd Client/Book4U
npm install  # if needed
npm run dev
```

---

## 2️⃣ **Test as CUSTOMER**

### Step 1: Browse & Add to Cart

1. Go to `http://localhost:5173/`
2. Click any book → Click "Thêm vào giỏ"
3. Go to `/cart` → Proceed to checkout

### Step 2: Checkout

1. Choose shipping address
2. Click "Đặt hàng"
3. Select payment method:
    - **COD:** Pays when received (no redirect)
    - **VNPAY:** Will redirect to VNPAY sandbox
    - **MOMO:** Will redirect to MOMO sandbox
4. Confirm order

### Step 3: View Order Status

1. Go to `/orders` → Click order ID
2. See order details and status
3. Button: "Theo dõi đơn hàng" → Go to `/tracking/{orderId}`
4. In tracking page:
    - 📋 Timeline shows current status
    - 📝 Delivery attempts logged
    - 🗺️ Shipper current location
    - 🔄 Auto-refreshes every 10s

### Step 4: Request Return (Optional)

1. From order detail page
2. Click "🔄 Yêu Cầu Hoàn Hàng"
3. Fill form:
    - Select reason
    - Write description
    - Upload up to 3 photos
4. Submit
5. Go to `/returns/{orderId}` to track return status

---

## 3️⃣ **Test as SELLER**

### Step 1: Login as Seller

1. Use seller account
2. Go to `/dashboard/seller` or `/seller/orders`

### Step 2: Confirm Pending Orders

1. Click "📋 Pending Orders"
2. Find a pending order
3. Click "✓ Xác nhận đơn"
4. System auto:
    - Geocodes customer address
    - Selects nearest warehouse
    - Deducts stock atomically
    - Saves warehouseId to order

### Step 3: Update Order Status

1. Click "▶ Bắt đầu lấy hàng" (Picking)
2. Click "✓ Đã đóng gói" (Packed)
3. Click "🚚 Bàn giao shipper" (Handoff)
    - Enter carrier info:
        - Carrier name (e.g., "Giao Hàng Nhanh")
        - Tracking number
        - Shipper name
    - Submit

---

## 4️⃣ **Test as SHIPPER**

### Setup

1. Login as shipper account
2. Make sure order status is `in_transit` (seller already handed off)

### Step 1: Access Dashboard

1. Go to `/dashboard/shipper`
2. See stats:
    - Total orders assigned
    - In transit count
    - Completed count
    - Current GPS location

### Step 2: View Orders in List Mode

1. Click "📋 Danh Sách"
2. See all assigned orders
3. Filter by status: All, Đang Giao, Ra Giao, Hoàn Thành
4. Each order card shows:
    - Customer name, phone, address
    - Total amount & payment method
    - Current attempt number
    - Last attempt status

### Step 3: View Orders on Map

1. Click "🗺️ Bản Đồ"
2. See interactive map:
    - 🔵 Blue marker = Your location (updates from GPS)
    - 🟡 Orange markers = Orders to deliver
    - 🟢 Green markers = Already delivered
3. Hover markers to see order details

### Step 4: GPS Tracking (Auto)

1. Browser asks for location permission (allow it)
2. GPS location updates every 30s automatically
3. Location sent to server for customer to track

### Step 5: Record Delivery Attempt

1. Click "📍 Ghi Nhận Giao Hàng" button
2. Modal appears with options:
    - **✅ Giao thành công:**
        - Select this if customer received
        - Status → `completed`
        - Payment status → `paid` (if COD)
    - **❌ Giao không thành công:**
        - Select reason from dropdown
        - If attempts < maxAttempts:
            - Status → `out_for_delivery` (will retry)
            - Show "Sẽ giao lại lần {next}"
        - If attempts >= maxAttempts:
            - Status → `return_initiated` (will return)
3. Optional: Add notes
4. Click "Xác Nhận"
5. Order updates and list refreshes

### Step 6: View Delivery History

1. Click "🗺️ Xem Bản Đồ" on any order
2. Order detail shows:
    - All attempts with timestamps
    - Success/failure reason
    - GPS location of each attempt

---

## 5️⃣ **Test Payment Gateways**

### VNPAY Test

1. During checkout, select **VNPAY**
2. Click "Tiếp Tục"
3. Redirects to VNPAY sandbox
4. Use test card:
    - Number: `4111111111111111`
    - OTP: Any 6 digits
5. Payment marked as `paid`
6. Order status: `confirmed`

### MOMO Test

1. During checkout, select **MOMO**
2. Click "Tiếp Tục"
3. Redirects to MOMO sandbox
4. Approve payment
5. Back to order detail (paid)

### COD Test

1. During checkout, select **COD**
2. Click "Tiếp Tục"
3. Order created with `paymentStatus: unpaid`
4. Payment marked `paid` after successful delivery

---

## 6️⃣ **Test Warehouse Auto-Selection**

When seller confirms order:

1. **Geocoding:**

    - Address "123 xã Quảng Tiến, Trảng Bom, Đồng Nai" → Geocoded
    - If fail → Falls back to HCM default

2. **Warehouse Selection:**

    - Shows log in server console:
        ```
        📡 Geocoding: "address"
        ✅ Geocoded to: address (lat, lon)
        📦 Found 2 warehouse stocks
        📍 Selected Kho hàng A (5.2 km away)
        🔒 Attempting to lock stock: qty=3
        ✅ Stock deducted: 25→22
        ```

3. **Database:**
    - Order.warehouseId = selected warehouse ID
    - Order.warehouseName = "Kho hàng A"
    - WarehouseStock.quantity -= 3
    - WarehouseLog created

---

## 7️⃣ **Test Real-time Tracking**

### Customer View:

1. Order detail page
2. Button: "Theo dõi đơn hàng" → `/tracking/{orderId}`
3. See timeline with 6 steps:
    - 📋 Pending
    - ✅ Confirmed
    - 📦 Picking
    - 📮 Packed
    - 🚚 In Transit
    - 🎉 Completed
4. Current status shows 🔄 (processing)
5. Page auto-refreshes every 10s
6. When shipper records attempt:
    - Timeline updates
    - Delivery attempts history shown
    - Current location displayed

### Shipper View:

1. Dashboard/Shipper updates location every 30s
2. Server logs: `Location updated`
3. Customer tracking page sees live location

---

## 8️⃣ **Test Return Flow**

### From Customer:

1. Order detail page
2. Button: "🔄 Yêu Cầu Hoàn Hàng"
3. Modal form:
    - Select reason
    - Write description
    - Upload max 3 photos
4. Submit
5. Go to `/returns/{orderId}`
6. See 5-step timeline:
    - ⏳ Chờ Xử Lý (pending)
    - ✅ Được Duyệt (approved)
    - 🚚 Đang Vận Chuyển (in_transit)
    - 📦 Đã Nhận (received)
    - 💰 Đã Hoàn Tiền (refunded)

### From Seller:

1. Dashboard/Returns or Orders page
2. Find order with `status: return_initiated`
3. Click "View Return Details"
4. Approve/reject return
5. System auto-sends shipper to pick up

---

## 9️⃣ **Monitoring & Debugging**

### Server Logs Look Like:

```
✅ Connected to MongoDB
🚀 Server running on port 5000

[Order Confirm]
📡 Geocoding customer address: "..."
🔍 Geocoding address: "..."
✅ Geocoded to: address (lat, lon)
📦 Found 2 warehouse stocks
📍 Selected Kho hàng A (5.2 km away)
✅ Selected warehouse: ID (Name)
🔒 Attempting to lock stock: qty=3
✅ Stock deducted successfully. Remaining: 22

[Delivery Attempt]
🔒 Attempting to record attempt: orderId
✅ Delivery attempt recorded: Success

[Location Update]
📍 Shipper location updated
```

### Console Errors to Ignore:

-   Module warnings (searchService ES module)
-   CORS warnings in dev
-   Unread notification warnings

### Test with These Tools:

-   Postman: Test API endpoints
-   MongoDB Compass: View database
-   Browser DevTools: Check network/console
-   Terminal: Watch server logs

---

## 🔟 **Troubleshooting**

### Shipper doesn't see orders:

-   ✅ Confirm seller has handed off to shipper
-   ✅ Check `carrier.shipperId` matches shipper ID
-   ✅ Order status must be `in_transit` or `out_for_delivery`

### GPS not updating:

-   ✅ Browser must have permission to use location
-   ✅ HTTPS or localhost required for GPS
-   ✅ Check browser console for geolocation errors

### Warehouse selection fails:

-   ✅ Seller must have at least 1 warehouse
-   ✅ WarehouseStock must exist for product
-   ✅ Stock quantity must be >= order quantity
-   ✅ Check server logs for geocoding errors

### Payment redirect fails:

-   ✅ Check VNPAY_TMN_CODE and SECRET in .env
-   ✅ CLIENT_URL must be set correctly
-   ✅ Use sandbox URLs (not production)

### Map not loading:

-   ✅ Check Leaflet library loads (DevTools Network)
-   ✅ Need internet for OpenStreetMap tiles
-   ✅ Check browser console for Leaflet errors

---

## 📊 **Key Test Scenarios**

### Scenario 1: Successful Delivery

```
Customer Orders (COD)
↓
Seller Confirms
↓
Seller Picking/Packed
↓
Seller Handoff to Shipper
↓
Shipper Records "Success"
↓
Order Status: Completed
✅ Payment marked as Paid
```

### Scenario 2: Failed Delivery → Retry

```
Shipper Records "Failed" (Lần 1)
↓
Status: out_for_delivery
↓
Shipper Tries Again (Lần 2)
↓
Shipper Records "Success"
↓
Order Status: Completed
```

### Scenario 3: Return After Failed Attempts

```
Shipper Fails (Lần 1, 2, 3)
↓
Status: return_initiated
↓
Return Request Created
↓
Seller Approves Return
↓
Shipper Picks Up
↓
Refund Processed
✅ Status: Refunded
```

---

## ✅ **Success Checklist**

-   [ ] Customer can place COD order
-   [ ] Seller can confirm and auto-selects warehouse
-   [ ] Shipper dashboard shows assigned orders
-   [ ] GPS location updates every 30s
-   [ ] Shipper can record delivery attempt
-   [ ] Order status progresses correctly
-   [ ] Customer can track order in real-time
-   [ ] Timeline updates when shipper records attempt
-   [ ] Payment gateway VNPAY/MOMO redirects work
-   [ ] Return request can be submitted
-   [ ] Return status page displays timeline
-   [ ] All Tailwind styles render correctly
-   [ ] Mobile responsive on all pages
-   [ ] No console errors (except warnings)

---

🎉 **Ready to Test!** Start with customer scenario and work through to shipper. All components use Tailwind CSS only - no custom CSS files.
