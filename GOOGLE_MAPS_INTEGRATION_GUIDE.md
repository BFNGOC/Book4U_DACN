# 🗺️ GOOGLE MAPS INTEGRATION GUIDE

## 📦 Installation

### 1. Install dependency

```bash
cd Client/Book4U
npm install @react-google-maps/api
```

### 2. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable "Maps JavaScript API" + "Geocoding API"
4. Create API key in Credentials
5. Add to `.env`

```env
# Client/.env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

---

## 🎨 Component Implementation

### Basic Map with Markers

```jsx
import {
    GoogleMap,
    LoadScript,
    Marker,
    Polyline,
} from '@react-google-maps/api';
import { useEffect, useRef } from 'react';

const DeliveryMap = ({ stages, currentStage }) => {
    const mapRef = useRef(null);

    const mapContainerStyle = {
        width: '100%',
        height: '600px',
        borderRadius: '8px',
    };

    const center = {
        lat: currentStage?.currentLocation?.latitude || 10.7769,
        lng: currentStage?.currentLocation?.longitude || 106.7009,
    };

    const warehouseLocation = stages[0]?.fromLocation;
    const customerLocation = stages[stages.length - 1]?.toLocation;
    const shipperLocation = currentStage?.currentLocation;

    // Build route polyline
    const routePath = [
        {
            lat: warehouseLocation?.latitude || 10.7769,
            lng: warehouseLocation?.longitude || 106.7009,
        },
        ...(currentStage?.locationHistory?.map((loc) => ({
            lat: loc.latitude,
            lng: loc.longitude,
        })) || []),
        {
            lat: currentStage?.currentLocation?.latitude || 10.8,
            lng: currentStage?.currentLocation?.longitude || 106.72,
        },
    ];

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={['places', 'geometry']}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
                ref={mapRef}
                options={{
                    styles: [
                        {
                            elementType: 'geometry',
                            stylers: [{ color: '#f5f5f5' }],
                        },
                        {
                            elementType: 'labels.icon',
                            stylers: [{ visibility: 'off' }],
                        },
                        {
                            featureType: 'water',
                            elementType: 'geometry',
                            stylers: [{ color: '#c9c9c9' }],
                        },
                    ],
                }}>
                {/* Warehouse marker */}
                {warehouseLocation && (
                    <Marker
                        position={{
                            lat: warehouseLocation.latitude,
                            lng: warehouseLocation.longitude,
                        }}
                        title={warehouseLocation.warehouseName}
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                        }}
                    />
                )}

                {/* Shipper current location */}
                {shipperLocation && (
                    <Marker
                        position={{
                            lat: shipperLocation.latitude,
                            lng: shipperLocation.longitude,
                        }}
                        title="Vị trí hiện tại"
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            scaledSize: new window.google.maps.Size(40, 40),
                        }}
                    />
                )}

                {/* Customer location */}
                {customerLocation && (
                    <Marker
                        position={{
                            lat: customerLocation.latitude,
                            lng: customerLocation.longitude,
                        }}
                        title="Địa chỉ giao hàng"
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        }}
                    />
                )}

                {/* Route polyline */}
                {routePath.length > 1 && (
                    <Polyline
                        path={routePath}
                        options={{
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                            geodesic: true,
                        }}
                    />
                )}
            </GoogleMap>
        </LoadScript>
    );
};

export default DeliveryMap;
```

### Advanced: With InfoWindow

```jsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';

