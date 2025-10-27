const Book = require('../models/bookModel');
const UserInteraction = require('../models/userInteractionModel');

exports.getUserRecommendations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        let books = [];
        let totalItems = 0;
        let source = 'popular';

        // Nếu chưa đăng nhập → gợi ý theo sách bán chạy
        if (!req.user) {
            totalItems = await Book.countDocuments({ page: 1 });
            books = await Book.find()
                .sort({ soldCount: -1 })
                .skip(skip)
                .limit(limit)
                .select('title author price discount images slug categoryId ratingAvg');

            return res.json({
                success: true,
                source,
                data: books,
                meta: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit),
                },
            });
        }

        const userId = req.user._id;

        // Tìm top thể loại / tác giả mà user tương tác nhiều nhất
        const topInteractions = await UserInteraction.find({ userId })
            .sort({ count: -1 })
            .limit(5)
            .lean();

        // Nếu chưa có dữ liệu tương tác → fallback sang sách bán chạy
        if (topInteractions.length === 0) {
            totalItems = await Book.countDocuments();
            books = await Book.find()
                .sort({ soldCount: -1 })
                .skip(skip)
                .limit(limit)
                .select('title author price discount images slug categoryId ratingAvg');

            return res.json({
                success: true,
                source: 'fallback',
                data: books,
                meta: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit),
                },
            });
        }

        // Lấy danh sách category và author mà user hay tương tác
        const categoryIds = topInteractions.map((t) => t.categoryId).filter(Boolean);
        const authors = topInteractions.map((t) => t.author).filter(Boolean);

        // Gợi ý sách cùng thể loại hoặc cùng tác giả
        const filter = {
            $or: [{ categoryId: { $in: categoryIds } }, { author: { $in: authors } }],
        };

        totalItems = await Book.countDocuments(filter);
        books = await Book.find(filter)
            .skip(skip)
            .limit(limit)
            .select('title author price discount images slug categoryId ratingAvg');

        source = 'personalized';

        return res.json({
            success: true,
            source,
            data: books,
            meta: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi khi gợi ý sách.' });
    }
};
