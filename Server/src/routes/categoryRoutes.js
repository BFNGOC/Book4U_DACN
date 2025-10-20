const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');

const uploadCategory = createUploader('categories');

router.get('/', categoryController.getAllCategories);

router.get('/:id', categoryController.getCategoryById);

router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin'),
    uploadCategory.single('image'),
    categoryController.createCategory
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    uploadCategory.single('image'),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    categoryController.deleteCategory
);

module.exports = router;