const DeliveryMapWithInfo = ({ stages, currentStage }) => {
    const [selectedMarker, setSelectedMarker] = useState(null);

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap mapContainerStyle={{...}} center={{...}} zoom={12}>
                {/* Markers */}
                <Marker
                    position={{ lat: 10.7769, lng: 106.7009 }}
                    onClick={() => setSelectedMarker('warehouse')}
                />

                {/* InfoWindow */}
                {selectedMarker === 'warehouse' && (
                    <InfoWindow
                        position={{ lat: 10.7769, lng: 106.7009 }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="text-sm">
                            <h3 className="font-bold">Warehouse TPHCM</h3>
                            <p>123 Đường ABC, Quận 1</p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </LoadScript>
    );
};
```

---

## 🔄 Realtime Location Tracking

```jsx
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';
import { useEffect, useState } from 'react';

const RealtimeTracker = ({ stageId }) => {
    const [location, setLocation] = useState(null);
    const [accuracy, setAccuracy] = useState(null);

    useEffect(() => {
        // Poll location every 30 seconds
        const interval = setInterval(async () => {
            try {
                const response = await fetch(
                    `/api/multi-delivery/stages/${stageId}`
                );
                const data = await response.json();
                const currentLocation = data.data.currentLocation;

                setLocation({
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude,
                });
                setAccuracy(currentLocation.accuracy || 50);
            } catch (err) {
                console.error('Error fetching location:', err);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [stageId]);

    if (!location) return <div>Loading...</div>;

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '400px' }}
                center={location}
                zoom={15}>
                {/* Accuracy circle */}
                <Circle
                    center={location}
                    radius={accuracy}
                    options={{
                        fillColor: 'rgba(0, 0, 255, 0.1)',
                        fillOpacity: 0.4,
                        strokeColor: '#0000FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                    }}
                />

                {/* Shipper marker */}
                <Marker position={location} />
            </GoogleMap>
        </LoadScript>
    );
};

export default RealtimeTracker;
```

---

## 📍 Geocoding Helper

```jsx
// services/geocodingService.js

export const geocodeAddress = async (address) => {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
            latitude: location.lat,
            longitude: location.lng,
            address: data.results[0].formatted_address,
        };
    }
    throw new Error('Address not found');
};

export const getReverseGeocode = async (latitude, longitude) => {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`
    );
    const data = await response.json();

    if (data.results.length > 0) {
        return data.results[0].formatted_address;
    }
    return 'Unknown address';
};
```

---

## 🎯 Distance & Duration Calculation

```jsx
import { useState, useEffect } from 'react';

const DistanceCalculator = ({ from, to }) => {
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);

    useEffect(() => {
        const calculateDistance = () => {
            const service = new window.google.maps.DistanceMatrixService();

            service.getDistanceMatrix(
                {
                    origins: [from],
                    destinations: [to],
                    travelMode: 'DRIVING',
                },
                (response, status) => {
                    if (status === 'OK') {
                        const result = response.rows[0].elements[0];
                        setDistance(result.distance.text);
                        setDuration(result.duration.text);
                    }
                }
            );
        };

        if (from && to) {
            calculateDistance();
        }
    }, [from, to]);

    return (
        <div className="bg-blue-50 p-4 rounded-lg">
            <p>
                📏 Khoảng cách: <strong>{distance}</strong>
            </p>
            <p>
                ⏱️ Thời gian: <strong>{duration}</strong>
            </p>
        </div>
    );
};

export default DistanceCalculator;
```

---

## ✅ Updated DeliveryStageTracker with Map

```jsx
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';

const DeliveryStageTracker = ({ orderDetailId, showMap = true }) => {
    // ... existing code ...

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg">
            {/* Timeline */}
            <div>{/* timeline code */}</div>

            {/* Map */}
            {showMap && stages.length > 0 && (
                <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={{
                            width: '100%',
                            height: '400px',
                            borderRadius: '8px'
                        }}
                        center={{
                            lat: currentStage?.currentLocation?.latitude || 10.7769,
                            lng: currentStage?.currentLocation?.longitude || 106.7009,
                        }}
                        zoom={12}
                    >
                        {/* Markers & Polylines */}
                        <Marker position={{...}} />
                        <Polyline path={routePath} />
                    </GoogleMap>
                </LoadScript>
            )}
        </div>
    );
};
```

---

## 🔐 Security Notes

1. **API Key Restrictions:**

    - Restrict to specific HTTP referrers (your domain)
    - Enable only necessary APIs
    - Use quotas to prevent abuse

2. **Cost Optimization:**

    - Use `useMemo` to avoid re-renders
    - Cache responses (Redis)
    - Implement rate limiting

3. **Privacy:**
    - Don't log exact customer locations
    - Use anonymized tracking
    - Get user consent for location sharing

---

## 🚀 Performance Tips

1. **Lazy load maps:**

```jsx
const MapComponent = lazy(() => import('./Map'));

<Suspense fallback={<div>Loading map...</div>}>
    <MapComponent />
</Suspense>;
```

2. **Debounce location updates:**

```jsx
const debouncedUpdate = useMemo(
    () => debounce((location) => updateLocation(location), 1000),
    []
);
```

3. **Use custom markers with SVG:**

```jsx
const customMarker = {
    path: 'M0,0 C-2.67,0 -5.33,1.25 -5.33,5.33 C-5.33,8.96 0,16 0,16 C0,16 5.33,8.96 5.33,5.33 C5.33,1.25 2.67,0 0,0 Z',
    fillColor: '#FF0000',
    fillOpacity: 1,
    scale: 2,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
};
```

---

## 📚 Resources

-   [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
-   [@react-google-maps/api Docs](https://react-google-maps-api-docs.netlify.app/)
-   [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
-   [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)

---

**Ready to see your deliveries on the map! 🗺️✨**
