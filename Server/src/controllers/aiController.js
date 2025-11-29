const AIService = require('../services/aiService');
const Book = require('../models/bookModel');
const { Profile } = require('../models/profileModel');
const Order = require('../models/orderModel');

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.userId;

        // 1. Lấy dữ liệu liên quan từ DB
        const books = await Book.find({});
        const orders = await Order.find({ userId });
        const user = await Profile.findById(userId);

        const contextData = { books, orders, user };

        // 2. Gửi cho AI
        const reply = await AIService.sendMessage(message, contextData);

        res.json({ reply });
    } catch (err) {
        console.error('AI Chat Error:', err);
        res.status(500).json({ error: err.message });
    }
};
