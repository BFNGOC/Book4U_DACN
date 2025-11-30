import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useCategory } from '@/contexts/CategoryContext';
import ConfirmModal from '@/components/ui/modals/ConfirmModal';

const AVAILABLE_TAGS = [
    'Tiểu thuyết',
    'Truyện dài',
    'Văn học đương đại',
    'Phiêu lưu',
    'Kỳ ảo',
    'Lãng mạn',
    'Huyền bí',
    'Tình yêu',
    'Sống sót – sinh tồn',
    'Hiện đại',
    'Thế giới giả tưởng',
    'Hài hước',
    'Thiếu niên',
    'Lịch sử',
    'Khoa học viễn tưởng',
    'Kinh dị',
    'Tâm lý',
    'Tội phạm',
    'AI – Trí tuệ nhân tạo',
    'Công nghệ',
    'Phát triển phần mềm',
    'Kỹ năng sống',
    'Giao tiếp – ứng xử',
    'Kinh doanh',
    'Đầu tư',
    'Marketing',
];

function ProductModal({ isOpen, onClose, product = null, onSubmit }) {
    const { categories } = useCategory();
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        publisher: '',
        categoryId: '',
        price: '',
        stock: '',
        discount: 0,
        description: '',
        numPages: '',
        format: 'bìa mềm',
        publicationYear: new Date().getFullYear(),
        language: 'Tiếng Việt',
        images: [],
        tags: [],
    });
    const [imagePreview, setImagePreview] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    // Load product data khi chỉnh sửa
    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || '',
                author: product.author || '',
                publisher: product.publisher || '',
                categoryId: product.categoryId?._id || product.categoryId || '',
                price: product.price || '',
                stock: product.stock || '',
                discount: product.discount || 0,
                description: product.description || '',
                numPages: product.numPages || '',
                format: product.format || 'bìa mềm',
                publicationYear:
                    product.publicationYear || new Date().getFullYear(),
                language: product.language || 'Tiếng Việt',
                images: product.images || [],
                tags: product.tags || [],
            });
            setSelectedTags(product.tags || []);
            setImagePreview(product.images || []);
            setImageFiles([]);
        } else {
            resetForm();
        }
    }, [product, isOpen]);

    const handleCancel = () => {
        setShowConfirmCancel(true);
    };

    const handleConfirmCancel = () => {
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            author: '',
            publisher: '',
            categoryId: '',
            price: '',
            stock: '',
            discount: 0,
            description: '',
            numPages: '',
            format: 'bìa mềm',
            publicationYear: new Date().getFullYear(),
            language: 'Tiếng Việt',
            images: [],
            tags: [],
        });
        setImagePreview([]);
        setImageFiles([]);
        setSelectedTags([]);
        setErrors({});
        setShowConfirmCancel(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'price' ||
                name === 'stock' ||
                name === 'discount' ||
                name === 'numPages' ||
                name === 'publicationYear'
                    ? value === ''
                        ? ''
                        : Number(value)
                    : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleTagSelect = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxImages = 10;

        // Check if adding new files would exceed limit
        if (imageFiles.length + files.length > maxImages) {
            setErrors({
                images: `Tối đa ${maxImages} hình ảnh. Hiện tại bạn có ${imageFiles.length} hình.`,
            });
            return;
        }

        const readers = files.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then((results) => {
            setImageFiles((prev) => [...prev, ...files]);
            setImagePreview((prev) => [...prev, ...results]);
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...results],
            }));
        });
    };

    const removeImage = (index) => {
        setImagePreview((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim())
            newErrors.title = 'Tên sách không được để trống';
        if (!formData.author.trim())
            newErrors.author = 'Tác giả không được để trống';
        if (!formData.categoryId)
            newErrors.categoryId = 'Vui lòng chọn danh mục';
        if (!formData.price || formData.price <= 0)
            newErrors.price = 'Giá phải lớn hơn 0';
        // Check if there are new images or existing images (when editing)
        if (imageFiles.length === 0 && imagePreview.length === 0)
            newErrors.images = 'Vui lòng chọn ít nhất 1 hình ảnh';
        if (selectedTags.length === 0)
            newErrors.tags = 'Vui lòng chọn ít nhất 1 tag';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Create FormData for proper file upload
            const submitData = new FormData();

            // Add form fields
            submitData.append('title', formData.title);
            submitData.append('author', formData.author);
            submitData.append('publisher', formData.publisher);
            submitData.append('categoryId', formData.categoryId);
            submitData.append('price', formData.price);
            submitData.append('stock', formData.stock);
            submitData.append('discount', formData.discount);
            submitData.append('description', formData.description);
            submitData.append('numPages', formData.numPages);
            submitData.append('format', formData.format);
            submitData.append('publicationYear', formData.publicationYear);
            submitData.append('language', formData.language);

            // Add tags as JSON array
            submitData.append('tags', JSON.stringify(selectedTags));

            // Add image files
            imageFiles.forEach((file) => {
                submitData.append('images', file);
            });

            await onSubmit(submitData);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            setErrors({ submit: 'Có lỗi xảy ra. Vui lòng thử lại.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {product ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {product
                                ? 'Chỉnh sửa thông tin sản phẩm của bạn'
                                : 'Thêm sản phẩm mới vào cửa hàng'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="space-y-7">
                        {/* Row 1: Title & Author */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Tên sách{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên sách"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Tác giả{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên tác giả"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                                {errors.author && (
                                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                        {errors.author}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Publisher & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Nhà xuất bản
                                </label>
                                <input
                                    type="text"
                                    name="publisher"
                                    value={formData.publisher}
                                    onChange={handleInputChange}
                                    placeholder="Nhập nhà xuất bản"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Danh mục{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white">
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoryId && (
                                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                        {errors.categoryId}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Price & Stock */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Giá bán (₫){' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                                {errors.price && (
                                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                        {errors.price}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Giảm giá (%)
                                </label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Row 4: Format & Publication Year & Pages */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Định dạng
                                </label>
                                <select
                                    name="format"
                                    value={formData.format}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white">
                                    <option value="bìa mềm">Bìa mềm</option>
                                    <option value="bìa cứng">Bìa cứng</option>
                                    <option value="ebook">Ebook</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Năm xuất bản
                                </label>
                                <input
                                    type="number"
                                    name="publicationYear"
                                    value={formData.publicationYear}
                                    onChange={handleInputChange}
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                    Số trang
                                </label>
                                <input
                                    type="number"
                                    name="numPages"
                                    value={formData.numPages}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                Mô tả sản phẩm
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Nhập mô tả chi tiết về sản phẩm"
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none placeholder-gray-400"
                            />
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2.5">
                                Ngôn ngữ
                            </label>
                            <select
                                name="language"
                                value={formData.language}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white">
                                <option value="Tiếng Việt">Tiếng Việt</option>
                                <option value="Tiếng Anh">Tiếng Anh</option>
                                <option value="Tiếng Trung">Tiếng Trung</option>
                                <option value="Tiếng Nhật">Tiếng Nhật</option>
                                <option value="Tiếng Pháp">Tiếng Pháp</option>
                                <option value="Tiếng Đức">Tiếng Đức</option>
                                <option value="Tiếng Tây Ban Nha">
                                    Tiếng Tây Ban Nha
                                </option>
                                <option value="Tiếng Hàn">Tiếng Hàn</option>
                            </select>
                        </div>

                        {/* Tags Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-3.5">
                                Chọn tags{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            {errors.tags && (
                                <p className="text-red-500 text-sm mb-3 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {errors.tags}
                                </p>
                            )}

                            {/* Selected Tags */}
                            {selectedTags.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-2 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-lg border border-blue-100">
                                    {selectedTags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleTagSelect(tag)
                                                }
                                                className="hover:bg-blue-800 p-0.5 rounded transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Available Tags */}
                            <div className="flex flex-wrap gap-2.5">
                                {AVAILABLE_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagSelect(tag)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                            selectedTags.includes(tag)
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:shadow-md active:bg-gray-400'
                                        }`}
                                        disabled={selectedTags.includes(tag)}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Hình ảnh sản phẩm *
                                </label>
                                <span
                                    className={`text-sm font-medium ${
                                        imagePreview.length >= 10
                                            ? 'text-red-600'
                                            : 'text-gray-600'
                                    }`}>
                                    {imagePreview.length}/10
                                </span>
                            </div>
                            {errors.images && (
                                <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">
                                    {errors.images}
                                </p>
                            )}

                            {/* Upload Area */}
                            {imagePreview.length < 10 && (
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="image-input"
                                        disabled={imagePreview.length >= 10}
                                    />
                                    <label
                                        htmlFor="image-input"
                                        className="cursor-pointer block">
                                        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-6 inline-block mb-3">
                                            <Upload className="w-10 h-10 text-blue-600 mx-auto" />
                                        </div>
                                        <p className="text-gray-800 font-semibold">
                                            Kéo thả hoặc click để chọn hình ảnh
                                        </p>
                                        <p className="text-gray-500 text-sm mt-2">
                                            JPG, PNG, GIF • Tối đa 5MB/file •{' '}
                                            {10 - imagePreview.length} vị trí
                                            còn lại
                                        </p>
                                    </label>
                                </div>
                            )}

                            {/* Image Preview Grid */}
                            {imagePreview.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">
                                        Hình ảnh đã chọn
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {imagePreview.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
                                                <img
                                                    src={
                                                        img
                                                            ? img.startsWith(
                                                                  'data:'
                                                              ) ||
                                                              img.startsWith(
                                                                  'blob:'
                                                              )
                                                                ? img
                                                                : `${
                                                                      import.meta
                                                                          .env
                                                                          .VITE_API_URL
                                                                  }${img}`
                                                            : ''
                                                    }
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeImage(idx)
                                                        }
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                                    {idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                                {errors.submit}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 flex gap-3 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 text-gray-700 font-semibold border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-200">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang xử lý...
                            </>
                        ) : product ? (
                            'Cập nhật'
                        ) : (
                            'Tạo sản phẩm'
                        )}
                    </button>
                </div>
            </div>

            <ConfirmModal
                open={showConfirmCancel}
                type="warning"
                title="Xác nhận hủy"
                message="Bạn có chắc muốn hủy? Tất cả thay đổi sẽ không được lưu."
                confirmText="Xác nhận"
                cancelText="Tiếp tục chỉnh sửa"
                onConfirm={handleConfirmCancel}
                onCancel={() => setShowConfirmCancel(false)}
            />
        </div>
    );
}

export default ProductModal;
