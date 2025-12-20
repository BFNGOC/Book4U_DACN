# GPS Location Data Flow - Complete Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SHIPPER DEVICE                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Browser (Chrome/Firefox/Safari)                         │  │
│  │  ShipperDashboard.jsx                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │ User clicks "Start Tracking"
                 ↓
         navigator.geolocation.watchPosition()
         (Requests device GPS)
                 │
         ┌───────┴────────┐
         │                │
    GPS SUCCESS       GPS TIMEOUT (Code 3)
    (Get lat/lng)     (High Accuracy - 10s)
         │                │
         ↓                ↓
   High Accuracy    Standard Accuracy
   GPS captured     GPS (15s timeout)
         │                │
         ├────────────────┤
         ↓                ↓
    {latitude: 10.7769, longitude: 106.7009}
         │
         │ Frontend: setCurrentLocation()
         │ Console.log: ✅ GPS Success
         │ Toast.success: Location captured
         │
         ↓ POST to /api/delivery/shipper/location
         │ Headers: Authorization, Content-Type: application/json
         │ Body: {latitude, longitude, address}
         │
┌────────┴──────────────────────────────────────────────────────┐
│                    BACKEND SERVER                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ deliveryController.updateShipperLocation()            │  │
│  │                                                        │  │
│  │ 1. Receive: {latitude, longitude, address}            │  │
│  │ 2. Validate: latitude && longitude exist ✓            │  │
│  │ 3. Convert to GeoJSON:                                │  │
│  │    {type: "Point", coordinates: [lng, lat]}           │  │
│  │ 4. Find ShipperProfile by userId                      │  │
│  │ 5. Update: profile.currentLocation = GeoJSON          │  │
│  │ 6. Save to MongoDB                                    │  │
│  │ 7. Return: 200 OK {success: true, data: {...}}        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────┬─────────────────────────────────────────────┘
                   │
         Response received on frontend
         Console.log: 📡 Server response
         Toast.success: Location updated
                   │
┌──────────────────┴──────────────────────────────────────────────┐
│              SELLER DASHBOARD (Later)                           │
│                                                                 │
│  GET /api/multi-delivery/stages/:orderDetailId                 │
│       ├─ Populate deliveryStages                               │
│       │   └─ Select: currentLocation, assignedShipperId, ...   │
│       ├─ Populate assignedShipperId                            │
│       │   └─ Select: currentLocation, firstName, phone, ...    │
│       └─ Return stages with shipper location                   │
│                                                                 │
│  DeliveryStageTracker.jsx                                       │
│  ├─ getCoordinates(GeoJSON) → {latitude, longitude}            │
│  ├─ Render Maps Section:                                        │
│  │  ├─ Red Pin: Stage GPS (if available)                       │
│  │  ├─ Purple Pin: Shipper GPS ← FROM currentLocation          │
│  │  └─ Blue Pin: Province fallback (if no GPS)                 │
│  └─ Display: "📍 Vị trí Shipper: 10.7769, 106.7009"            │
└──────────────────────────────────────────────────────────────────┘
```

## Data Format Transformation

```
FRONTEND (ShipperDashboard)
    ↓
navigator.geolocation.getCurrentPosition()
    ↓
{
    coords: {
        latitude: 10.7769,
        longitude: 106.7009,
        accuracy: 5.0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
    },
    timestamp: 1703059200000
}
    ↓ Extract latitude, longitude
    ↓
POST /api/delivery/shipper/location
{
    latitude: 10.7769,
    longitude: 106.7009,
    address: "10.7769, 106.7009"
}
    ↓
BACKEND (deliveryController.updateShipperLocation)
    ↓ Convert to GeoJSON for MongoDB geospatial indexing
    ↓
{
    type: "Point",
    coordinates: [106.7009, 10.7769]  ← NOTE: [longitude, latitude]
}
    ↓
MONGO DB STORAGE
ShipperProfile._collection.currentLocation
    ↓
LATER: Seller views order
    ↓
BACKEND (multiStageDeliveryController.getDeliveryStages)
    ↓ Populate assignedShipperId with currentLocation
    ↓
API RESPONSE
{
    assignedShipperId: {
        firstName: "Hải",
        lastName: "Nguyễn",
        primaryPhone: "0903123456",
        currentLocation: {
            type: "Point",
            coordinates: [106.7009, 10.7769]
        },
        performance: {
            averageRating: 4.8
        }
    }
}
    ↓
FRONTEND (DeliveryStageTracker.jsx)
    ↓ Call getCoordinates() helper function
    ↓
const getCoordinates = (location) => {
    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
        return {
            latitude: location.coordinates[1],    // coordinates[1] = latitude
            longitude: location.coordinates[0]    // coordinates[0] = longitude
        };
    }
    return location;
};
    ↓ Get: {latitude: 10.7769, longitude: 106.7009}
    ↓
GOOGLE MAPS LINK
https://www.google.com/maps/search/10.7769,106.7009
    ↓
SELLER SEES: 📍 Vị trí Shipper: 10.7769, 106.7009
            [Purple Pin on Map]
