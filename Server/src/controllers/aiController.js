const AIService = require('../services/aiService');
const Book = require('../models/bookModel');
const { Profile } = require('../models/profileModel');
const Order = require('../models/orderModel');
const ChatHistory = require('../models/chatAiModel');

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.userId;

        // Get data from DB
        const books = await Book.find({});
        const orders = await Order.find({ userId });
        const user = await Profile.findById(userId);

        const contextData = { books, orders, user };

        // AI trả JSON đúng format
        const aiResponse = await AIService.sendMessage(message, contextData);

        // ⬇️ Lưu vào DB
        await ChatHistory.create({
            userId,
            userMessage: message,
            aiResponse,
        });

        // Trả về JSON gốc
        res.json(aiResponse);
    } catch (err) {
        console.error('AI Chat Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const history = await ChatHistory.find({ userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        console.error('Get Chat History Error:', err);
        res.status(500).json({ error: err.message });
    }
};
