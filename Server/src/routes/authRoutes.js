const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateUer = require('../middlewares/validate/userValidate');

router.post('/register', validateUer.validateRegister, authController.register);

router.post('/login-password', validateUer.validateLogin, authController.loginPassword);

router.post('/login-google', authController.googleLogin);

router.post('/request-otp', authController.requestOtp);

router.post('/verify-otp', authController.verifyOtp);

router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

module.exports = router;
