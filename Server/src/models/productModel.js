const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        title: { type: String, required: true, trim: true },
        author: { type: String, required: true, trim: true },
        publisher: { type: String, trim: true },
        publicationYear: {
            type: Number,
            min: 1900,
            max: new Date().getFullYear(),
        },
        language: { type: String, default: 'Tiếng Việt' },
        description: { type: String, default: '' },
        price: { type: Number, required: true, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0, max: 100 },
        images: [{ type: String }],
        soldCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
