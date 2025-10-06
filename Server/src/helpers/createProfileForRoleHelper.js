const {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
} = require('../models/profileModel');

async function createProfileForRole(user, baseData = {}) {
    const shared = {
        userId: user._id,
        firstName: baseData.firstName,
        lastName: baseData.lastName,
        dateOfBirth: baseData.dateOfBirth,
        primaryPhone: baseData.primaryPhone,
        avatar: baseData.avatar,
        addresses: baseData.addresses,
    };

    switch (user.role) {
        case 'seller':
            return SellerProfile.create({
                ...shared,
                businessName: baseData.businessName || 'My Store',
            });
        case 'shipper':
            return ShipperProfile.create({
                ...shared,
                licenseNumber: baseData.licenseNumber || `${user._id}-L`,
                vehicleType: baseData.vehicleType || 'motorcycle',
            });
        case 'admin':
            return AdminProfile.create({
                ...shared,
                department: baseData.department || 'operations',
            });
        default:
            return Profile.create(shared);
    }
}

module.exports = { createProfileForRole };
