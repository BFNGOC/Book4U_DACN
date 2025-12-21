const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');

const uploadReview = createUploader('reviews');

// [POST] /api/reviews/books/:bookId - Tạo đánh giá
router.post(
    '/books/:bookId',
    authMiddleware,
    uploadReview.array('images', 5),
    reviewController.createReview
);

// [GET] /api/reviews/books/:bookId - Lấy danh sách đánh giá
router.get('/books/:bookId', reviewController.getBookReviews);

// [GET] /api/reviews/order/:orderId - Lấy đánh giá từ orderId
router.get(
    '/order/:orderId',
    authMiddleware,
    reviewController.getUserReviewByOrder
);

// [PUT] /api/reviews/:reviewId - Cập nhật đánh giá
router.put(
    '/:reviewId',
    authMiddleware,
    uploadReview.array('images', 5),
    reviewController.updateReview
);

// [DELETE] /api/reviews/:reviewId - Xóa đánh giá
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

module.exports = router;
