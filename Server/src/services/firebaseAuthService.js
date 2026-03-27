const otpStore = new Map(); // dùng Redis hoặc MongoDB trong thực tế

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(phoneNumber) {
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
        code: otp,
        expires: Date.now() + 5 * 60 * 1000,
    });
    console.log(`OTP for ${phoneNumber}: ${otp}`);
    return { success: true };
}

async function verifyPhoneNumber(phoneNumber, code) {
    const record = otpStore.get(phoneNumber);
    if (!record) return { success: false, message: 'No OTP found' };
    if (Date.now() > record.expires) return { success: false, message: 'Expired' };
    if (record.code !== code) return { success: false, message: 'Invalid code' };

    otpStore.delete(phoneNumber);
    return { success: true };
}
module.exports = {
    sendOTP,
    verifyPhoneNumber,
};
