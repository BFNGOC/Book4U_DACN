const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');

const uploadBook = createUploader('books');

router.get('/', bookController.getAllBooks);

// Route này phải trước :id routes để tránh conflict
router.get(
    '/seller/my-books',
    authMiddleware,
    roleMiddleware('seller'),
    bookController.getSellerBooks
);

router.get('/category/:slug', bookController.getBooksByCategorySlug);

router.get('/slug/:slug', bookController.getBookBySlug);

router.get('/:id', bookController.getBookById);

router.get('/:id/related', bookController.getRelatedBooks);

router.post(
    '/',
    authMiddleware,
    roleMiddleware('seller'),
    uploadBook.array('images', 10),
    bookController.createBook
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    uploadBook.array('images', 10),
    bookController.updateBook
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    bookController.deleteBook
);

// [PATCH] /api/books/:id/publish - Đăng bán sách (BƯỚC 3)
router.patch(
    '/:id/publish',
    authMiddleware,
    roleMiddleware('seller'),
    bookController.publishBook
);

module.exports = router;
