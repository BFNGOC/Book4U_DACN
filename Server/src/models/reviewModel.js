const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        // 📚 ID của sách được đánh giá
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
            index: true,
        },

        // 👤 ID của người dùng đánh giá
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // � ID của profile người đánh giá (để lấy firstName, lastName, avatar)
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true,
        },

        // �📦 ID của đơn hàng (để xác minh mua hàng)
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },

        // ⭐ Đánh giá (1-5 sao)
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        // 💬 Nội dung đánh giá
        comment: {
            type: String,
            required: true,
            maxlength: 1000,
        },

        // 🖼️ Hình ảnh đánh giá
        images: [{ type: String }],

        // 👍 Số lượng like
        likes: {
            type: Number,
            default: 0,
            min: 0,
        },

        // 🚫 Trạng thái (active, deleted)
        status: {
            type: String,
            enum: ['active', 'deleted'],
            default: 'active',
        },
    },
    { timestamps: true }
);

// Index để tìm kiếm nhanh
reviewSchema.index({ bookId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, status: 1 });
reviewSchema.index({ orderId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
