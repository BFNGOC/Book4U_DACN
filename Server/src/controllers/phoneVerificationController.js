const { Profile } = require('../models/profileModel');
const {
    sendOTP,
    verifyPhoneNumber,
} = require('../services/firebaseAuthService');

const sendPhoneVerification = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.user._id; // Thay đổi từ .id sang ._id

        console.log('User ID:', userId);
        console.log('Request user:', req.user);
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        // Check if phone number is already verified for another user
        const existingProfile = await Profile.findOne({
            primaryPhone: phoneNumber,
            isPhoneVerified: true,
            userId: { $ne: userId },
        });

        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message:
                    'This phone number is already verified by another user',
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

        // Update profile with phone number
        await Profile.findOneAndUpdate(
            { userId },
            {
                primaryPhone: phoneNumber,
                isPhoneVerified: false,
            }
        );

        // Return the token in response
        res.cookie('phoneVerificationToken', otpResult.token, {
            maxAge: 5 * 60 * 1000, // 5 minutes
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

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

const verifyPhone = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is required',
            });
        }

        console.log('Searching for profile with userId:', userId);
        const profile = await Profile.findOne({ userId });
        console.log('Found profile:', profile);

        // Thử tìm tất cả profile để xem có gì
        const allProfiles = await Profile.find({});
        console.log('All profiles:', allProfiles);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
            });
        }

        if (profile.isPhoneVerified) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is already verified',
            });
        }

        // Verify through Firebase
        const verificationResult = await verifyPhoneNumber(
            profile.primaryPhone,
            code
        );

        if (!verificationResult.success) {
            return res.status(400).json({
                success: false,
                message: verificationResult.message || 'Verification failed',
                error: verificationResult.error,
            });
        }

        // Update profile verification status
        await Profile.findOneAndUpdate({ userId }, { isPhoneVerified: true });

        // Clear session cookie
        res.clearCookie('phoneVerificationSession');

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

module.exports = {
    sendPhoneVerification,
    verifyPhone,
};
