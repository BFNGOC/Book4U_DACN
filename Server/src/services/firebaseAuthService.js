const admin = require('firebase-admin');

// Khởi tạo Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phoneNumber) => {
    try {
        // Create a custom token for the phone number
        const uid = `phone:${phoneNumber}`;
        const otp = generateOTP();

        try {
            await admin.auth().getUser(uid);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                await admin.auth().createUser({
                    uid: uid,
                    phoneNumber: phoneNumber,
                });
            } else {
                throw error;
            }
        }

        // Set custom claims with OTP
        await admin.auth().setCustomUserClaims(uid, {
            phoneVerificationCode: otp,
            phoneVerificationExpires: Date.now() + 5 * 60 * 1000,
        });

        // Create custom token
        const customToken = await admin.auth().createCustomToken(uid);

        return {
            success: true,
            token: customToken,
            otp,
            expires: new Date(Date.now() + 5 * 60 * 1000),
        };
    } catch (error) {
        console.error('Error in sendOTP:', error);
        return { success: false, error: error.message };
    }
};

const verifyPhoneNumber = async (phoneNumber, code) => {
    try {
        const uid = `phone:${phoneNumber}`;

        // Get user and their claims
        const user = await admin.auth().getUser(uid);
        const customClaims = user.customClaims || {};

        // Verify OTP
        if (
            !customClaims.phoneVerificationCode ||
            !customClaims.phoneVerificationExpires
        ) {
            return { success: false, message: 'No verification code found' };
        }

        if (Date.now() > customClaims.phoneVerificationExpires) {
            return { success: false, message: 'Verification code has expired' };
        }

        if (customClaims.phoneVerificationCode !== code) {
            return { success: false, message: 'Invalid verification code' };
        }

        // Clear OTP and mark as verified
        await admin.auth().setCustomUserClaims(uid, {
            phoneVerificationCode: null,
            phoneVerificationExpires: null,
            phoneVerified: true,
        });

        return { success: true };
    } catch (error) {
        console.error('Error in verifyPhoneNumber:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTP,
    verifyPhoneNumber,
};
