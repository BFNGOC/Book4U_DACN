# 📱 Frontend Integration Guide - Multi-Stage Delivery

**Ngày:** 16/12/2025  
**Status:** ✅ Ready for Integration

---

## 📋 Tóm tắt Components

| Component                     | File                                    | Mục đích                   | Role     |
| ----------------------------- | --------------------------------------- | -------------------------- | -------- |
| **SellerDeliveryManagement**  | `seller/SellerDeliveryManagement.jsx`   | Seller xem delivery stages | Seller   |
| **ShipperDeliveryManagement** | `shipper/ShipperDeliveryManagement.jsx` | Shipper quản lý orders     | Shipper  |
| **DeliveryStageTracker**      | `tracking/DeliveryStageTracker.jsx`     | Timeline + tracking        | Customer |
| **DeliveryMapTracker**        | `tracking/DeliveryMapTracker.jsx`       | Google Maps hiển thị       | Customer |

---

## 🚀 Integration Steps

### Step 1: Setup Google Maps API

#### 1.1 Get API Key

```bash
# Go to: https://console.cloud.google.com/
# Create new project
# Enable: Maps JavaScript API, Geocoding API
# Create API key
```

#### 1.2 Add to .env

```bash
# Client/Book4U/.env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

#### 1.3 Verify in vite.config.js

```javascript
// Make sure VITE_ prefix is recognized
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': process.env,
    },
});
```

---

### Step 2: Add Components to Pages

#### 2.1 Order Detail / Tracking Page

```jsx
// Client/Book4U/src/pages/order/OrderDetail.jsx
import React, { useEffect, useState } from 'react';
import DeliveryStageTracker from '@/components/tracking/DeliveryStageTracker';
import DeliveryMapTracker from '@/components/tracking/DeliveryMapTracker';

