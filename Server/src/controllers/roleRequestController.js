const User = require('../models/userModel');
const RoleRequest = require('../models/roleRequestModel');
const {
    updateProfileForRole,
} = require('../helpers/updateProfileForRoleHelper');

// [POST] /api/role-requests
exports.createRoleRequest = async (req, res) => {
    try {
        const { role, details } = req.body;

        if (!role || !['seller', 'shipper'].includes(role)) {
            return res
                .status(400)
                .json({ success: false, message: 'Role không hợp lệ' });
        }
        if (!details || typeof details !== 'object') {
            return res
                .status(400)
                .json({ success: false, message: 'Thiếu details' });
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

        const requiredFields =
            role === 'seller'
                ? [
                      'businessName',
                      'taxId',
                      'businessAddress',
                      'bankDetails',
                      'warehouses',
                      'identificationNumber',
                      'identificationImages',
                  ]
                : [
                      'licenseNumber',
                      'vehicleType',
                      'vehicleRegistration',
                      'serviceArea',
                      'bankDetails',
                      'identificationNumber',
                      'identificationImages',
                  ];

        const missingFields = requiredFields.filter(
            (f) =>
                !details[f] ||
                (typeof details[f] === 'object' &&
                    Object.keys(details[f]).length === 0)
        );
        if (
            role === 'seller' &&
            details.businessRegistration &&
            !details.businessLicenseImages
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Thiếu hình ảnh giấy đăng ký kinh doanh',
                });
        }
        if (missingFields.length) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: `Thiếu thông tin bắt buộc: ${missingFields.join(
                        ', '
                    )}`,
                });
        }

        const existing = await RoleRequest.findOne({
            userId: req.user.userId,
            role,
            status: 'pending',
        });
        if (existing)
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Đã gửi yêu cầu trước đó, vui lòng chờ xử lý',
                });

        const request = await RoleRequest.create({
            userId: req.user.userId,
            role,
            details,
        });

        return res
            .status(201)
            .json({
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
        return res
            .status(200)
            .json({
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
        return res
            .status(200)
            .json({
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
                .json({
                    success: false,
                    message: 'Tham số id không được để trống.',
                });

        const request = await RoleRequest.findById(id);
        if (!request)
            return res
                .status(404)
                .json({ success: false, message: 'Không tìm thấy yêu cầu' });

        request.status = 'approved';
        await request.save();

        const user = await User.findById(request.userId);
        if (!user)
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'Không tìm thấy người dùng liên quan',
                });

        user.role = request.role;
        await user.save();

        await updateProfileForRole(user);

        return res
            .status(200)
            .json({ success: true, message: 'Phê duyệt yêu cầu thành công' });
    } catch (err) {
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
            return res
                .status(400)
                .json({
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
