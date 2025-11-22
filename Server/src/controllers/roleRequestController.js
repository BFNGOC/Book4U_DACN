const User = require('../models/userModel');
const {
    Profile,
    SellerProfile,
    ShipperProfile,
    AdminProfile,
} = require('../models/profileModel');
const RoleRequest = require('../models/roleRequestModel');
const {
    updateProfileForRole,
} = require('../helpers/updateProfileForRoleHelper');
const _ = require('lodash');
const { sendEmailHelper } = require('../helpers/sendEmailHelper');

// [POST] /api/role-requests
exports.createRoleRequest = async (req, res) => {
    try {
        const { role, details } = req.body;

        if (!role || !['seller', 'shipper'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role không hợp lệ',
            });
        }

        if (!details || typeof details !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Thiếu details',
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy người dùng' });

        if (user.role === role)
            return res
                .status(400)
                .json({ success: false, message: `Bạn đã là ${role}` });

        let missingFields = [];

        if (!details.firstName?.trim()) missingFields.push('firstName');
        if (!details.lastName?.trim()) missingFields.push('lastName');
        if (!details.primaryPhone?.trim()) missingFields.push('primaryPhone');

        if (role === 'seller') {
            const {
                storeName,
                businessType,
                taxId,
                businessName,
                businessRegistration,
                businessLicenseImages,
                businessAddress,
                bankDetails,
                warehouses,
                identificationNumber,
                identificationImages,
            } = details;

            // ---- Cơ bản ----
            if (!storeName?.trim()) missingFields.push('storeName');
            if (!businessType) missingFields.push('businessType');
            if (!taxId?.trim()) missingFields.push('taxId');
            if (!identificationNumber?.trim())
                missingFields.push('identificationNumber');

            // ---- CCCD ----
            if (
                !identificationImages ||
                !identificationImages.front ||
                !identificationImages.back
            )
                missingFields.push('identificationImages');

            // ---- Loại hình doanh nghiệp ----
            if (businessType === 'business') {
                if (!businessName?.trim()) missingFields.push('businessName');
                if (!businessRegistration?.trim())
                    missingFields.push('businessRegistration');
                if (
                    !businessLicenseImages ||
                    !Array.isArray(businessLicenseImages) ||
                    businessLicenseImages.length === 0
                )
                    missingFields.push('businessLicenseImages');
            }

            // ---- Địa chỉ ----
            if (
                !businessAddress ||
                !businessAddress.street ||
                !businessAddress.ward ||
                !businessAddress.district ||
                !businessAddress.province
            )
                missingFields.push('businessAddress');

            // ---- Ngân hàng ----
            if (
                !bankDetails ||
                !bankDetails.accountName ||
                !bankDetails.accountNumber ||
                !bankDetails.bankName ||
                !bankDetails.branchName
            )
                missingFields.push('bankDetails');

            // ---- Kho hàng ----
            if (!Array.isArray(warehouses) || warehouses.length === 0) {
                missingFields.push('warehouses');
            } else {
                warehouses.forEach((w, idx) => {
                    if (
                        !w.street ||
                        !w.ward ||
                        !w.district ||
                        !w.province ||
                        !w.managerName ||
                        !w.managerPhone
                    )
                        missingFields.push(`warehouses[${idx}]`);
                });
            }
        } else if (role === 'shipper') {
            const {
                driverLicenseNumber,
                driverLicenseImages,
                portraitImage,
                vehicleType,
                vehicleRegistration,
                serviceArea,
                bankDetails,
                identificationNumber,
                identificationImages,
            } = details;

            // GPLX
            if (!driverLicenseNumber?.trim())
                missingFields.push('driverLicenseNumber');
            if (
                !driverLicenseImages ||
                !driverLicenseImages.front ||
                !driverLicenseImages.back
            ) {
                missingFields.push('driverLicenseImages');
            }

            // Ảnh chân dung
            if (!portraitImage?.trim()) missingFields.push('portraitImage');

            // Phương tiện
            if (!vehicleType) missingFields.push('vehicleType');
            if (!vehicleRegistration?.trim())
                missingFields.push('vehicleRegistration');

            // Khu vực hoạt động
            if (!Array.isArray(serviceArea) || serviceArea.length === 0) {
                missingFields.push('serviceArea');
            } else {
                serviceArea.forEach((area, idx) => {
                    if (!area.district || !area.province)
                        missingFields.push(`serviceArea[${idx}]`);
                });
            }

            // Ngân hàng
            if (
                !bankDetails ||
                !bankDetails.accountName ||
                !bankDetails.accountNumber ||
                !bankDetails.bankName ||
                !bankDetails.branchName
            ) {
                missingFields.push('bankDetails');
            }

            // CCCD
            if (!identificationNumber?.trim())
                missingFields.push('identificationNumber');

            if (
                !identificationImages ||
                !identificationImages.front ||
                !identificationImages.back
            ) {
                missingFields.push('identificationImages');
            }
        }

        // --- Kiểm tra trùng request đang chờ ---
        const existingRequest = await RoleRequest.findOne({
            userId: req.user.userId,
            status: { $in: ['pending', 'approved'] },
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message:
                    'Bạn đã có yêu cầu đăng ký vai trò khác đang được xử lý. Vui lòng chờ duyệt hoặc chờ bị từ chối trước khi gửi yêu cầu mới.',
            });
        }

        if (missingFields.length) {
            return res.status(400).json({
                success: false,
                message: `Thiếu thông tin bắt buộc: ${missingFields.join(
                    ', '
                )}`,
            });
        }

        const request = await RoleRequest.create({
            userId: req.user.userId,
            role,
            details,
        });

        return res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu đăng ký thành công',
            data: request,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [GET] /api/role-requests/me
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await RoleRequest.find({ userId: req.user.userId });
        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách yêu cầu của bạn thành công',
            data: requests,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [GET] /api/role-requests/:id
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res
                .status(400)
                .json({ success: false, message: 'Thiếu ID yêu cầu' });
        }

        const request = await RoleRequest.findById(id).populate(
            'userId',
            'email role'
        );
        if (!request) {
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết yêu cầu thành công',
            data: request,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [GET] /api/role-requests  (admin)
// [GET] /api/role-requests?role=seller
// [GET] /api/role-requests?role=shipper
exports.getAllRequests = async (req, res) => {
    try {
        const { role, status } = req.query;

        const filter = {};

        // Validate & filter role nếu có
        if (role) {
            const validRoles = ['seller', 'shipper'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Role không hợp lệ',
                });
            }
            filter.role = role;
        }

        if (status) {
            const validStatus = ['pending', 'approved', 'rejected'];
            if (!validStatus.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status không hợp lệ',
                });
            }
            filter.status = status;
        }

        const requests = await RoleRequest.find(filter)
            .select(
                '_id role status createdAt details.firstName details.lastName'
            )
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách yêu cầu thành công',
            data: requests,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [PATCH] /api/role-requests/:id/approve
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res
                .status(400)
                .json({ success: false, message: 'Thiếu ID yêu cầu' });

        const request = await RoleRequest.findById(id);
        if (!request)
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy yêu cầu' });

        if (request.status === 'approved')
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã được phê duyệt trước đó',
            });
        if (request.status === 'rejected')
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã bị từ chối, không thể phê duyệt lại',
            });

        request.status = 'approved';
        await request.save();
        // Cập nhật role user
        const user = await User.findById(request.userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy người dùng' });

        user.role = request.role;
        await user.save();

        await sendEmailHelper(
            user.email,
            `Yêu cầu đăng ký vai trò ${request.role} của bạn đã được phê duyệt`,
            `Xin chúc mừng!\n\nYêu cầu đăng ký vai trò ${request.role} của bạn đã được phê duyệt.\nBạn có thể đăng nhập và sử dụng tính năng tương ứng.\n\nTrân trọng,\nBook4U`
        );
        let profile;

        if (request.role === 'seller') {
            let baseProfile =
                (await SellerProfile.findOne({ userId: user._id })) ||
                (await Profile.findOne({ userId: user._id }));

            if (baseProfile) {
                profile = await SellerProfile.findById(baseProfile._id);
                if (!profile) {
                    profile = new SellerProfile(baseProfile.toObject());
                    profile.isNew = false;
                    profile._id = baseProfile._id;
                }

                _.merge(profile, request.details);
                profile.profileType = 'seller';
                await profile.save();
            } else {
                profile = await SellerProfile.create({
                    userId: user._id,
                    ...request.details,
                    profileType: 'seller',
                });
            }
        } else if (request.role === 'shipper') {
            let baseProfile =
                (await ShipperProfile.findOne({ userId: user._id })) ||
                (await Profile.findOne({ userId: user._id }));

            if (baseProfile) {
                profile = await ShipperProfile.findById(baseProfile._id);
                if (!profile) {
                    profile = new ShipperProfile(baseProfile.toObject());
                    profile.isNew = false;
                    profile._id = baseProfile._id;
                }

                _.merge(profile, request.details);
                profile.profileType = 'shipper';
                await profile.save();
            } else {
                profile = await ShipperProfile.create({
                    userId: user._id,
                    ...request.details,
                    profileType: 'shipper',
                });
            }
        }

        await updateProfileForRole(user, profile);

        return res.status(200).json({
            success: true,
            message: 'Phê duyệt yêu cầu thành công',
        });
    } catch (err) {
        console.error('Approve error:', err);
        const status = err.message.includes('Thiếu thông tin') ? 400 : 500;
        return res
            .status(status)
            .json({ success: false, message: err.message });
    }
};

// [PATCH] /api/role-requests/:id/reject
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({
                success: false,
                message: 'Tham số id không được để trống.',
            });

        const { reason } = req.body;
        const request = await RoleRequest.findById(id);
        if (!request)
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy yêu cầu' });

        if (request.status === 'rejected')
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã bị từ chối trước đó',
            });
        if (request.status === 'approved')
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã được phê duyệt, không thể từ chối',
            });

        request.status = 'rejected';
        request.reason = reason || 'Không được phê duyệt';
        await request.save();

        const user = await User.findById(request.userId);

        await sendEmailHelper(
            user.email,
            `Yêu cầu đăng ký vai trò ${request.role} bị từ chối`,
            `Xin chào ${user.email},\n\nYêu cầu đăng ký vai trò ${request.role} của bạn đã bị từ chối.\nLý do: ${request.reason}\n\nVui lòng cập nhật thông tin và thử lại.\nBook4U`
        );

        return res
            .status(200)
            .json({ success: true, message: 'Từ chối yêu cầu thành công' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
