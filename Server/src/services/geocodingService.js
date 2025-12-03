/**
 * GEOCODING SERVICE
 * Convert address strings to coordinates using offline database
 * Fallback to online API if needed
 */

const axios = require('axios');

/**
 * Vietnam cities with coordinates
 * Used for quick lookup without API calls
 */
const vietnamCities = {
    'ho chi minh': { lat: 10.7769, lon: 106.7009, name: 'TP. Hồ Chí Minh' },
    hcm: { lat: 10.7769, lon: 106.7009, name: 'TP. Hồ Chí Minh' },
    'tp.hcm': { lat: 10.7769, lon: 106.7009, name: 'TP. Hồ Chí Minh' },
    'sai gon': { lat: 10.7769, lon: 106.7009, name: 'TP. Hồ Chí Minh' },

    'ha noi': { lat: 21.0285, lon: 105.8542, name: 'Hà Nội' },
    hanoi: { lat: 21.0285, lon: 105.8542, name: 'Hà Nội' },

    'da nang': { lat: 16.0544, lon: 108.2022, name: 'Đà Nẵng' },
    danang: { lat: 16.0544, lon: 108.2022, name: 'Đà Nẵng' },

    'hai phong': { lat: 20.8449, lon: 106.6881, name: 'Hải Phòng' },
    haiphong: { lat: 20.8449, lon: 106.6881, name: 'Hải Phòng' },

    'can tho': { lat: 10.0379, lon: 105.7869, name: 'Cần Thơ' },
    canthо: { lat: 10.0379, lon: 105.7869, name: 'Cần Thơ' },

    'nha trang': { lat: 12.2388, lon: 109.1967, name: 'Nha Trang' },
    nhatrang: { lat: 12.2388, lon: 109.1967, name: 'Nha Trang' },

    'quang ninh': { lat: 21.0114, lon: 107.3111, name: 'Quảng Ninh' },
    quangninh: { lat: 21.0114, lon: 107.3111, name: 'Quảng Ninh' },

    'kien giang': { lat: 10.3167, lon: 104.75, name: 'Kiên Giang' },
    kiengiang: { lat: 10.3167, lon: 104.75, name: 'Kiên Giang' },

    'dong nai': { lat: 11.0077, lon: 107.096, name: 'Đồng Nai' },
    dongnai: { lat: 11.0077, lon: 107.096, name: 'Đồng Nai' },
};

/**
 * Vietnam districts with coordinates
 * Quick lookup for common districts
 */
const vietnamDistricts = {
    // HCM districts
    'quan 1': { lat: 10.7758, lon: 106.7019, name: 'Quận 1' },
    q1: { lat: 10.7758, lon: 106.7019, name: 'Quận 1' },
    'quan 3': { lat: 10.7933, lon: 106.6931, name: 'Quận 3' },
    q3: { lat: 10.7933, lon: 106.6931, name: 'Quận 3' },
    'quan 5': { lat: 10.7674, lon: 106.6702, name: 'Quận 5' },
    q5: { lat: 10.7674, lon: 106.6702, name: 'Quận 5' },
    'quan 7': { lat: 10.7303, lon: 106.7198, name: 'Quận 7' },
    q7: { lat: 10.7303, lon: 106.7198, name: 'Quận 7' },
    'quan 10': { lat: 10.7687, lon: 106.6608, name: 'Quận 10' },
    q10: { lat: 10.7687, lon: 106.6608, name: 'Quận 10' },
    'quan 11': { lat: 10.7569, lon: 106.6399, name: 'Quận 11' },
    q11: { lat: 10.7569, lon: 106.6399, name: 'Quận 11' },
    'quan 12': { lat: 10.8459, lon: 106.7263, name: 'Quận 12' },
    q12: { lat: 10.8459, lon: 106.7263, name: 'Quận 12' },
    'binh tan': { lat: 10.8171, lon: 106.6314, name: 'Bình Tân' },
    'tran phu': { lat: 10.8338, lon: 106.5742, name: 'Trần Phú' },
    'binh chanh': { lat: 10.7179, lon: 106.4972, name: 'Bình Chánh' },
    'can gio': { lat: 10.3667, lon: 106.9667, name: 'Cần Giờ' },
    'cu chi': { lat: 11.0506, lon: 106.0806, name: 'Củ Chi' },
    'hoc mon': { lat: 10.8711, lon: 106.4228, name: 'Hóc Môn' },

    // Dong Nai
    'trang bom': { lat: 11.25, lon: 107.05, name: 'Trảng Bom' },
    'bien hoa': { lat: 10.9447, lon: 106.8232, name: 'Biên Hòa' },

    // Ha Noi
    'ba dinh': { lat: 21.0504, lon: 105.8037, name: 'Ba Đình' },
    'hoan kiem': { lat: 21.0285, lon: 105.8542, name: 'Hoàn Kiếm' },
    'dong da': { lat: 21.0258, lon: 105.8355, name: 'Đống Đa' },
};

