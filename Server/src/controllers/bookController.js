const Book = require('../models/bookModel');
const Category = require('../models/categoryModel');
const { Profile } = require('../models/profileModel');
const fs = require('fs');
const path = require('path');

// [GET] /api/books
exports.getAllBooks = async (req, res) => {
    try {
        const filter = { isPublished: true }; // 🔒 CHỈ lấy published books
        if (req.query.categoryId) filter.categoryId = req.query.categoryId;
        if (req.query.sellerId) filter.sellerId = req.query.sellerId;

        const books = await Book.find(filter)
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: books.length,
            data: books,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy danh sách sách:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/books/featured - Lấy sách nổi bật
exports.getFeaturedBooks = async (req, res) => {
    try {
        const books = await Book.find({ isPublished: true, isFeatured: true })
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: books.length,
            data: books,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sách nổi bật:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/books/seller/my-books - Lấy sách của seller (bao gồm draft)
exports.getSellerBooks = async (req, res) => {
    try {
        const sellerId = req.user?.userId;
        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn phải đăng nhập',
            });
        }

        // Lấy profile của seller
        const profile = await Profile.findOne({ userId: sellerId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ seller',
            });
        }

        // Lấy tất cả sách của seller (bao gồm draft)
        const books = await Book.find({ sellerId: profile._id })
            .populate('categoryId', 'name slug')
            .select('_id title author price stock isPublished discount images')
            .sort({ createdAt: -1 })
            .limit(parseInt(req.query.limit) || 100)
            .lean();

        return res.status(200).json({
            success: true,
            count: books.length,
            data: books,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sách của seller:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/books/:id
exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu tham số id.',
            });
        }

        const book = await Book.findById(id)
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName');

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách.',
            });
        }

        return res.status(200).json({
            success: true,
            data: book,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sách theo id:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/books/:slug
exports.getBookBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ message: 'Slug không được để trống.' });
        }

        const book = await Book.findOne({ slug }).populate('categoryId', 'name slug').populate({
            path: 'sellerId',
            select: 'firstName lastName avatar storeName storeLogo storeDescription rating totalSales _id',
        });

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
        const { slug } = req.params;
        if (!slug)
            return res.status(400).json({
                success: false,
                message: 'Slug danh mục không được để trống.',
            });

        const category = await Category.findOne({ slug });
        if (!category)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục.',
            });

        const books = await Book.find({ categoryId: category._id })
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            category,
            count: books.length,
            data: books,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sách theo danh mục:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [GET] /api/books/:id/related
