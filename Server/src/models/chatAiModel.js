const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    userMessage: { type: String, required: true },
    aiResponse: { type: Object, required: true }, // Lưu JSON trả về
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatHistory', chatSchema);
