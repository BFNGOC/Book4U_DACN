const userInteractionModel = require('../models/userInteractionModel');
const bookModel = require('../models/bookModel');

/**
 * trackUserInteraction
 * - userId: ObjectId
 * - bookId: ObjectId
 * - weight: numeric (view=1, addToCart=3, purchase=5) default=1
 */
export const trackUserInteraction = async (userId, bookId, weight = 1) => {
    if (!userId || !bookId) return;

    // lấy thông tin sách (category + author)
    const book = await bookModel.findById(bookId).select('categoryId author').lean();
    if (!book) return;

    const filter = {
        userId,
        categoryId: book.categoryId || null,
        author: book.author || null,
    };

    // upsert: tăng count nếu đã có, tạo mới nếu chưa
    await userInteractionModel.findOneAndUpdate(
        filter,
        { $inc: { count: weight } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};
