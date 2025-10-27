// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next(); // không có token vẫn cho qua

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // token sai hoặc hết hạn → vẫn cho qua, nhưng ko set req.user
    }
    next();
};
