import axiosPrivate from '../../utils/api/axiosPrivate.js';
import { fetchHandler } from './fetchHandler.js';

const UPLOAD_API_URL = 'api/uploads';

/**
 * Upload logo cửa hàng (1 ảnh)
 * @param {File} image
 */
export const uploadStoreLogo = (image) => {
    const formData = new FormData();
    formData.append('image', image);

    return fetchHandler(
        axiosPrivate,
        `${UPLOAD_API_URL}/store-logo`,
        formData,
        'Lỗi khi tải lên logo cửa hàng.',
        'POST',
        'multipart/form-data'
    );
};

/**
 * Upload CCCD hoặc CMND (2 ảnh)
 * @param {File[]} images
 */
export const uploadIdentification = (images) => {
    const formData = new FormData();
    images.forEach((img) => formData.append('images', img));

    return fetchHandler(
        axiosPrivate,
        `${UPLOAD_API_URL}/identification`,
        formData,
        'Lỗi khi tải lên ảnh CCCD/CMND.',
        'POST',
        'multipart/form-data'
    );
};

/**
 * Upload giấy phép kinh doanh (2 ảnh)
 * @param {File[]} images
 */
export const uploadBusinessLicense = (images) => {
    const formData = new FormData();
    images.forEach((img) => formData.append('images', img));

    return fetchHandler(
        axiosPrivate,
        `${UPLOAD_API_URL}/business-license`,
        formData,
        'Lỗi khi tải lên giấy phép kinh doanh.',
        'POST',
        'multipart/form-data'
    );
};
