const User = require('../models/userModel');
const { Profile } = require('../models/profileModel');
const { verifyGoogleToken } = require('../services/googleAuth');
const { generateOTP, sendEmailHelper } = require('../helpers/sendEmailHelper');
const {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    generateResetToken,
} = require('../services/authService');

// ===== Request OTP =====
exports.requestOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json({ message: 'Email đã tồn tại' });

        const otp = generateOTP();
        const hashedOtp = await hashPassword(otp);

        await sendEmailHelper(
            email,
            'Mã xác thực đăng ký',
            `Mã OTP của bạn là: ${otp}. Hết hạn sau 5 phút.`
        );

        res.cookie(
            'otpData',
            { email, otp: hashedOtp },
            {
                httpOnly: true,
                maxAge: 5 * 60 * 1000,
            }
        );

        res.json({ message: 'OTP đã gửi, kiểm tra email của bạn' });
    } catch (err) {
        res.status(500).json({
            message: 'Lỗi khi gửi OTP',
            error: err.message,
        });
    }
};

// ===== Verify OTP =====
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const otpData = req.cookies.otpData;

        if (!otpData)
            return res
                .status(400)
                .json({ message: 'OTP hết hạn hoặc không tồn tại' });

        const isValid = await comparePassword(otp, otpData.otp);
        if (!isValid) return res.status(400).json({ message: 'OTP sai' });

        const tempToken = generateToken({ email: otpData.email }, '10m');
        res.clearCookie('otpData');
        res.json({ tempToken });
    } catch (err) {
        res.status(500).json({
            message: 'Lỗi khi xác minh OTP',
            error: err.message,
        });
    }
};

// ===== Register =====
exports.register = async (req, res) => {
    try {
        const { tempToken, password } = req.body;
        const decoded = verifyToken(tempToken);
        const email = decoded.email;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: 'Email đã được sử dụng' });

        const hashedPassword = password ? await hashPassword(password) : null;
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ===== Login bằng password =====
exports.loginPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ message: 'Tài khoản không tồn tại!' });

        const isMatchPassword = await comparePassword(password, user.password);
        if (!isMatchPassword)
            return res.status(401).json({ message: 'Sai mật khẩu!' });

        const token = generateToken({ userId: user._id });
        const profile = await Profile.findOne({ userId: user._id });

        res.status(200).json({
            token,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                ...profile?._doc,
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
        const payload = await verifyGoogleToken(credential);
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ $or: [{ email }, { googleId }] });
        if (!user) {
            user = await User.create({ email, googleId, role: 'customer' });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const token = generateToken({ userId: user._id });
        const profile = await Profile.findOne({ userId: user._id });

        res.status(200).json({
            token,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                ...profile?._doc,
                avatar: profile?.avatar || picture,
            },
        });
    } catch (err) {
        res.status(401).json({ message: 'Đăng nhập Google thất bại' });
    }
};

// ===== Forgot password =====
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: 'Email không tồn tại' });

        const { resetToken, resetExpires } = generateResetToken();
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

// ===== Reset password =====
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ message: 'Thiếu dữ liệu' });

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user)
            return res
                .status(400)
                .json({ message: 'Token không hợp lệ hoặc đã hết hạn' });

        user.password = await hashPassword(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
