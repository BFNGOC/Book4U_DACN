const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        author: { type: String, trim: true },
        count: { type: Number, default: 0 }, // số lần tương tác
    },
    { timestamps: true }
);

userInteractionSchema.index({ userId: 1, categoryId: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