export default function OrderDetail() {
    const { orderDetailId } = useParams();

    return (
        <div className="container py-8">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button className="pb-3 px-4 border-b-2 border-blue-600 font-medium">
                    📍 Tracking
                </button>
                <button className="pb-3 px-4 text-gray-600">📊 Chi tiết</button>
            </div>

            {/* Tracking Tab */}
            <div className="space-y-6">
                {/* Timeline */}
                <div>
                    <h2 className="text-xl font-bold mb-4">
                        Theo dõi vận chuyển
                    </h2>
                    <DeliveryStageTracker orderDetailId={orderDetailId} />
                </div>

                {/* Map */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Bản đồ vị trí</h2>
                    <DeliveryMapTracker
                        orderDetailId={orderDetailId}
                        height="h-96"
                    />
                </div>
            </div>
        </div>
    );
}
```

#### 2.2 Seller Dashboard

```jsx
// Client/Book4U/src/pages/seller/SellerDashboard.jsx
import React, { useState } from 'react';
import SellerDeliveryManagement from '@/components/seller/SellerDeliveryManagement';

export default function SellerDashboard() {
    const [selectedOrder, setSelectedOrder] = useState(null);

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-8">Dashboard Bán Hàng</h1>

            <div className="grid grid-cols-3 gap-6">
                {/* Sidebar: Orders List */}
                <div className="col-span-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-bold mb-4">Đơn hàng gần đây</h3>
                        <div className="space-y-2">
                            {/* Orders list */}
                            {recentOrders.map((order) => (
                                <button
                                    key={order._id}
                                    onClick={() => setSelectedOrder(order._id)}
                                    className={`w-full text-left p-3 rounded-lg transition ${
                                        selectedOrder === order._id
                                            ? 'bg-blue-100 border border-blue-300'
                                            : 'hover:bg-gray-50 border border-gray-200'
                                    }`}>
                                    <p className="font-medium text-sm">
                                        {order.mainOrderId?.profileId
                                            ?.firstName || 'Customer'}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Order ID: {order._id.substring(0, 8)}...
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main: Delivery Tracking */}
                <div className="col-span-2">
                    {selectedOrder ? (
                        <SellerDeliveryManagement
                            orderDetailId={selectedOrder}
                        />
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                            <p>Chọn đơn hàng để xem chi tiết vận chuyển</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

#### 2.3 Shipper Dashboard

```jsx
// Client/Book4U/src/pages/shipper/ShipperDashboard.jsx
import React from 'react';
import ShipperDeliveryManagement from '@/components/shipper/ShipperDeliveryManagement';

export default function ShipperDashboard() {
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-8">Dashboard Giao Hàng</h1>

            {/* Main content */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Stats cards */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Chờ pickup</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Đang vận chuyển</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Đã giao hôm nay</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-yellow-500 mt-2">
                        4.8 ⭐
                    </p>
                </div>
            </div>

            {/* Delivery management */}
            <ShipperDeliveryManagement />
        </div>
    );
}
```

---

## 📍 Advanced: Location & Maps Integration

### Shipper Location Tracking

```jsx
// In ShipperDeliveryManagement component
// Update location when shipper clicks "Lấy hàng"

const handlePickup = async (stageId) => {
    // Get current location from browser
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        // Get address from coordinates (reverse geocoding)
        const address = await getAddressFromCoords(latitude, longitude);

        // Send to backend
        await multiDeliveryApi.pickupPackage(stageId, {
            latitude,
            longitude,
            address,
        });

        alert('Đã lấy hàng thành công!');
    });
};

// Helper: Get address from coordinates
const getAddressFromCoords = async (lat, lng) => {
    if (!window.google) return `${lat}, ${lng}`;

    const geocoder = new window.google.maps.Geocoder();
    try {
        const result = await geocoder.geocode({
            location: { lat, lng },
        });
        return result.results[0]?.formatted_address || `${lat}, ${lng}`;
    } catch (err) {
        return `${lat}, ${lng}`;
    }
};
```

### Realtime Location Updates

```jsx
// Update shipper location periodically while in transit
useEffect(() => {
    if (currentStageId && isPickedUp) {
        const interval = setInterval(async () => {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const address = await getAddressFromCoords(latitude, longitude);

                await multiDeliveryApi.updateShipperLocation(currentStageId, {
                    latitude,
                    longitude,
                    address,
                    status: 'in_transit',
                });
            });
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }
}, [currentStageId, isPickedUp]);
```

---

## 🔄 State Management Pattern

### Using Context for Shared State

```jsx
// Client/Book4U/src/contexts/DeliveryContext.jsx
import React, { createContext, useState, useCallback } from 'react';
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

export const DeliveryContext = createContext();

export const DeliveryProvider = ({ children }) => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStages = useCallback(async (orderDetailId) => {
        try {
            setLoading(true);
            const response = await multiDeliveryApi.getDeliveryStages(
                orderDetailId
            );
            if (response.success) {
                setStages(response.data.stages);
                setError(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const acceptStage = useCallback(async (stageId) => {
        try {
            const response = await multiDeliveryApi.acceptDeliveryStage(
                stageId
            );
            // Update local state
            setStages((prev) =>
                prev.map((s) =>
                    s._id === stageId ? { ...s, status: 'accepted' } : s
                )
            );
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    return (
        <DeliveryContext.Provider
            value={{
                stages,
                loading,
                error,
                fetchStages,
                acceptStage,
            }}>
            {children}
        </DeliveryContext.Provider>
    );
};

// Usage in component
const useDelivery = () => {
    const context = React.useContext(DeliveryContext);
    if (!context) {
        throw new Error('useDelivery must be used within DeliveryProvider');
    }
    return context;
};

export { useDelivery };
```

### Using Context in Components

```jsx
import { useDelivery } from '@/contexts/DeliveryContext';

export default function OrderDetail() {
    const { stages, fetchStages, acceptStage } = useDelivery();
    const { orderDetailId } = useParams();

    useEffect(() => {
        fetchStages(orderDetailId);
    }, [orderDetailId]);

    return (
        <div>
            <DeliveryStageTracker stages={stages} />
        </div>
    );
}
```

---

## 📲 Notification Integration (Optional)

### Toast Notifications

```jsx
import toast from 'react-hot-toast';

const handleAcceptOrder = async (stageId) => {
    try {
        await multiDeliveryApi.acceptDeliveryStage(stageId);
        toast.success('✅ Đã chấp nhận đơn hàng!', {
            duration: 3000,
        });
        // Refresh list
        fetchPendingOrders();
    } catch (error) {
        toast.error('❌ ' + error.message, {
            duration: 3000,
        });
    }
};
```

### Socket.IO Real-time Updates (Optional)

```jsx
import { useEffect } from 'react';
import socketService from '@/services/socketService';

const DeliveryTracker = ({ orderDetailId }) => {
    useEffect(() => {
        // Listen for delivery updates
        socketService.on(`order:${orderDetailId}:updated`, (data) => {
            console.log('Delivery updated:', data);
            setStages(data.stages);
        });

        return () => {
            socketService.off(`order:${orderDetailId}:updated`);
        };
    }, [orderDetailId]);

    return <div>{/* render stages */}</div>;
};
```

---

## 🧪 Testing Integration

### Test Seller Flow

```jsx
// 1. Seller logs in
// 2. Navigate to /seller/dashboard
// 3. Click on an order
// 4. Should see SellerDeliveryManagement component
// 5. Verify 1-3 stages showing
// 6. Click to expand each stage
// 7. Verify location history showing
```

### Test Shipper Flow

```jsx
// 1. Shipper logs in
// 2. Navigate to /shipper/dashboard
// 3. Should see ShipperDeliveryManagement with pending orders
// 4. Click "Nhận đơn hàng"
// 5. Should see acceptance confirmation
// 6. New order should disappear from list after refresh
```

### Test Customer Flow

```jsx
// 1. Customer navigates to /orders/:orderId
// 2. Should see DeliveryStageTracker with timeline
// 3. Should see DeliveryMapTracker with map (if Google Maps API key set)
// 4. Verify location updates every 30 seconds
// 5. Check map shows correct markers
```

---

## 📋 Component Checklist

### SellerDeliveryManagement ✅

-   [ ] Import in seller dashboard page
-   [ ] Pass `orderDetailId` prop
-   [ ] Verify stages loading
-   [ ] Test expand/collapse functionality
-   [ ] Verify location history showing
-   [ ] Test auto-refresh every 60s

### ShipperDeliveryManagement ✅

-   [ ] Import in shipper dashboard page
-   [ ] No props needed (gets from context/token)
-   [ ] Verify pending orders showing
-   [ ] Test "Nhận đơn hàng" button
-   [ ] Verify orders filtered by province
-   [ ] Test auto-refresh every 60s

### DeliveryStageTracker ✅

-   [ ] Import in order detail page
-   [ ] Pass `orderDetailId` and `showMap={true}` props
-   [ ] Verify timeline rendering
-   [ ] Test expand/collapse stages
-   [ ] Verify location history
-   [ ] Test auto-refresh every 30s

### DeliveryMapTracker ✅

-   [ ] Add Google Maps API key to .env
-   [ ] Import in order detail page
-   [ ] Pass `orderDetailId` prop
-   [ ] Verify map loading
-   [ ] Test markers appearing
-   [ ] Test route lines drawing
-   [ ] Verify legend showing
-   [ ] Test info windows on marker click

---

## 🚨 Common Issues & Fixes

### Issue: Map not loading

**Solution:**

```bash
# 1. Check API key in .env
echo $VITE_GOOGLE_MAPS_API_KEY

# 2. Verify API key is enabled for Maps JavaScript API
# https://console.cloud.google.com/

# 3. Check for CORS errors in browser console
# Whitelist your domain in API restrictions

# 4. Test with sample code:
const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 8,
    center: { lat: 10.8, lng: 106.7 },
});
```

### Issue: Stages not showing

**Solution:**

```javascript
// Check response from API
console.log(response.data.stages);

// Verify stages array not empty
if (!stages || stages.length === 0) {
    console.log('No stages found');
}

// Verify stage has required fields
console.log({
    stageNumber: stage.stageNumber,
    status: stage.status,
    fromLocation: stage.fromLocation,
    toLocation: stage.toLocation,
});
```

### Issue: Location not updating

**Solution:**

```javascript
// Check geolocation permission
navigator.permissions.query({ name: 'geolocation' }).then((result) => {
    console.log(result.state); // granted, denied, prompt
});

// Request permission
navigator.geolocation.getCurrentPosition(
    (position) => console.log(position),
    (error) => console.error(error.code, error.message)
);
```

---

## 📚 Reference

### Component Props

#### SellerDeliveryManagement

```typescript
interface Props {
    orderDetailId: string;
}
```

#### ShipperDeliveryManagement

```typescript
interface Props {
    // No props needed
}
```

#### DeliveryStageTracker

```typescript
interface Props {
    orderDetailId: string;
    showMap?: boolean; // default: true
}
```

#### DeliveryMapTracker

```typescript
interface Props {
    orderDetailId: string;
    height?: string; // CSS height, default: 'h-96'
}
```

---

## ✅ Deployment Checklist

-   [ ] Google Maps API key added to .env
-   [ ] All components imported correctly
-   [ ] Routes created for new pages
-   [ ] Navigation links updated
-   [ ] Tested on desktop browser
-   [ ] Tested on mobile browser
-   [ ] Tested geolocation permission flow
-   [ ] Tested with real order data
-   [ ] Verified error handling
-   [ ] Verified auto-refresh works

**Ready to Deploy! 🚀**
