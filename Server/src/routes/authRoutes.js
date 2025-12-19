const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateUer = require('../middlewares/validate/userValidate');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/register', validateUer.validateRegister, authController.register);

router.post('/login-password', validateUer.validateLogin, authController.loginPassword);

router.post('/login-google', authController.googleLogin);

router.post('/request-otp', authController.requestOtp);

router.post('/verify-otp', authController.verifyOtp);

router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

// Profile routes - Đặt specific routes trước general routes
router.get('/profile/current/me', authMiddleware, authController.getCurrentUserProfile);
router.put('/profile/update', authMiddleware, authController.updateUserProfile);
router.get('/profile/:profileId', authController.getUserProfile);

module.exports = router;
