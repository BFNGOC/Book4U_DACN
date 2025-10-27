const mongoose = require('mongoose');
const slugify = require('slugify');
const removeAccents = require('remove-accents');

const bookSchema = new mongoose.Schema(
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
        slug: { type: String, unique: true },
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
        searchText: { type: String, index: true },
    },
    { timestamps: true }
);

// 🧩 Tự động tạo slug khi đổi title
bookSchema.pre('save', function (next) {
    if (this.isModified('title') || !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    next();
});

// 🔎 Tạo searchText (chuỗi không dấu) khi lưu
bookSchema.pre('save', function (next) {
    const combined = `${this.title} ${this.author} ${(this.tags || []).join(' ')}`;
    this.searchText = removeAccents(combined.toLowerCase());
    next();
});

// ⚙️ Tạo searchText cho insertMany
bookSchema.pre('insertMany', function (next, docs) {
    for (const doc of docs) {
        const combined = `${doc.title} ${doc.author} ${(doc.tags || []).join(' ')}`;
        doc.searchText = removeAccents(combined.toLowerCase());
        // tạo luôn slug nếu chưa có
        if (!doc.slug) {
            doc.slug = slugify(doc.title, { lower: true, strict: true });
        }
    }
    next();
});

module.exports = mongoose.model('Book', bookSchema);
