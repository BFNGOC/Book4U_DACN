const Review = require('../models/reviewModel');
const Book = require('../models/bookModel');
const OrderDetail = require('../models/orderDetailModel');
const Order = require('../models/orderModel');
const { Profile } = require('../models/profileModel');
const { User } = require('../models/userModel');
const fs = require('fs');
const path = require('path');

// [POST] /api/reviews/books/:bookId - Tạo đánh giá mới
exports.createReview = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { rating, comment, orderId } = req.body;
        const userId = req.user.userId;
        console.log('Creating review for userId:', userId);
        // Validate
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp rating và comment.',
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5.',
            });
        }

        // Kiểm tra sách tồn tại
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại.',
            });
        }

        // Kiểm tra đơn hàng tồn tại và người dùng là chủ đơn hàng
        const orderDetail = await OrderDetail.findById(orderId).populate(
            'mainOrderId'
        );
        if (!orderDetail) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại.',
            });
        }

        // Lấy mainOrder
        const mainOrder = orderDetail.mainOrderId;
        if (!mainOrder || !mainOrder.profileId) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng chính không tồn tại.',
            });
        }

        // Lấy profile của user hiện tại để so sánh
        const currentUserProfile = await Profile.findOne({
            userId: userId,
        });
        console.log('userId:', userId);
        console.log('currentUserProfile:', currentUserProfile);
        console.log('mainOrder.profileId:', mainOrder.profileId);
        if (
            !currentUserProfile ||
            mainOrder.profileId.toString() !== currentUserProfile._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền đánh giá đơn hàng này.',
            });
        }

        // Kiểm tra đơn hàng đã được giao
        if (orderDetail.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đánh giá đơn hàng đã được giao.',
            });
        }

        // Kiểm tra đã đánh giá chưa
        const existingReview = await Review.findOne({
            bookId,
            userId,
            orderId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá sản phẩm này từ đơn hàng này rồi.',
            });
        }

        // Xử lý upload ảnh
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(
                (file) => `/uploads/reviews/${file.filename}`
            );
        }

        // Tạo review
        const review = new Review({
            bookId,
            userId,
            profileId: currentUserProfile._id,
            orderId,
            rating,
            comment,
            images,
        });

        await review.save();

        // Cập nhật rating trung bình của sách
        const reviews = await Review.find({
            bookId,
            status: 'active',
        });

        const avgRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const ratingCount = reviews.length;

        await Book.findByIdAndUpdate(bookId, {
            ratingAvg: avgRating,
            ratingCount,
        });

        return res.status(201).json({
            success: true,
            message: 'Đánh giá được tạo thành công.',
            data: review,
        });
    } catch (error) {
        console.error('❌ Lỗi khi tạo đánh giá:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/reviews/books/:bookId - Lấy danh sách đánh giá của sách (có pagination)
exports.getBookReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Kiểm tra sách tồn tại
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại.',
            });
        }

        // Lấy danh sách review
        const reviews = await Review.find({
            bookId,
            status: 'active',
        })
            .populate('profileId', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({
            bookId,
            status: 'active',
        });

        return res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách đánh giá:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/reviews/:reviewId - Cập nhật đánh giá
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Đánh giá không tồn tại.',
            });
        }

        // Kiểm tra quyền
        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật đánh giá này.',
            });
        }

        // Validate
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5.',
            });
        }

        // Cập nhật
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;

        // Xử lý upload ảnh mới
        if (req.files && req.files.length > 0) {
            // Xóa ảnh cũ
            if (review.images && review.images.length > 0) {
                review.images.forEach((img) => {
                    const filePath = path.join(
                        __dirname,
                        '../../uploads',
                        path.basename(img)
                    );
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
            }

            // Thêm ảnh mới
            const newImages = req.files.map(
                (file) => `/uploads/reviews/${file.filename}`
            );
            review.images = newImages;
        }

        await review.save();

        // Cập nhật rating trung bình của sách
        const reviews = await Review.find({
            bookId: review.bookId,
            status: 'active',
        });

        const avgRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const ratingCount = reviews.length;

        await Book.findByIdAndUpdate(review.bookId, {
            ratingAvg: avgRating,
            ratingCount,
        });

        return res.status(200).json({
            success: true,
            message: 'Đánh giá được cập nhật thành công.',
            data: review,
        });
    } catch (error) {
        console.error('❌ Lỗi khi cập nhật đánh giá:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [DELETE] /api/reviews/:reviewId - Xóa đánh giá
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Đánh giá không tồn tại.',
            });
        }

        // Kiểm tra quyền
        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa đánh giá này.',
            });
        }

        // Xóa ảnh
        if (review.images && review.images.length > 0) {
            review.images.forEach((img) => {
                const filePath = path.join(
                    __dirname,
                    '../../uploads',
                    path.basename(img)
                );
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        // Xóa review
        review.status = 'deleted';
        await review.save();

        // Cập nhật rating trung bình của sách
        const reviews = await Review.find({
            bookId: review.bookId,
            status: 'active',
        });

        if (reviews.length > 0) {
            const avgRating =
                reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            const ratingCount = reviews.length;

            await Book.findByIdAndUpdate(review.bookId, {
                ratingAvg: avgRating,
                ratingCount,
            });
        } else {
            await Book.findByIdAndUpdate(review.bookId, {
                ratingAvg: 0,
                ratingCount: 0,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Đánh giá được xóa thành công.',
        });
    } catch (error) {
        console.error('❌ Lỗi khi xóa đánh giá:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/reviews/order/:orderId - Lấy đánh giá từ orderId
exports.getUserReviewByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const review = await Review.findOne({
            orderId,
            userId,
            status: 'active',
        }).populate('profileId', 'firstName lastName avatar');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá.',
            });
        }

        return res.status(200).json({
            success: true,
            data: review,
        });
    } catch (error) {
        console.error('❌ Lỗi khi lấy đánh giá:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};
