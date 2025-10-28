import axiosPublic from '../../utils/api/axiosPublic.js';
import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const BOOK_API_URL = 'api/books';

export const getAllBooks = (params) =>
    fetchHandler(
        axiosPublic,
        BOOK_API_URL,
        params,
        'Lỗi khi lấy danh sách sách.'
    );

export const getBooksByCategorySlug = (slug, params) =>
    fetchHandler(
        axiosPublic,
        `${BOOK_API_URL}/category/${slug}`,
        params,
        'Lỗi khi lấy sách theo danh mục.'
    );

export const getBookById = (id) =>
    fetchHandler(
        axiosPublic,
        `${BOOK_API_URL}/${id}`,
        {},
        'Lỗi khi lấy chi tiết sách.'
    );

export const getRelatedBooks = (id) =>
    fetchHandler(
        axiosPublic,
        `${BOOK_API_URL}/${id}/related`,
        {},
        'Lỗi khi lấy sách liên quan.'
    );

export const createBook = (formData) =>
    fetchHandler(
        axiosPrivate,
        BOOK_API_URL,
        formData,
        'Lỗi khi tạo sách.',
        'POST',
        'multipart/form-data'
    );

export const updateBook = (id, formData) =>
    fetchHandler(
        axiosPrivate,
        `${BOOK_API_URL}/${id}`,
        formData,
        'Lỗi khi cập nhật sách.',
        'PUT',
        'multipart/form-data'
    );

export const deleteBook = (id) =>
    fetchHandler(
        axiosPrivate,
        `${BOOK_API_URL}/${id}`,
        {},
        'Lỗi khi xóa sách.',
        'DELETE'
    );
