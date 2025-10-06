const {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
} = require('../models/profileModel');

async function updateProfileForRole(user) {
    let existingProfile = await Profile.findOne({ userId: user._id });
    if (!existingProfile) return null;

    // dữ liệu chung giữ lại
    const baseData = {
        firstName: existingProfile.firstName,
        lastName: existingProfile.lastName,
        dateOfBirth: existingProfile.dateOfBirth,
        primaryPhone: existingProfile.primaryPhone,
        avatar: existingProfile.avatar,
        addresses: existingProfile.addresses,
    };

    let updatedProfile;

    switch (user.role) {
        case 'seller':
            updatedProfile = await Profile.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        ...baseData,
                        profileType: 'seller', // ép lại discriminator key
                        businessName:
                            existingProfile.businessName || 'My Store',
                        storeLogo:
                            existingProfile.storeLogo ||
                            '/uploads/default-logo.png',
                        rating: existingProfile.rating || 0,
                        totalSales: existingProfile.totalSales || 0,
                        isVerified: existingProfile.isVerified || false,
                    },
                },
                { new: true, upsert: true }
            );
            break;

        case 'shipper':
            updatedProfile = await Profile.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        ...baseData,
                        profileType: 'shipper',
                        licenseNumber:
                            existingProfile.licenseNumber || `${user._id}-L`,
                        vehicleType:
                            existingProfile.vehicleType || 'motorcycle',
                        availability: existingProfile.availability || 'offline',
                        rating: existingProfile.rating || 0,
                        completedDeliveries:
                            existingProfile.completedDeliveries || 0,
                    },
                },
                { new: true, upsert: true }
            );
            break;

        case 'admin':
            updatedProfile = await Profile.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        ...baseData,
                        profileType: 'admin',
                        department: existingProfile.department || 'operations',
                        permissions: existingProfile.permissions || [
                            'view_analytics',
                        ],
                        hireDate: existingProfile.hireDate || Date.now(),
                    },
                },
                { new: true, upsert: true }
            );
            break;

        default:
            updatedProfile = await Profile.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        ...baseData,
                        profileType: 'customer',
                    },
                },
                { new: true }
            );
    }

    return updatedProfile;
}

module.exports = { updateProfileForRole };
