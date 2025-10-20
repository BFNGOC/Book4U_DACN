const {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
} = require('../models/profileModel');

async function updateProfileForRole(user) {
    let existingProfile = await Profile.findOne({ userId: user._id });
    if (!existingProfile) return null;

    const baseData = {
        firstName: existingProfile.firstName,
        lastName: existingProfile.lastName,
        dateOfBirth: existingProfile.dateOfBirth,
        primaryPhone: existingProfile.primaryPhone,
        avatar: existingProfile.avatar,
        addresses: existingProfile.addresses,
    };

    let Model;
    let extraFields = {};

    switch (user.role) {
        case 'seller':
            Model = SellerProfile;
            extraFields = {
                businessName: existingProfile.businessName || 'My Store',
                storeLogo:
                    existingProfile.storeLogo || '/uploads/default-logo.png',
                rating: existingProfile.rating || 0,
                totalSales: existingProfile.totalSales || 0,
                isVerified: existingProfile.isVerified || false,
            };
            break;

        case 'shipper':
            Model = ShipperProfile;
            extraFields = {
                licenseNumber: existingProfile.licenseNumber || `${user._id}-L`,
                vehicleType: existingProfile.vehicleType || 'motorcycle',
                availability: existingProfile.availability || 'offline',
                rating: existingProfile.rating || 0,
                completedDeliveries: existingProfile.completedDeliveries || 0,
            };
            break;

        case 'admin':
            Model = AdminProfile;
            extraFields = {
                department: existingProfile.department || 'operations',
                permissions: existingProfile.permissions || ['view_analytics'],
                hireDate: existingProfile.hireDate || Date.now(),
            };
            break;

        default:
            Model = Profile;
    }

    const updatedProfile = await Model.findOneAndUpdate(
        { userId: user._id },
        { $set: { ...baseData, ...extraFields } },
        { new: true, upsert: true }
    );

    return updatedProfile;
}

module.exports = { updateProfileForRole };
