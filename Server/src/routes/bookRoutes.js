const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');

const uploadBook = createUploader('books');

router.get('/', bookController.getAllBooks);

router.get('/category/:slug', bookController.getBooksByCategorySlug);

router.get('/:id', bookController.getBookById);

router.get('/:id/related', bookController.getRelatedBooks);

router.post(
    '/',
    authMiddleware,
    roleMiddleware('seller'),
    uploadBook.array('images', 5),
    bookController.createBook
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('seller'),
    uploadBook.array('images', 5),
    bookController.updateBook
);

router.delete('/:id', authMiddleware, roleMiddleware('seller'), bookController.deleteBook);

module.exports = router;
