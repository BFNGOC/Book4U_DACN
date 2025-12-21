import axiosPublic from '../../utils/api/axiosPublic.js';
import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const REVIEW_API_URL = 'api/reviews';

export const createReview = (bookId, data) =>
    fetchHandler(
        axiosPrivate,
        `${REVIEW_API_URL}/books/${bookId}`,
        data,
        'Lỗi khi tạo đánh giá.',
        'POST',
        'multipart/form-data'
    );

export const getBookReviews = (bookId, params = {}) =>
    fetchHandler(
        axiosPublic,
        `${REVIEW_API_URL}/books/${bookId}`,
        params,
        'Lỗi khi lấy danh sách đánh giá.'
    );

export const updateReview = (reviewId, data) =>
    fetchHandler(
        axiosPrivate,
        `${REVIEW_API_URL}/${reviewId}`,
        data,
        'Lỗi khi cập nhật đánh giá.',
        'PUT',
        'multipart/form-data'
    );

export const deleteReview = (reviewId) =>
    fetchHandler(
        axiosPrivate,
        `${REVIEW_API_URL}/${reviewId}`,
        {},
        'Lỗi khi xóa đánh giá.',
        'DELETE'
    );

export const getUserReviewByOrder = (orderId) =>
    fetchHandler(
        axiosPrivate,
        `${REVIEW_API_URL}/order/${orderId}`,
        {},
        'Lỗi khi lấy đánh giá của đơn hàng.'
    );
