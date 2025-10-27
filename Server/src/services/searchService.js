import removeAccents from 'remove-accents';
import Book from '../models/bookModel.js';

export const searchBooks = async (keyword, limit, skip = 0) => {
    const normalized = removeAccents(keyword.toLowerCase());
    const query = {
        searchText: { $regex: normalized, $options: 'i' },
    };

    const books = await Book.find(query).skip(skip).limit(limit);
    const total = await Book.countDocuments(query);

    return { books, total };
};
