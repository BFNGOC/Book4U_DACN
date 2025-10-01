const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validateUer = require('../middlewares/validate/userValidate');

router.post('/register', validateUer.validateRegister, userController.register);

router.post('/login-password', validateUer.validateLogin, userController.loginPassword);

router.post('/login-google', userController.googleLogin);

router.post('/request-otp', userController.requestOtp);

router.post('/verify-otp', userController.verifyOtp);

router.post('/forgot-password', userController.forgotPassword);

router.post('/reset-password', userController.resetPassword);

module.exports = router;
