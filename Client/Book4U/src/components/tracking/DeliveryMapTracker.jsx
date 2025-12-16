import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader, AlertCircle } from 'lucide-react';
import { multiDeliveryApi } from '@/services/api/multiDeliveryApi';

/**
 * ============================================================
 * DELIVERY MAP TRACKER COMPONENT
 * ============================================================
 * Hiển thị delivery stages trên Google Maps
 * - Warehouse location
 * - Shipper current location
 * - Customer location
 * - Route lines giữa các điểm
 */

const DeliveryMapTracker = ({ orderDetailId, height = 'h-96' }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Load Google Maps API
    useEffect(() => {
        if (!window.google) {
            loadGoogleMapsAPI();
        } else {
            setMapLoaded(true);
        }
    }, []);

    // Load stages when component mounted or orderDetailId changes
    useEffect(() => {
        if (orderDetailId) {
            fetchDeliveryStages();
            // Polling every 30 seconds
            const interval = setInterval(fetchDeliveryStages, 30000);
            return () => clearInterval(interval);
        }
    }, [orderDetailId]);

    // Initialize map when stages loaded
    useEffect(() => {
        if (mapLoaded && stages.length > 0 && mapContainer.current) {
            initializeMap();
        }
    }, [mapLoaded, stages]);

    const loadGoogleMapsAPI = () => {
        // Check if script already loaded
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
        }`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        script.onerror = () => {
            setError('Không thể tải Google Maps. Vui lòng kiểm tra API key.');
        };
        document.head.appendChild(script);
    };

    const fetchDeliveryStages = async () => {
        try {
            setLoading(true);
            const response = await multiDeliveryApi.getDeliveryStages(
                orderDetailId
            );
            if (response.success) {
                setStages(response.data.stages || []);
                setError(null);
            }
        } catch (err) {
            setError('Không thể tải thông tin vận chuyển');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const initializeMap = () => {
        if (!window.google || !mapContainer.current) return;

        // Calculate center and bounds
        const coordinates = getCoordinates();
        if (coordinates.length === 0) {
            setError('Không có dữ liệu vị trí để hiển thị');
            return;
        }

        const center = calculateCenter(coordinates);

        // Create map
        map.current = new window.google.maps.Map(mapContainer.current, {
            zoom: 7,
            center: center,
            mapTypeId: 'roadmap',
            fullscreenControl: true,
            zoomControl: true,
            streetViewControl: false,
        });

        // Add markers and route
        addMarkers(coordinates);
        drawRoute(coordinates);
    };

    const getCoordinates = () => {
        const coords = [];

        stages.forEach((stage, index) => {
            // From location
            if (stage.fromLocation?.latitude && stage.fromLocation?.longitude) {
                coords.push({
                    lat: stage.fromLocation.latitude,
                    lng: stage.fromLocation.longitude,
                    label:
                        index === 0
                            ? 'Kho'
                            : index === 1
                            ? 'Hub TPHCM'
                            : 'Hub HN',
                    type: 'from',
                    stage: stage.stageNumber,
                });
            }

            // Current location (if shipper picked up)
            if (
                stage.currentLocation?.latitude &&
                stage.currentLocation?.longitude &&
                stage.status !== 'pending'
            ) {
                coords.push({
                    lat: stage.currentLocation.latitude,
                    lng: stage.currentLocation.longitude,
                    label: `Shipper ${stage.stageNumber}`,
                    type: 'current',
                    stage: stage.stageNumber,
                    address: stage.currentLocation.address,
                });
            }

            // To location (last stage = customer)
            if (
                index === stages.length - 1 &&
                stage.toLocation?.latitude &&
                stage.toLocation?.longitude
            ) {
                coords.push({
                    lat: stage.toLocation.latitude,
                    lng: stage.toLocation.longitude,
                    label: 'Khách hàng',
                    type: 'to',
                    stage: stage.stageNumber,
                });
            }
        });

        return coords;
    };

    const calculateCenter = (coordinates) => {
        if (coordinates.length === 0) return { lat: 10.8231, lng: 106.6797 };

        const avg = coordinates.reduce(
            (acc, coord) => ({
                lat: acc.lat + coord.lat,
                lng: acc.lng + coord.lng,
            }),
            { lat: 0, lng: 0 }
        );

        return {
            lat: avg.lat / coordinates.length,
            lng: avg.lng / coordinates.length,
        };
    };

    const addMarkers = (coordinates) => {
        coordinates.forEach((coord) => {
            const icon = {
                from: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                current:
                    'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                to: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }[coord.type];

            const marker = new window.google.maps.Marker({
                position: { lat: coord.lat, lng: coord.lng },
                map: map.current,
                title: coord.label,
                icon: icon,
            });

            // Info window
            const infoContent = `
                <div style="font-family: Arial; font-size: 12px; width: 200px;">
                    <p style="font-weight: bold; margin: 0 0 5px 0;">${
                        coord.label
                    }</p>
                    ${
                        coord.address
                            ? `<p style="margin: 0 0 5px 0; color: #666;">${coord.address}</p>`
                            : ''
                    }
                    <p style="margin: 0; color: #999; font-size: 11px;">
                        Giai đoạn ${coord.stage}
                    </p>
                </div>
            `;

            const infoWindow = new window.google.maps.InfoWindow({
                content: infoContent,
            });

            marker.addListener('click', () => {
                // Close other info windows
                if (window.currentInfoWindow) {
                    window.currentInfoWindow.close();
                }
                infoWindow.open(map.current, marker);
                window.currentInfoWindow = infoWindow;
            });
        });
    };

    const drawRoute = (coordinates) => {
        if (coordinates.length < 2) return;

        // Draw lines between consecutive waypoints
        const pathCoordinates = coordinates.map((c) => ({
            lat: c.lat,
            lng: c.lng,
        }));

        const polyline = new window.google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#FF6B6B',
            strokeOpacity: 0.7,
            strokeWeight: 3,
            map: map.current,
        });
    };

    if (loading) {
        return (
            <div
                className={`${height} flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200`}>
                <div className="flex flex-col items-center gap-2">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600 text-sm">Đang tải bản đồ...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`${height} flex items-center justify-center bg-red-50 rounded-lg border border-red-200`}>
                <div className="flex flex-col items-center gap-2 text-red-700">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-sm text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Map container */}
            <div
                className={`${height} rounded-lg overflow-hidden border border-gray-200 shadow-md`}>
                <div ref={mapContainer} className="w-full h-full" />
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">
                    Chú thích
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-blue-600"></div>
                        <span className="text-gray-700">Điểm bắt đầu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-400 border-2 border-orange-600"></div>
                        <span className="text-gray-700">Vị trí hiện tại</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-green-600"></div>
                        <span className="text-gray-700">Điểm kết thúc</span>
                    </div>
                </div>
            </div>

            {/* Stage summary */}
            {stages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {stages.map((stage) => (
                        <div
                            key={stage._id}
                            className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium text-gray-900">
                                        Giai đoạn {stage.stageNumber}
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1">
                                        {stage.fromLocation?.province} →{' '}
                                        {stage.toLocation?.province}
                                    </p>
                                    <div className="mt-2 inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                                        {stage.status === 'pending'
                                            ? 'Chờ nhận'
                                            : stage.status === 'delivered'
                                            ? 'Đã giao'
                                            : 'Đang xử lý'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryMapTracker;
