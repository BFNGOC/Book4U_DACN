const User = require('../models/userModel');
const RoleRequest = require('../models/roleRequestModel');
const {
    updateProfileForRole,
} = require('../helpers/updateProfileForRoleHelper');

exports.createRoleRequest = async (req, res) => {
    try {
        const { role, details } = req.body;

        if (!['seller', 'shipper'].includes(role)) {
            return res.status(400).json({ message: 'Role không hợp lệ' });
        }

        const user = await User.findById(req.user.userId);
        if (user.role === role) {
            return res.status(400).json({
                message: `Bạn đã là ${role}`,
            });
        }

        const requiredFields =
            role === 'seller'
                ? [
                      'businessName',
                      'taxId',
                      'businessAddress',
                      'bankDetails',
                      'warehouses',
                  ]
                : [
                      'licenseNumber',
                      'vehicleType',
                      'vehicleRegistration',
                      'serviceArea',
                      'bankDetails',
                  ];

        const missingFields = requiredFields.filter((field) => {
            return (
                !details[field] ||
                (typeof details[field] === 'object' &&
                    Object.keys(details[field]).length === 0)
            );
        });

        if (missingFields.length) {
            return res.status(400).json({
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

        if (existing) {
            return res.status(400).json({ message: 'Đã gửi yêu cầu trước đó' });
        }

        const request = await RoleRequest.create({
            userId: req.user.userId,
            role,
            details,
        });

        return res.status(201).json({
            success: true,
            message: 'Yêu cầu đăng ký đã được gửi',
            data: request,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getMyRequests = async (req, res) => {
    const requests = await RoleRequest.find({ userId: req.user.userId });
    res.status(200).json({ success: true, data: requests });
};

exports.getAllRequests = async (req, res) => {
    const requests = await RoleRequest.find().populate('userId', 'email role');
    res.status(200).json({ success: true, data: requests });
};

exports.approveRequest = async (req, res) => {
    try {
        const request = await RoleRequest.findById(req.params.id);
        if (!request)
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

        request.status = 'approved';
        await request.save();

        // Cập nhật role user
        const user = await User.findById(request.userId);
        user.role = request.role;
        await user.save();

        await updateProfileForRole(user);

        res.status(200).json({
            success: true,
            message: 'Đã phê duyệt yêu cầu',
        });
    } catch (err) {
        const status = err.message.includes('Thiếu thông tin bắt buộc')
            ? 400
            : 500;
        res.status(status).json({ success: false, message: err.message });
    }
};

exports.rejectRequest = async (req, res) => {
    const { reason } = req.body;
    const request = await RoleRequest.findById(req.params.id);
    if (!request)
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

    request.status = 'rejected';
    request.reason = reason || 'Không được phê duyệt';
    await request.save();

    res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu' });
};