```

## Error Handling Flow

```
startLocationTracking() called
    │
    ├─ Check browser support
    │   └─ No: toast.error("Trình duyệt không hỗ trợ GPS")
    │
    └─ watchPosition (High Accuracy)
        │
        ├─ SUCCESS: coordinates captured
        │   ├─ setCurrentLocation()
        │   ├─ POST to server
        │   ├─ console.log("✅ High Accuracy GPS Success")
        │   └─ toast.success("Cập nhật vị trí thành công")
        │
        └─ ERROR:
            │
            ├─ CODE 1 (Permission Denied):
            │   └─ toast.error("Từ chối quyền truy cập GPS...")
            │
            ├─ CODE 2 (Position Unavailable):
            │   └─ toast.error("Không thể lấy vị trị GPS...")
            │
            └─ CODE 3 (TIMEOUT - 10s expired):
                └─ console.log("⏱️ Timeout, retrying...")
                └─ watchPosition (Standard Accuracy)
                    │
                    ├─ SUCCESS: coordinates captured
                    │   └─ toast.success("...thành công (tiêu chuẩn)")
                    │
                    └─ ERROR:
                        ├─ CODE 1: toast.error("Từ chối...")
                        ├─ CODE 2: toast.error("Không thể...")
                        └─ CODE 3: toast.error("Timeout - kiểm tra...")
```

## Timing Sequence

```
TIME    EVENT
─────   ──────────────────────────────────────────────────────
0ms     Shipper clicks "Start Tracking"
        console.log("🚀 Starting location tracking...")

10ms    watchPosition() called with HIGH accuracy
        Browser requests device GPS

500ms   Waiting for GPS lock (high accuracy requires satellite lock)
        ...

3000ms  Waiting...
        ...

5000ms  Still waiting...
        ...

10000ms TIMEOUT: High accuracy took too long
        ERROR CALLBACK triggered with code 3
        console.log("⏱️ High accuracy timeout, retrying...")
        watchPosition() called with STANDARD accuracy

10100ms Browser switches to standard accuracy (uses network/cached)
        Faster response expected

10500ms SUCCESS: Standard accuracy GPS obtained
        ✅ Coordinates: {latitude, longitude}
        console.log("✅ Standard Accuracy GPS Success")

10600ms POST /api/delivery/shipper/location
        Sending coordinates to backend

10700ms Backend processes request
        Converts to GeoJSON format
        Saves to ShipperProfile.currentLocation

10750ms Response: 200 OK
        console.log("📡 Server response: {success: true}")
        toast.success("📍 Cập nhật vị trí thành công")

15000ms Dashboard auto-refresh via polling
        GET /api/multi-delivery/stages/...
        Fetches updated shipper location

15100ms DeliveryStageTracker renders with purple pin
        Seller sees "📍 Vị trí Shipper: 10.7769, 106.7009"
```

## State Flow (Component)

```
ShipperDashboard Component
│
├─ useState: currentLocation = { latitude: null, longitude: null }
├─ useState: loading = false
├─ useState: error = null
│
├─ useEffect: startLocationTracking() on mount
│
├─ Function: startLocationTracking()
│   ├─ navigator.geolocation.watchPosition()
│   ├─ On success: setCurrentLocation({lat, lng})
│   ├─ On error code 3: call watchWithStandardAccuracy()
│   └─ On other error: show toast error
│
├─ Function: watchWithHighAccuracy()
│   ├─ watchPosition(..., HIGH_ACCURACY_OPTIONS)
│   ├─ Options: {enableHighAccuracy: true, timeout: 10000}
│   └─ Success → updateShipperLocation(lat, lng)
│
└─ Function: watchWithStandardAccuracy()
    ├─ watchPosition(..., STANDARD_ACCURACY_OPTIONS)
    ├─ Options: {enableHighAccuracy: false, timeout: 15000}
    └─ Success → updateShipperLocation(lat, lng)
```

## MongoDB Schema

```
ShipperProfile Collection
├─ _id: ObjectId("...")
├─ userId: ObjectId("...")
├─ firstName: "Hải"
├─ lastName: "Nguyễn"
├─ primaryPhone: "0903123456"
├─ currentLocation: {          ← GeoJSON Point Format
│   ├─ type: "Point"
│   └─ coordinates: [106.7009, 10.7769]  ← [longitude, latitude]
├─ performance: {
│   ├─ averageRating: 4.8
│   ├─ totalDeliveries: 125
│   └─ completionRate: 98.5
└─ ...other fields
```

## API Endpoints

```
1. UPDATE LOCATION (Shipper)
   POST /api/delivery/shipper/location

   Request:
   {
       latitude: 10.7769,
       longitude: 106.7009,
       address: "10.7769, 106.7009"
   }

   Response:
   {
       success: true,
       message: "Vị trí được cập nhật",
       data: {
           currentLocation: {
               type: "Point",
               coordinates: [106.7009, 10.7769]
           }
       }
   }

2. GET STAGES WITH LOCATION (Seller)
   GET /api/multi-delivery/stages/:orderDetailId

   Response:
   {
       success: true,
       data: {
           stages: [
               {
                   stageNumber: 1,
                   status: "accepted",
                   assignedShipperId: {
                       firstName: "Hải",
                       currentLocation: {
                           type: "Point",
                           coordinates: [106.7009, 10.7769]
                       }
                   }
               }
           ]
       }
   }
```
