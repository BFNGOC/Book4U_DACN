import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    createReview,
    updateReview,
    getUserReviewByOrder,
} from '../../services/api/reviewApi.js';

function ReviewForm({ bookId, orderId, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [previewImages, setPreviewImages] = useState([]);

    useEffect(() => {
        if (orderId) {
            checkExistingReview();
        }
    }, [orderId, bookId]);

    const checkExistingReview = async () => {
        try {
            const response = await getUserReviewByOrder(orderId);
            if (response.success && response.data) {
                setExistingReview(response.data);
                setRating(response.data.rating);
                setComment(response.data.comment);
                setIsEditing(true);
            }
        } catch (error) {
            console.log('Không có đánh giá trước đó');
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);

        // Preview
        const previews = files.map((file) => URL.createObjectURL(file));
        setPreviewImages(previews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            toast.error('Vui lòng nhập nội dung đánh giá');
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', comment);
            formData.append('orderId', orderId);
            images.forEach((image) => formData.append('images', image));

            let response;
            if (isEditing && existingReview?._id) {
                response = await updateReview(existingReview._id, formData);
                if (response.success) {
                    toast.success('Cập nhật đánh giá thành công');
                }
            } else {
                response = await createReview(bookId, formData);
                if (response.success) {
                    toast.success('Đánh giá sản phẩm thành công');
                }
            }

            if (response.success) {
                setComment('');
                setRating(5);
                setImages([]);
                setPreviewImages([]);
                onSuccess?.();
            } else {
                toast.error(response.message || 'Lỗi khi gửi đánh giá');
            }
        } catch (error) {
            toast.error('Lỗi khi gửi đánh giá');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Cập nhật đánh giá' : 'Đánh giá sản phẩm'}
            </h3>

            <form onSubmit={handleSubmit}>
                {/* Rating */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xếp hạng <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`text-3xl transition ${
                                    star <= rating
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                }`}>
                                ★
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {rating} / 5 sao
                    </p>
                </div>

                {/* Comment */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung đánh giá{' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="4"
                        maxLength="1000"
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {comment.length} / 1000 ký tự
                    </p>
                </div>

                {/* Images */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hình ảnh (tùy chọn)
                    </label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={loading}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Tối đa 5 ảnh, dung lượng mỗi ảnh tối đa 5MB
                    </p>

                    {/* Image Preview */}
                    {previewImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {previewImages.map((preview, idx) => (
                                <div key={idx} className="relative">
                                    <img
                                        src={preview}
                                        alt={`Preview ${idx}`}
                                        className="w-full h-20 object-cover rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium">
                        {loading ? (
                            <span>Đang gửi...</span>
                        ) : isEditing ? (
                            'Cập nhật đánh giá'
                        ) : (
                            'Gửi đánh giá'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ReviewForm;
