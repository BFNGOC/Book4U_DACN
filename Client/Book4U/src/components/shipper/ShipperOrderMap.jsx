import { useEffect, useState } from 'react';

export default function ShipperOrderMap({ orders, currentLocation }) {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        // Load Leaflet library
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src =
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => {
            setMapLoaded(true);
            initializeMap();
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.head.removeChild(script);
        };
    }, []);

    const initializeMap = () => {
        const L = window.L;
        if (!L) return;

        const mapContainer = document.getElementById('shipper-map');
        if (!mapContainer) return;

        // Initialize map
        const map = L.map('shipper-map').setView(
            [
                currentLocation?.latitude || 10.7769,
                currentLocation?.longitude || 106.7009,
            ],
            13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add shipper location
        if (currentLocation) {
            L.circleMarker(
                [currentLocation.latitude, currentLocation.longitude],
                {
                    radius: 10,
                    fillColor: '#3b82f6',
                    color: '#1e40af',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                }
            )
                .bindPopup('📍 Vị trí của bạn')
                .addTo(map);
        }

        // Add delivery points
        orders.forEach((order) => {
            if (
                order.shippingAddress?.latitude &&
                order.shippingAddress?.longitude
            ) {
                const color =
                    order.status === 'completed' ? '#10b981' : '#f59e0b';
                L.circleMarker(
                    [
                        order.shippingAddress.latitude,
                        order.shippingAddress.longitude,
                    ],
                    {
                        radius: 8,
                        fillColor: color,
                        color: color,
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.6,
                    }
                )
                    .bindPopup(
                        `<div class="p-2">
                        <p class="font-semibold">${
                            order.shippingAddress?.fullName
                        }</p>
                        <p class="text-sm">${order.shippingAddress?.address}</p>
                        <p class="text-sm font-medium mt-1">${order.totalAmount?.toLocaleString()} ₫</p>
                    </div>`
                    )
                    .addTo(map);
            }
        });

        // Fit bounds
        map.invalidateSize();
    };

    if (!mapLoaded) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Đang tải bản đồ...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div
                id="shipper-map"
                className="w-full h-96 md:h-screen"
                style={{ minHeight: '500px' }}></div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 border-t">
                <div className="flex gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                            📍 Vị trí của bạn
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                            📦 Đang giao
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                            ✅ Hoàn thành
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
