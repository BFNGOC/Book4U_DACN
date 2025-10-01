const User = require('../models/userModel');
const Profile = require('../models/profileModel');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { verifyGoogleToken } = require('../service/googleAuth');
const { generateOTP, sendEmailHelper } = require('../helpers/sendEmailHelper');

// ===== Request OTP =====
exports.requestOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // check trùng email
        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json({ message: 'Email đã tồn tại' });

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // gửi mail
        await sendEmailHelper(
            email,
            'Mã xác thực đăng ký',
            `Mã OTP của bạn là: ${otp}. Hết hạn sau 5 phút.`
        );

        // lưu otp vào cookie (httponly để client JS không đọc được)
        res.cookie(
            'otpData',
            { email, otp: hashedOtp },
            {
                httpOnly: true,
                maxAge: 5 * 60 * 1000, // 5 phút
            }
        );

        res.json({ message: 'OTP đã gửi, kiểm tra email của bạn' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi gửi OTP', error: err.message });
    }
};

// ===== Verify OTP =====
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const otpData = req.cookies.otpData;

        if (!otpData) return res.status(400).json({ message: 'OTP hết hạn hoặc không tồn tại' });

        const isValid = await bcrypt.compare(otp, otpData.otp);
        if (!isValid) return res.status(400).json({ message: 'OTP sai' });

        // cấp token tạm
        const tempToken = jwt.sign({ email: otpData.email }, process.env.JWT_SECRET, {
            expiresIn: '10m',
        });

        // xoá cookie
        res.clearCookie('otpData');

        res.json({ tempToken });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xác minh OTP', error: err.message });
    }
};

// ===== Register =====
exports.register = async (req, res) => {
    const { tempToken, password } = req.body;

    try {
        // Giải mã token để lấy email
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        const email = decoded.email;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const newUser = new User({ email, password: hashedPassword });

        await newUser.save();

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ===== Login bằng password =====
exports.loginPassword = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại!' });
        }

        const isMatchPassword = await bcrypt.compare(password, user.password);

        if (!isMatchPassword) {
            return res.status(401).json({ message: 'Sai mật khẩu!' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '365d',
        });

        const profile = await Profile.findOne({ userId: user._id });

        res.status(200).json({
            token,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                dateOfBirth: profile?.dateOfBirth,
                phone: profile?.phone,
                addresses: profile?.addresses,
                avatar: profile?.avatar,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ===== Login bằng Google =====
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        // Xác thực với Google
        const payload = await verifyGoogleToken(credential);
        const { email, name, picture, sub: googleId } = payload;

        // Tìm user theo email hoặc googleId
        let user = await User.findOne({ $or: [{ email }, { googleId }] });

        if (!user) {
            // Nếu chưa có user → tạo mới
            user = await User.create({
                email,
                googleId,
                role: 'customer', // hoặc role mặc định bạn muốn
            });
        } else if (!user.googleId) {
            // Nếu user có email nhưng chưa gắn googleId → update
            user.googleId = googleId;
            await user.save();
        }

        // Tạo JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '365d' });

        // Lấy thông tin profile (nếu có)
        const profile = await Profile.findOne({ userId: user._id });

        res.status(200).json({
            token,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                dateOfBirth: profile?.dateOfBirth,
                phone: profile?.phone,
                addresses: profile?.addresses,
                avatar: profile?.avatar || picture,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Đăng nhập Google thất bại' });
    }
};

// 1. Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

        // tạo token reset
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 15 * 60 * 1000; // 15 phút

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendEmailHelper(
            email,
            'Reset Password',
            `Click link sau để đổi mật khẩu: ${resetLink}`
        );

        res.json({ message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 2. Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token là bắt buộc' });
        }

        if (!newPassword) {
            return res.status(400).json({ message: 'Mật khẩu mới là bắt buộc' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
