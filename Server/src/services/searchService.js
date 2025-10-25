import Book from '../models/bookModel.js';

export const searchBooks = async (keyword, limit, skip = 0) => {
    const query = {
        $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { author: { $regex: keyword, $options: 'i' } },
            { tags: { $regex: keyword, $options: 'i' } },
        ],
    };

    const books = await Book.find(query).skip(skip).limit(limit);
    const total = await Book.countDocuments(query);

    return { books, total };
};
