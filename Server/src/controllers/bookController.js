const Book = require('../models/bookModel');
const Category = require('../models/categoryModel');
const { Profile } = require('../models/profileModel');
const fs = require('fs');
const path = require('path');

// [GET] /api/books
exports.getAllBooks = async (req, res) => {
    try {
        const filter = {};
        if (req.query.categoryId) filter.categoryId = req.query.categoryId;
        if (req.query.sellerId) filter.sellerId = req.query.sellerId;

        const books = await Book.find(filter)
            .populate('categoryId', 'name')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [GET] /api/books/:id
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('categoryId', 'name')
            .populate('sellerId', 'firstName lastName');
        if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [GET] /api/books/:slug
exports.getBookBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ message: 'Slug không được để trống.' });
        }

        const book = await Book.findOne({ slug })
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName');

        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách.' });
        }

        return res.status(200).json({
            success: true,
            data: book,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sách theo slug:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/books/category/:slug
exports.getBooksByCategorySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        const books = await Book.find({ categoryId: category._id })
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({ category, books });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [GET] /api/books/:id/related
exports.getRelatedBooks = async (req, res) => {
    try {
        const base = await Book.findById(req.params.id);
        if (!base) return res.status(404).json({ message: 'Không tìm thấy sách' });

        const related = await Book.find({
            _id: { $ne: base._id },
            categoryId: base.categoryId,
            tags: { $in: base.tags },
        })
            .limit(10)
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName');

        res.json(related);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [POST] /api/books
exports.createBook = async (req, res) => {
    try {
        const {
            title,
            author,
            publisher,
            publicationYear,
            language,
            description,
            price,
            stock,
            discount,
            images,
            categoryId,
            tags,
            numPages,
            format,
        } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) return res.status(400).json({ message: 'Danh mục không hợp lệ' });

        const profile = await Profile.findOne({ userId: req.user.userId });
        if (!profile) return res.status(400).json({ message: 'Không tìm thấy hồ sơ người bán' });

        const imagePaths = req.files ? req.files.map((f) => `/uploads/books/${f.filename}`) : [];

        if (!profile) return res.status(400).json({ message: 'Không tìm thấy hồ sơ người bán' });

        const book = await Book.create({
            sellerId: profile._id,
            categoryId,
            title,
            author,
            publisher,
            publicationYear,
            language,
            description,
            price,
            stock,
            discount,
            images: imagePaths,
            tags: tags ? tags.map((t) => t.trim()) : [],
            numPages,
            format,
        });

        res.status(201).json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [PUT] /api/books/:id
exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' });

        if (req.files && req.files.length > 0) {
            book.images.forEach((imgPath) => {
                const fullPath = path.join(__dirname, '..', imgPath.replace(/^\//, ''));
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });

            book.images = req.files.map((f) => `/uploads/books/${f.filename}`);
        }

        Object.assign(book, req.body);
        await book.save();

        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// [DELETE] /api/books/:id
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' });
        res.json({ message: 'Đã xóa sách thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
