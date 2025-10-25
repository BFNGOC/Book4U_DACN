import { searchBooks } from '../services/searchService.js';

// 🔎 Gợi ý tìm kiếm (autocomplete)
export const suggestBooks = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu từ khóa tìm kiếm (query "q").',
            });
        }

        // Giới hạn gợi ý hiển thị 5, nhưng vẫn lấy tổng total
        const { books, total } = await searchBooks(q, 5);

        return res.status(200).json({
            success: true,
            data: books,
            meta: {
                total,
                limit: 5,
                hasMore: total > 5, // ✅ để FE biết có nên hiện “xem thêm kết quả” hay không
            },
        });
    } catch (err) {
        console.error('❌ Lỗi suggestBooks:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau.',
        });
    }
};

// 🔍 Kết quả tìm kiếm đầy đủ (có phân trang)
export const getSearchResults = async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
        if (!q?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu từ khóa tìm kiếm (query "q").',
            });
        }

        const skip = (page - 1) * limit;
        const { books, total } = await searchBooks(q, Number(limit), skip);

        return res.status(200).json({
            success: true,
            data: books,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('❌ Lỗi getSearchResults:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau.',
        });
    }
};
