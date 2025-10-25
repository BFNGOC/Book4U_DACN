const twilio = require('twilio');

// Thay thế các giá trị này bằng thông tin tài khoản Twilio của bạn
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSMS = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: to,
        });
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('Error sending SMS:', error);
        return { success: false, error: error.message };
    }
};

const sendOTP = async (phoneNumber) => {
    const otp = generateOTP();
    const message = `Your Book4U verification code is: ${otp}. This code will expire in 5 minutes.`;

    const result = await sendSMS(phoneNumber, message);
    if (result.success) {
        return {
            success: true,
            otp,
            expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
        };
    }
    return { success: false, error: result.error };
};

module.exports = {
    sendOTP,
    generateOTP,
};
