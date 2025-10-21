const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, default: '' },
        image: { type: String, default: null },
        slug: { type: String, unique: true, trim: true },
    },
    { timestamps: true }
);

categorySchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);
