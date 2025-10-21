const mongoose = require('mongoose');
const slugify = require('slugify');

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
        tags: [{ type: String, trim: true }],
        ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
        ratingCount: { type: Number, default: 0, min: 0 },
        numPages: { type: Number, min: 1 },
        format: {
            type: String,
            enum: ['bìa mềm', 'bìa cứng', 'ebook'],
            default: 'bìa mềm',
        },
    },
    { timestamps: true }
);

productSchema.pre('save', function (next) {
    if (this.isModified('title') || !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
