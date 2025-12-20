# GeoJSON Format Fix - Shipper Location Display

## Problem

Shipper location data was being returned from the backend in GeoJSON Point format but the frontend code was trying to access `.latitude` and `.longitude` properties that don't exist in GeoJSON objects.

### Data Format Mismatch

**API Response Format (GeoJSON Point):**

```javascript
{
  type: "Point",
  coordinates: [longitude, latitude]  // Note: coordinates are [lng, lat], not [lat, lng]
}
```

**Frontend Expected Format:**

```javascript
{
  latitude: number,
  longitude: number
}
```

## Root Cause

The shipper's `currentLocation` field in the Profile model is stored as a GeoJSON Point:

```javascript
// profileModel.js line 172-175
currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
}
```

This is the MongoDB geospatial format, but the frontend code didn't handle this conversion.

## Solution Implemented

Added a coordinate conversion helper function in `DeliveryStageTracker.jsx` that:

1. Detects GeoJSON Point format
2. Extracts coordinates and correctly converts from [lng, lat] to {latitude, longitude}
3. Also handles direct lat/lng format for backward compatibility
4. Returns null if location data is invalid

### Code Changes

**File:** `Client/Book4U/src/components/tracking/DeliveryStageTracker.jsx`

**New Helper Function (Lines 486-502):**

```jsx
const getCoordinates = (location) => {
    if (!location) return null;
    // Handle GeoJSON Point format: { type: "Point", coordinates: [lng, lat] }
    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
        return {
            latitude: location.coordinates[1], // coordinates[1] = latitude
            longitude: location.coordinates[0], // coordinates[0] = longitude
        };
    }
    // Handle direct lat/lng format: { latitude: X, longitude: Y }
    if (location.latitude !== undefined && location.longitude !== undefined) {
        return location;
    }
    return null;
};
```

**Applied to Maps Section:**

-   Converts stage location with: `const stageCoords = getCoordinates(currentStage?.currentLocation);`
-   Converts shipper location with: `const shipperCoords = getCoordinates(currentStage?.assignedShipperId?.currentLocation);`
-   Uses converted coordinates for Google Maps URLs

### 3-Tier Display Priority

1. **Red Pin (Stage GPS):** Shows if stage has currentLocation with valid coordinates
2. **Purple Pin (Shipper GPS):** Shows if shipper has currentLocation with valid coordinates ← **Now works with GeoJSON**
3. **Blue Pin (Province Fallback):** Shows if neither has GPS data, displays region area

## Testing Checklist

-   [ ] Shipper accepts delivery (Stage 1)
-   [ ] Shipper enables location tracking with valid coordinates
-   [ ] Seller views dashboard
-   [ ] Maps display with purple pin showing shipper location
-   [ ] Clicking maps opens Google Maps at shipper's coordinates
-   [ ] Coordinates display as "Latitude, Longitude" format
-   [ ] Works for both Stage 1 and Stage 3 deliveries

## Impact

✅ Shipper location now properly displays on maps when GPS data is available
✅ Handles GeoJSON Point format from MongoDB
✅ Backward compatible with direct lat/lng format
✅ Maintains fallback to province area if GPS unavailable
✅ No changes needed to backend - uses existing data format

## Related Files

-   **Backend Model:** `Server/src/models/profileModel.js` (Line 172)
-   **Backend Controller:** `Server/src/controllers/multiStageDeliveryController.js` (Line 340)
-   **Frontend Component:** `Client/Book4U/src/components/tracking/DeliveryStageTracker.jsx`
