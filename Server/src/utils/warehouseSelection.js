/**
 * WAREHOUSE SELECTION UTILITIES
 * =============================
 * Handle intelligent warehouse selection based on:
 * 1. Stock availability
 * 2. Proximity to customer location (Haversine formula)
 * 3. Warehouse capacity & operation status
 */

/**
 * Haversine formula: Calculate distance between two coordinates
 * @param {number} lat1 - Customer latitude
 * @param {number} lon1 - Customer longitude
 * @param {number} lat2 - Warehouse latitude
 * @param {number} lon2 - Warehouse longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Select best warehouse for order fulfillment
 * Strategy: Nearest warehouse with sufficient stock (with fallback list)
 *
 * @param {Object} params
 * @param {Array} params.warehouseStocks - Available warehouse stocks [{warehouseId, warehouseName, quantity, location}]
 * @param {Object} params.customerLocation - {latitude, longitude, address}
 * @param {number} params.requiredQuantity - Quantity needed
 * @returns {Object} Selected warehouse info + fallback list
 * @example
 * selectNearestWarehouse({
 *   warehouseStocks: [
 *     {warehouseId: '123', warehouseName: 'Kho TP.HCM', quantity: 50, location: {lat: 10.77, lon: 106.70}},
 *     {warehouseId: '456', warehouseName: 'Kho Hà Nội', quantity: 30, location: {lat: 21.03, lon: 105.77}}
 *   ],
 *   customerLocation: {latitude: 10.75, longitude: 106.65},
 *   requiredQuantity: 20
 * })
 * // Returns: {
 * //   selected: {warehouseId, warehouseName, quantity, distance, location},
 * //   fallbacks: [{...}, {...}],  // sorted by distance, quantity sufficient
 * //   message: "Selected Kho TP.HCM (5.2 km)"
 * // }
 */
exports.selectNearestWarehouse = ({
    warehouseStocks,
    customerLocation,
    requiredQuantity,
}) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
        throw new Error('Không có kho nào khả dụng');
    }

    if (!requiredQuantity || requiredQuantity <= 0) {
        throw new Error('Số lượng yêu cầu không hợp lệ');
    }

    // Filter warehouses có đủ stock
    const availableWarehouses = warehouseStocks.filter(
        (w) => w.quantity >= requiredQuantity
    );

    if (availableWarehouses.length === 0) {
        throw new Error('Không có kho nào có đủ tồn kho cho đơn hàng này');
    }

    // Nếu không có vị trí khách hàng, chọn kho đầu tiên có đủ stock
    if (
        !customerLocation ||
        !customerLocation.latitude ||
        !customerLocation.longitude
    ) {
        console.log(
            '⚠️ No customer location provided, using first available warehouse'
        );
        const first = availableWarehouses[0];
        return {
            selected: {
                warehouseId: first.warehouseId,
                warehouseName: first.warehouseName,
                quantity: first.quantity,
                distance: null,
                location: first.location,
            },
            fallbacks: availableWarehouses.slice(1).map((w) => ({
                warehouseId: w.warehouseId,
                warehouseName: w.warehouseName,
                quantity: w.quantity,
                distance: null,
                location: w.location,
            })),
            message: `Selected ${first.warehouseName} (no distance calculation)`,
        };
    }

    // Tính khoảng cách đến từng kho
    const warehousesWithDistance = availableWarehouses.map((warehouse) => {
        const distance = calculateDistance(
            customerLocation.latitude,
            customerLocation.longitude,
            warehouse.location.latitude,
            warehouse.location.longitude
        );
        return { ...warehouse, distance };
    });

    // Sắp xếp theo khoảng cách tăng dần
    warehousesWithDistance.sort((a, b) => a.distance - b.distance);

    const selected = warehousesWithDistance[0];
    const fallbacks = warehousesWithDistance.slice(1);

    const message = `Selected ${
        selected.warehouseName
    } (${selected.distance?.toFixed(1)} km away)`;
    console.log(`📍 ${message}`);
    if (fallbacks.length > 0) {
        console.log(
            `   Fallbacks: ${fallbacks
                .map((f) => `${f.warehouseName} (${f.distance?.toFixed(1)} km)`)
                .join(', ')}`
        );
    }

    return {
        selected: {
            warehouseId: selected.warehouseId,
            warehouseName: selected.warehouseName,
            quantity: selected.quantity,
            distance: selected.distance,
            location: selected.location,
        },
        fallbacks: fallbacks.map((w) => ({
            warehouseId: w.warehouseId,
            warehouseName: w.warehouseName,
            quantity: w.quantity,
            distance: w.distance,
            location: w.location,
        })),
        message,
    };
};

/**
 * Get warehouse stock for a product from a seller with location info
 * @param {Object} params
 * @param {Model} params.WarehouseStock - WarehouseStock model
 * @param {Model} params.SellerProfile - SellerProfile model
 * @param {string} params.sellerId - Seller ID
 * @param {string} params.bookId - Book ID
 * @param {Object} params.session - Mongoose session for transaction
 * @returns {Array} Array of warehouse stocks with location info
 */
exports.getWarehouseStocksWithLocation = async ({
    WarehouseStock,
    SellerProfile,
    sellerId,
    bookId,
    session,
}) => {
    // Lấy seller profile để có thông tin warehouses
    const seller = await SellerProfile.findById(sellerId).session(session);

    if (!seller || !seller.warehouses || seller.warehouses.length === 0) {
        throw new Error('Seller không có kho nào');
    }

    // Lấy tất cả warehouse stocks cho product này
    const warehouseStocks = await WarehouseStock.find({
        sellerId,
        bookId,
    }).session(session);

    // Map warehouse location data
    const warehouseStocksWithLocation = warehouseStocks.map((stock) => {
        const warehouseInfo = seller.warehouses.find(
            (w) => w._id.toString() === stock.warehouseId.toString()
        );

        return {
            warehouseId: stock._id,
            sellerId: stock.sellerId,
            bookId: stock.bookId,
            quantity: stock.quantity,
            warehouseName: stock.warehouseName,
            location: {
                latitude: warehouseInfo?.location?.latitude,
                longitude: warehouseInfo?.location?.longitude,
                address: warehouseInfo?.location?.address,
            },
            warehouseData: stock,
        };
    });

    return warehouseStocksWithLocation;
};

/**
 * Validate warehouse has sufficient stock (atomic operation)
 * Prevents race conditions by using findOneAndUpdate
 * @param {Model} WarehouseStock - WarehouseStock model
 * @param {string} warehouseId - Warehouse ID
 * @param {string} sellerId - Seller ID
 * @param {string} bookId - Book ID
 * @param {number} quantity - Quantity to check
 * @param {Object} session - Mongoose session for transaction
 * @returns {Object} Updated warehouse stock or null if failed
 */
exports.validateAndLockWarehouseStock = async (
    WarehouseStock,
    warehouseId,
    sellerId,
    bookId,
    quantity,
    session
) => {
    // Atomic operation: check quantity and update in one go
    // This prevents race conditions where 2 concurrent requests
    // both see sufficient stock and both deduct
    const updated = await WarehouseStock.findOneAndUpdate(
        {
            warehouseId,
            sellerId,
            bookId,
            quantity: { $gte: quantity }, // Only update if quantity is sufficient
        },
        {
            $inc: { quantity: -quantity },
            lastUpdatedStock: new Date(),
        },
        {
            new: true,
            session,
        }
    );

    return updated; // Returns null if condition not met (stock insufficient)
};

module.exports.calculateDistance = calculateDistance;
