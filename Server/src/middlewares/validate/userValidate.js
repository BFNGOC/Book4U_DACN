const { body, validationResult } = require('express-validator');

exports.validateRegister = [
    body('password').isLength({ min: 6 }).withMessage('Password must have at least 6 characters'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Invalid data',
                errors: errors.array(),
            });
        }
        next();
    },
];

exports.validateLogin = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Invalid data',
                errors: errors.array(),
            });
        }
        next();
    },
];
