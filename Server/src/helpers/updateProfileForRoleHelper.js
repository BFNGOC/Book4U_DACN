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

    let extraFields = {};
    switch (user.role) {
        case 'seller':
            // Nếu bất kỳ field required nào trống => throw error
            if (
                !existingProfile.businessName ||
                !existingProfile.taxId ||
                !existingProfile.businessAddress ||
                !existingProfile.bankDetails ||
                !existingProfile.warehouses ||
                existingProfile.warehouses.length === 0
            ) {
                throw new Error('Thiếu thông tin bắt buộc để trở thành seller');
            }
            extraFields = {
                businessName: existingProfile.businessName,
                taxId: existingProfile.taxId,
                storeLogo:
                    existingProfile.storeLogo || '/uploads/default-logo.png',
                rating: existingProfile.rating || 0,
                totalSales: existingProfile.totalSales || 0,
                isVerified: existingProfile.isVerified || false,
            };
            break;

        case 'shipper':
            if (
                !existingProfile.licenseNumber ||
                !existingProfile.vehicleType ||
                !existingProfile.vehicleRegistration ||
                !existingProfile.serviceArea ||
                !existingProfile.bankDetails
            ) {
                throw new Error(
                    'Thiếu thông tin bắt buộc để trở thành shipper'
                );
            }
            extraFields = {
                licenseNumber: existingProfile.licenseNumber,
                vehicleType: existingProfile.vehicleType,
                vehicleRegistration: existingProfile.vehicleRegistration,
                serviceArea: existingProfile.serviceArea,
                availability: existingProfile.availability || 'offline',
                rating: existingProfile.rating || 0,
                completedDeliveries: existingProfile.completedDeliveries || 0,
                bankDetails: existingProfile.bankDetails,
            };
            break;
        case 'admin':
            extraFields = {
                department: existingProfile.department || 'operations',
                permissions: existingProfile.permissions || ['view_analytics'],
                hireDate: existingProfile.hireDate || Date.now(),
            };
            break;
    }

    Object.assign(existingProfile, baseData, extraFields);

    existingProfile.profileType = user.role;

    return await existingProfile.save();
}

module.exports = { updateProfileForRole };
