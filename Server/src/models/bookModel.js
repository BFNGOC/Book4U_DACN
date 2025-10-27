const mongoose = require('mongoose');
const slugify = require('slugify');
const removeAccents = require('remove-accents');

const bookSchema = new mongoose.Schema(
    {
        // 🧍‍♂️ ID của người bán (liên kết đến Profile)
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },

        // 📂 ID của danh mục (liên kết đến Category)
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },

        // 📘 Tên sách
        title: { type: String, required: true, trim: true },

        // 🔗 Đường dẫn slug tự sinh từ title (dùng cho URL thân thiện)
        slug: { type: String, unique: true },

        // ✍️ Tác giả của sách
        author: { type: String, required: true, trim: true },

        // 🏢 Nhà xuất bản
        publisher: { type: String, trim: true },

        // 📅 Năm xuất bản (giới hạn từ 1900 đến năm hiện tại)
        publicationYear: {
            type: Number,
            min: 1900,
            max: new Date().getFullYear(),
        },

        // 🌐 Ngôn ngữ của sách
        language: { type: String, default: 'Tiếng Việt' },

        // 📝 Mô tả ngắn hoặc chi tiết về sách
        description: { type: String, default: '' },

        // 💰 Giá bán gốc của sách (đơn vị: VNĐ)
        price: { type: Number, required: true, min: 0 },

        // 📦 Số lượng tồn kho
        stock: { type: Number, default: 0, min: 0 },

        // 🔖 Giảm giá (tính theo phần trăm, 0–100)
        discount: { type: Number, default: 0, min: 0, max: 100 },

        // 🖼️ Danh sách hình ảnh của sách (mảng URL)
        images: [{ type: String }],

        // 📊 Số lượng đã bán
        soldCount: { type: Number, default: 0, min: 0 },

        // 🏷️ Các thẻ gắn (tags) liên quan đến sách (vd: “văn học”, “kỹ năng sống”)
        tags: [{ type: String, trim: true }],

        // ⭐ Điểm đánh giá trung bình (0–5)
        ratingAvg: { type: Number, default: 0, min: 0, max: 5 },

        // 💬 Số lượng người đánh giá
        ratingCount: { type: Number, default: 0, min: 0 },

        // 📄 Tổng số trang của sách
        numPages: { type: Number, min: 1 },

        // 📚 Định dạng sách (chỉ chấp nhận 1 trong 3 loại dưới)
        format: {
            type: String,
            enum: ['bìa mềm', 'bìa cứng', 'ebook'],
            default: 'bìa mềm',
        },

        // 🔎 Trường dùng để tìm kiếm (chứa title, author, tags đã bỏ dấu)
        searchText: { type: String, index: true },
    },
    { timestamps: true } // ⏰ Tự động thêm createdAt và updatedAt
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
