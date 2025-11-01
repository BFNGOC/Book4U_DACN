const {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
} = require('../models/profileModel');

async function updateProfileForRole(user, existingProfile = null) {
    if (!existingProfile) {
        // Tìm profile dựa trên role để chắc chắn lấy đúng discriminator
        switch (user.role) {
            case 'seller':
                existingProfile = await SellerProfile.findOne({
                    userId: user._id,
                });
                break;
            case 'shipper':
                existingProfile = await ShipperProfile.findOne({
                    userId: user._id,
                });
                break;
            case 'admin':
                existingProfile = await AdminProfile.findOne({
                    userId: user._id,
                });
                break;
            default:
                existingProfile = await Profile.findOne({ userId: user._id });
        }
    }

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
            // Kiểm tra các field cơ bản
            if (!existingProfile.businessType) {
                throw new Error('Thiếu loại hình kinh doanh (businessType)');
            }
            if (!existingProfile.storeName?.trim()) {
                throw new Error('Thiếu tên doanh nghiệp (businessName)');
            }
            if (!existingProfile.taxId?.trim()) {
                throw new Error('Thiếu mã số thuế (taxId)');
            }

            // Nếu là doanh nghiệp thì validate thêm
            if (existingProfile.businessType === 'business') {
                if (!existingProfile.businessName?.trim()) {
                    throw new Error('Thiếu tên doanh nghiệp (businessName)');
                }
                if (!existingProfile.businessRegistration?.trim()) {
                    throw new Error(
                        'Thiếu mã đăng ký kinh doanh (businessRegistration)'
                    );
                }
                if (
                    !existingProfile.businessLicenseImages ||
                    !existingProfile.businessLicenseImages.length
                ) {
                    throw new Error(
                        'Thiếu hình ảnh giấy đăng ký kinh doanh (businessLicenseImages)'
                    );
                }
            }

            // Kiểm tra địa chỉ kinh doanh
            if (
                !existingProfile.businessAddress ||
                !existingProfile.businessAddress.street ||
                !existingProfile.businessAddress.ward ||
                !existingProfile.businessAddress.district ||
                !existingProfile.businessAddress.province
            ) {
                throw new Error(
                    'Thiếu thông tin địa chỉ kinh doanh (businessAddress)'
                );
            }

            // Kiểm tra thông tin ngân hàng
            if (
                !existingProfile.bankDetails ||
                !existingProfile.bankDetails.accountName ||
                !existingProfile.bankDetails.accountNumber ||
                !existingProfile.bankDetails.bankName ||
                !existingProfile.bankDetails.branchName
            ) {
                throw new Error('Thiếu thông tin ngân hàng');
            }

            // Kiểm tra kho hàng
            if (
                !existingProfile.warehouses ||
                existingProfile.warehouses.length === 0
            ) {
                throw new Error('Phải có ít nhất một kho hàng (warehouses)');
            }

            // Kiểm tra chi tiết từng kho
            for (const [index, w] of existingProfile.warehouses.entries()) {
                if (!w.street || !w.ward || !w.district || !w.province) {
                    throw new Error(
                        `Kho hàng #${index + 1} thiếu thông tin địa chỉ`
                    );
                }
                if (!w.managerName || !w.managerPhone) {
                    throw new Error(
                        `Kho hàng #${index + 1} thiếu người phụ trách`
                    );
                }
            }

            // Kiểm tra giấy tờ định danh
            if (!existingProfile.identificationNumber?.trim()) {
                throw new Error('Thiếu số định danh (identificationNumber)');
            }
            if (
                !existingProfile.identificationImages ||
                !existingProfile.identificationImages.front ||
                !existingProfile.identificationImages.back
            ) {
                throw new Error(
                    'Thiếu hình ảnh CCCD/CMND (identificationImages)'
                );
            }
            extraFields = {
                businessType: existingProfile.businessType,
                storeName: existingProfile.storeName,
                storeLogo:
                    existingProfile.storeLogo || '/uploads/default-logo.png',
                storeDescription: existingProfile.storeDescription,
                businessName: existingProfile.businessName,
                businessRegistration: existingProfile.businessRegistration,
                businessLicenseImages: existingProfile.businessLicenseImages,
                taxId: existingProfile.taxId,
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
