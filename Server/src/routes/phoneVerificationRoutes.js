const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
    sendPhoneVerification,
    verifyPhone,
} = require('../controllers/phoneVerificationController');

// Route để gửi mã OTP
router.post('/send-verification', authMiddleware, sendPhoneVerification);

// Route để xác thực mã OTP
router.post('/verify', authMiddleware, verifyPhone);

module.exports = router;
