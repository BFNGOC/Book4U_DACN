# GPS Location Retrieval Debugging Guide

## Problem

Shipper location not being retrieved or saved properly - shows "High accuracy timeout, retrying with standard accuracy..." but still fails.

## Root Causes Identified

### 1. **Backend Data Format Mismatch (FIXED)**

**Issue:** Frontend sends `{latitude, longitude}` but model expects GeoJSON Point format

**Before (Broken):**

```javascript
// deliveryController.js (Line 68)
currentLocation: {
    latitude,
    longitude,
    address,
    lastUpdated: new Date(),  // ❌ Wrong format for GeoJSON model
}
```

**After (Fixed):**

```javascript
// Converts to correct GeoJSON Point format: {type: "Point", coordinates: [lng, lat]}
const currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
};
```

### 2. **Enhanced Frontend Debugging (ADDED)**

-   Added detailed console logging at each step
-   Different error messages for each error code:
    -   **Code 1:** Permission denied (user didn't allow location access)
    -   **Code 2:** Position unavailable (GPS/Internet issue)
    -   **Code 3:** Timeout (GPS taking too long - now retried automatically)
-   Toast notifications for each step

## Testing Checklist

### Step 1: Check Browser Permissions

1. Open browser DevTools (F12)
2. Go to **Settings** → **Privacy & Security** → **Permissions**
3. Check if location permission for website is:
    - ✅ **Allow** (working)
    - ❌ **Deny** (needs to be changed)
    - ⚠️ **Ask every time** (will prompt on each request)

**How to fix:** Click the permission, change to "Allow"

### Step 2: Enable Device Location

-   **Windows:** Settings → Privacy & Security → Location → ON
-   **Mac:** System Preferences → Security & Privacy → Location Services → ON
-   **iOS:** Settings → Privacy → Location Services → ON
-   **Android:** Settings → Location → ON

### Step 3: Check Browser Console

1. Shipper clicks "Start Tracking" button
2. Open DevTools Console (F12 → Console tab)
3. Look for logs:

**Success logs should show:**

```
🚀 Starting location tracking (High Accuracy)...
✅ High Accuracy GPS Success: 10.7769, 106.7009
📡 Server response: {success: true, data: {...}}
```

**Timeout logs (will retry):**

```
🚀 Starting location tracking (High Accuracy)...
⏱️ High accuracy timeout, retrying with standard accuracy...
✅ Standard Accuracy GPS Success: 10.7769, 106.7009
📡 Server response: {success: true, data: {...}}
```

**Permission error (needs fixing):**

```
Error code: 1 | Message: "User denied geolocation"
```

### Step 4: Verify API Request

1. Open DevTools Network tab (F12 → Network)
2. Shipper clicks "Start Tracking"
3. Look for POST request to: `/api/delivery/shipper/location`
4. Click on it and check:
    - **Request Payload** should show: `{"latitude": 10.7769, "longitude": 106.7009, "address": "..."}`
    - **Response Status** should be: `200 OK`
    - **Response Body** should show: `{"success": true, "data": {"currentLocation": {}}}`

### Step 5: Verify Backend Processing

1. Check server logs in terminal (should see no errors)
2. ShipperProfile.currentLocation should now have GeoJSON format:
    ```javascript
    {
        type: "Point",
        coordinates: [106.7009, 10.7769]  // [longitude, latitude]
    }
    ```

### Step 6: Verify Frontend Display

1. Seller views order dashboard
2. Check if shipper location displays on maps with purple pin
3. Should show converted coordinates: `10.7769, 106.7009`

## Common Issues & Solutions

### Issue 1: "Từ chối quyền truy cập GPS"

**Cause:** User clicked "Don't Allow" on location permission prompt

**Solution:**

1. Reload page
2. Click "Allow" when prompted
3. Or manually enable in browser settings

### Issue 2: "Timeout expired" keeps appearing

**Cause:** GPS chip cannot get satellite lock in time

**Solution:**

1. Try outdoors with clear sky view
2. Wait 30+ seconds (GPS lock takes time)
3. If indoors, high accuracy won't work - standard mode should kick in
4. Check if device GPS is enabled
5. Try different browser or device

### Issue 3: Location shows but doesn't update on seller dashboard

**Cause:** New location saved but not being fetched

**Solution:**

1. Seller click "Cập nhật thông tin" button on dashboard
2. Wait 30 seconds for polling to refresh (auto updates every 30s)
3. Check browser console for any errors

### Issue 4: API returns 400 "Cần latitude và longitude"

**Cause:** Frontend not sending coordinates correctly

**Solution:**

1. Check DevTools Network tab - request payload
2. Verify latitude/longitude are present and are numbers
3. Check client-side code in ShipperDashboard.jsx

## Frontend Code Flow

```
User clicks "Start Tracking Button"
    ↓
startLocationTracking() called
    ↓
Check browser geolocation support
    ↓
watchPosition() with HIGH accuracy
    ├─ SUCCESS: Get coords → updateShipperLocation(lat, lng)
    │   ├─ API call to /api/delivery/shipper/location
    │   ├─ Backend converts to GeoJSON Point
    │   ├─ Saves to ShipperProfile.currentLocation
    │   └─ Toast: "Cập nhật vị trí thành công"
    │
    └─ TIMEOUT (code 3): Retry with STANDARD accuracy
        ├─ SUCCESS: Get coords → updateShipperLocation(lat, lng)
        │   └─ Toast: "Cập nhật vị trí thành công (tiêu chuẩn)"
        │
        └─ ERROR: Show error message
            └─ Toast: Error code specific message
```

## Backend Code Flow

```
POST /api/delivery/shipper/location {latitude, longitude, address}
    ↓
deliveryController.updateShipperLocation()
    ├─ Validate: latitude && longitude exist
    ├─ Convert to GeoJSON: {type: "Point", coordinates: [lng, lat]}
    ├─ Find shipper by userId
    ├─ Update ShipperProfile.currentLocation
    ├─ Save to DB
    └─ Return 200 OK with converted GeoJSON location
        ↓
Frontend receives response → display on maps
```

## Frontend Verification in Console

```javascript
// Check if geolocation is available
navigator.geolocation; // Should show object, not undefined

// Test manual location fetch
navigator.geolocation.getCurrentPosition(
    (position) => console.log('✅ Got location:', position.coords),
    (error) => console.error('❌ Error:', error)
);
```

## Backend Verification in MongoDB

```javascript
// Connect to MongoDB and check
db.profiles.findOne({_id: shipperId}, {currentLocation: 1})

// Should show:
{
    _id: ObjectId(...),
    currentLocation: {
        type: "Point",
        coordinates: [106.7009, 10.7769]
    }
}
```

## Network Issues

If API call fails with network error:

1. Check backend server is running
2. Check CORS configuration allows requests from frontend origin
3. Check API URL is correct: `/api/delivery/shipper/location`
4. Check authentication token is being sent (should be automatic with axiosPrivate)

## Performance Tips

-   ✅ High accuracy GPS uses more battery - but necessary for accurate tracking
-   ✅ Standard accuracy fallback uses less battery but less accurate
-   ✅ `maximumAge: 30000` allows using cached location (saves time/battery)
-   ✅ 30-second polling on dashboard is good balance between realtime and bandwidth

## Files Modified

-   ✅ `Client/Book4U/src/pages/shipper/ShipperDashboard.jsx` - Enhanced logging
-   ✅ `Server/src/controllers/deliveryController.js` - Fixed GeoJSON format
-   ✅ `Server/src/models/profileModel.js` - Already correct (no change needed)