exports.getRelatedBooks = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({
                success: false,
                message: 'Thiếu tham số id.',
            });

        const base = await Book.findById(id);
        if (!base)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách gốc.',
            });

        const related = await Book.find({
            _id: { $ne: base._id },
            categoryId: base.categoryId,
            tags: { $in: base.tags },
        })
            .limit(10)
            .populate('categoryId', 'name slug')
            .populate('sellerId', 'firstName lastName');

        return res.status(200).json({
            success: true,
            count: related.length,
            data: related,
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy sách liên quan:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [POST] /api/books - Tạo sách ở trạng thái DRAFT (stock=0, isPublished=false)
exports.createBook = async (req, res) => {
    try {
        const body = req.body;
        const required = [
            'title',
            'author',
            'price',
            'categoryId',
            'format',
            'numPages',
            'language',
        ];
        const missing = required.filter((f) => !body[f]);
        if (missing.length) {
            return res.status(400).json({
                success: false,
                message: `Thiếu thông tin bắt buộc: ${missing.join(', ')}`,
            });
        }

        const category = await Category.findById(body.categoryId);
        if (!category)
            return res.status(400).json({
                success: false,
                message: 'Danh mục không hợp lệ.',
            });

        const profile = await Profile.findOne({ userId: req.user.userId });
        if (!profile)
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy hồ sơ người bán.',
            });

        const imagePaths = req.files ? req.files.map((f) => `/uploads/books/${f.filename}`) : [];

        // Parse tags from JSON string if provided
        let tags = [];
        if (body.tags) {
            try {
                tags = typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags;
            } catch (e) {
                tags = Array.isArray(body.tags) ? body.tags : [];
            }
        }

        const book = await Book.create({
            ...body,
            sellerId: profile._id,
            images: imagePaths,
            tags: tags.map((t) => (typeof t === 'string' ? t.trim() : t)),
            stock: 0, // 🔒 Draft sách luôn stock = 0
            isPublished: false, // 🔒 Draft sách luôn unpublished
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo sách (draft) thành công. Bước tiếp: Nhập kho → Đăng bán',
            data: book,
        });
    } catch (err) {
        console.error('❌ Lỗi khi tạo sách:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PUT] /api/books/:id
// [PUT] /api/books/:id
exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({
                success: false,
                message: 'Thiếu tham số id.',
            });

        const book = await Book.findById(id);
        if (!book)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách.',
            });

        // Lấy hồ sơ của user hiện tại
        const profile = await Profile.findOne({ userId: req.user.userId });
        if (!profile)
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy hồ sơ người dùng.',
            });

        // Chỉ seller sở hữu sách mới được sửa
        if (book.sellerId.toString() !== profile._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật sách này.',
            });
        }

        // Kiểm tra category update
        if (req.body.categoryId) {
            const category = await Category.findById(req.body.categoryId);
            if (!category)
                return res.status(400).json({
                    success: false,
                    message: 'Danh mục không hợp lệ.',
                });
        }

        // Xử lý ảnh
        if (req.files && req.files.length > 0) {
            for (const imgPath of book.images) {
                const fullPath = path.join(__dirname, '..', imgPath.replace(/^\//, ''));
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            book.images = req.files.map((f) => `/uploads/books/${f.filename}`);
        }

        const allowedFields = [
            'title',
            'author',
            'publisher',
            'publicationYear',
            'language',
            'description',
            'price',
            'stock',
            'discount',
            'tags',
            'numPages',
            'format',
            'categoryId',
        ];

        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                book[key] = req.body[key];
            }
        }

        // Parse tags from JSON string if provided
        if (req.body.tags) {
            let tags = [];
            try {
                tags =
                    typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
            } catch (e) {
                tags = Array.isArray(req.body.tags) ? req.body.tags : [];
            }
            book.tags = tags.map((t) => (typeof t === 'string' ? t.trim() : t));
        }

        await book.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sách thành công.',
            data: book,
        });
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật sách:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [DELETE] /api/books/:id
exports.deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({
                success: false,
                message: 'Thiếu tham số id.',
            });

        const book = await Book.findByIdAndDelete(id);
        if (!book)
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách.',
            });

        return res.status(200).json({
            success: true,
            message: 'Đã xóa sách thành công.',
        });
    } catch (err) {
        console.error('❌ Lỗi khi xóa sách:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};

// [PATCH] /api/books/:id/publish - Đăng bán sách (BƯỚC 3)
/**
 * REQUIREMENTS:
 * - Book.stock > 0 (phải nhập kho trước)
 * - Seller isVerified = true
 * - Thông tin bắt buộc đầy đủ
 * - isPublished: false → true
 */
exports.publishBook = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({
                success: false,
                message: 'Thiếu tham số id.',
            });

        const book = await Book.findById(id);
        if (!book)
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại.',
            });

        // Kiểm tra quyền sở hữu
        const profile = await Profile.findOne({ userId: req.user.userId });
        if (!profile || book.sellerId.toString() !== profile._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền đăng bán sách này.',
            });
        }

        // Kiểm tra stock > 0
        if (book.stock <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể đăng bán sách khi tồn kho = 0. Vui lòng nhập kho trước.',
                required: 'Bước 2: Nhập kho',
            });
        }

        // Kiểm tra thông tin bắt buộc
        const requiredFields = ['title', 'author', 'price', 'categoryId'];
        const missingFields = requiredFields.filter((f) => !book[f]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Thiếu thông tin: ${missingFields.join(', ')}`,
            });
        }

        // Publish book
        book.isPublished = true;
        await book.save();

        return res.status(200).json({
            success: true,
            message: 'Đăng bán sách thành công! 🎉',
            data: book,
        });
    } catch (err) {
        console.error('❌ Lỗi khi đăng bán sách:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi máy chủ.',
        });
    }
};
