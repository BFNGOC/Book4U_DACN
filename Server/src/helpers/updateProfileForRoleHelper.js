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
                existingProfile.warehouses.length === 0 ||
                !existingProfile.identificationNumber ||
                !existingProfile.identificationImages
            ) {
                throw new Error('Thiếu thông tin bắt buộc để trở thành seller');
            }
            extraFields = {
                businessName: existingProfile.businessName,
                businessRegistration: existingProfile.businessRegistration,
                businessLicenseImages: existingProfile.businessLicenseImages,
                taxId: existingProfile.taxId,
                storeLogo:
                    existingProfile.storeLogo || '/uploads/default-logo.png',
                storeDescription: existingProfile.storeDescription,
                businessAddress: existingProfile.businessAddress,
                warehouses: existingProfile.warehouses,
                bankDetails: existingProfile.bankDetails,
                rating: existingProfile.rating || 0,
                totalSales: existingProfile.totalSales || 0,
                commissionRate: existingProfile.commissionRate || 10,
                isVerified: existingProfile.isVerified || false,
                verificationDate: existingProfile.verificationDate || null,
                identificationNumber: existingProfile.identificationNumber,
                identificationImages: existingProfile.identificationImages,
            };
            break;

        case 'shipper':
            if (
                !existingProfile.licenseNumber ||
                !existingProfile.vehicleType ||
                !existingProfile.vehicleRegistration ||
                !existingProfile.serviceArea ||
                !existingProfile.bankDetails ||
                !existingProfile.identificationNumber ||
                !existingProfile.identificationImages
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
                currentLocation: existingProfile.currentLocation || {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                rating: existingProfile.rating || 0,
                completedDeliveries: existingProfile.completedDeliveries || 0,
                bankDetails: existingProfile.bankDetails,
                isVerified: existingProfile.isVerified || false,
                verificationDate: existingProfile.verificationDate || null,
                identificationNumber: existingProfile.identificationNumber,
                identificationImages: existingProfile.identificationImages,
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