/**
 * Extract city/district name from address
 * @param {string} address
 * @returns {Object|null} {lat, lon, name} or null
 */
function extractLocationFromAddress(address) {
    if (!address) return null;

    const addressLower = address.toLowerCase().trim();

    // Remove common prefixes
    const cleaned = addressLower
        .replace(/^.*?(số|thôn|xã|phường|quận|thành phố|tỉnh)\s+/i, '')
        .trim();

    // Try to match districts first (more specific)
    for (const [key, value] of Object.entries(vietnamDistricts)) {
        if (cleaned.includes(key)) {
            return value;
        }
    }

    // Then try cities
    for (const [key, value] of Object.entries(vietnamCities)) {
        if (cleaned.includes(key)) {
            return value;
        }
    }

    return null;
}

/**
 * Geocode address to coordinates
 * Strategy: Offline lookup → OpenStreetMap (fallback)
 *
 * @param {string} address - Address string (e.g., "Quận 1, TP.HCM")
 * @returns {Promise<{latitude, longitude, address, accuracy}>}
 */
exports.geocodeAddress = async (address) => {
    try {
        if (!address) {
            throw new Error('Address is required for geocoding');
        }

        console.log(`🔍 Geocoding address: "${address}"`);

        // Step 1: Try offline lookup
        const offlineResult = extractLocationFromAddress(address);
        if (offlineResult) {
            console.log(`✅ Found offline: ${offlineResult.name}`);
            return {
                latitude: offlineResult.lat,
                longitude: offlineResult.lon,
                address: offlineResult.name,
                accuracy: 'city', // Less precise than GPS
                source: 'offline',
            };
        }

        // Step 2: Fallback to OpenStreetMap Nominatim API
        console.log(`📡 Trying OpenStreetMap Nominatim API for: "${address}"`);
        const response = await axios.get(
            'https://nominatim.openstreetmap.org/search',
            {
                params: {
                    q: `${address}, Vietnam`, // Add Vietnam context
                    format: 'json',
                    limit: 1,
                },
                timeout: 5000,
            }
        );

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            console.log(`✅ Found via Nominatim: ${result.display_name}`);
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                address: result.display_name,
                accuracy: 'address',
                source: 'nominatim',
            };
        }

        // Step 3: If all fails, use default HCM location
        console.warn(
            `⚠️ Could not geocode "${address}", using default HCM location`
        );
        return {
            latitude: 10.7769,
            longitude: 106.7009,
            address: 'TP. Hồ Chí Minh (Default)',
            accuracy: 'city_default',
            source: 'default',
        };
    } catch (error) {
        console.error('❌ Geocoding error:', error.message);

        // Fallback to HCM if API fails
        return {
            latitude: 10.7769,
            longitude: 106.7009,
            address: 'TP. Hồ Chí Minh (Fallback)',
            accuracy: 'city_default',
            source: 'fallback',
        };
    }
};

/**
 * Geocode multiple addresses
 * @param {string[]} addresses
 * @returns {Promise<Object[]>}
 */
exports.geocodeAddresses = async (addresses) => {
    if (!Array.isArray(addresses)) {
        throw new Error('addresses must be an array');
    }

    return Promise.all(addresses.map((addr) => this.geocodeAddress(addr)));
};

/**
 * Parse Vietnamese address to extract city/district/ward
 * @param {string} address
 * @returns {Object} {city, district, ward, street}
 */
exports.parseVietnameseAddress = (address) => {
    if (!address) return { city: '', district: '', ward: '', street: '' };

    const parts = address.split(',').map((p) => p.trim());

    return {
        street: parts[0] || '',
        ward: parts[1] || '',
        district: parts[2] || '',
        city: parts[3] || '',
        full: address,
    };
};
