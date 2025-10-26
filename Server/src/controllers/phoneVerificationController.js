const { Profile } = require('../models/profileModel');
const {
    sendOTP,
    verifyPhoneNumber,
} = require('../services/firebaseAuthService');

exports.sendPhoneVerification = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.user.userId;

        console.log('Sending verification for:', {
            userId,
            phoneNumber,
            userDetails: req.user,
        });

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        const phoneRegex = /^\+84[0-9]{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Số không hợp lệ. Số phải có định dạng +84xxxxxxxxx',
            });
        }

        const userProfile = await Profile.findOne({ userId: userId });
        console.log('Found profile:', userProfile);

        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found',
            });
        }

        // Generate and send OTP
        const otpResult = await sendOTP(phoneNumber);

        if (!otpResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification code',
                error: otpResult.error,
            });
        }

        // Update profile with new phone number
        await Profile.findOneAndUpdate(
            { userId: userId },
            {
                primaryPhone: phoneNumber,
                isPhoneVerified: false,
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Verification code sent successfully',
            expiresAt: otpResult.expires,
        });
    } catch (error) {
        console.error('Error in sendPhoneVerification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.verifyPhone = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.userId;

        console.log('Verifying OTP with:', {
            userId,
            code: '****' + (code || '').slice(-2),
        });

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is required',
            });
        }

        console.log('Searching for profile with userId:', userId);
        const profile = await Profile.findOne({ userId: userId });
        console.log('Found profile:', profile);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
            });
        }

        if (!profile.primaryPhone) {
            return res.status(400).json({
                success: false,
                message: 'No phone number found for verification',
            });
        }

        const verificationResult = await verifyPhoneNumber(
            profile.primaryPhone,
            code
        );

        if (!verificationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code',
                error: verificationResult.error,
            });
        }

        await Profile.findOneAndUpdate(
            { userId: userId },
            { isPhoneVerified: true },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Phone number verified successfully',
        });
    } catch (error) {
        console.error('Error in verifyPhone:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};
