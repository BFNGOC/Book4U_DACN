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
        }

        // --- Kiểm tra trùng request đang chờ ---
        const existing = await RoleRequest.findOne({
            userId: req.user.userId,
            role,
            status: 'pending',
        });
        if (existing)
            return res.status(400).json({
                success: false,
                message: 'Đã gửi yêu cầu trước đó, vui lòng chờ xử lý',
            });

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

// [GET] /api/role-requests
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await RoleRequest.find().populate(
            'userId',
            'email role'
        );
        return res.status(200).json({
            success: true,
            message: 'Lấy tất cả yêu cầu thành công',
            data: requests,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// [PUT] /api/role-requests/:id/approve
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

        // Cập nhật trạng thái
        request.status = 'approved';
        await request.save();

        // Cập nhật vai trò người dùng
        const user = await User.findById(request.userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy người dùng' });

        user.role = request.role;
        await user.save();

        // ✅ Cập nhật đúng loại profile
        let profile;
        if (request.role === 'seller') {
            profile = await SellerProfile.findOne({ userId: user._id });

            if (profile) {
                _.merge(profile, request.details);
                await profile.save();
            } else {
                profile = await SellerProfile.create({
                    userId: user._id,
                    ...request.details,
                });
            }
        } else if (request.role === 'shipper') {
            profile = await ShipperProfile.findOne({ userId: user._id });

            if (profile) {
                _.merge(profile, request.details);
                await profile.save();
            } else {
                profile = await ShipperProfile.create({
                    userId: user._id,
                    ...request.details,
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

// [PUT] /api/role-requests/:id/reject
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

        request.status = 'rejected';
        request.reason = reason || 'Không được phê duyệt';
        await request.save();

        return res
            .status(200)
            .json({ success: true, message: 'Từ chối yêu cầu thành công' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
