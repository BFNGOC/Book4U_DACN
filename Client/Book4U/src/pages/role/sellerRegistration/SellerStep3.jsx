import { useState, useEffect } from 'react';
import { Info, Building2, User2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import AddressSelector from '@/components/common/AddressSelector';
import { createRoleRequest } from '@/services/api/roleRequestApi';
import {
    uploadIdentification,
    uploadBusinessLicense,
} from '@/services/api/uploadApi';
import { useUser } from '@/contexts/userContext';

const SellerStep3 = ({
    data = {},
    onNext,
    onBack,
    onUpdate,
    startCreatingRequest,
    finishCreatingRequest,
}) => {
    const { user } = useUser();
    const STORAGE_KEY = `sellerRegister_${user?._id}`;
    const [info, setInfo] = useState(() => ({
        businessType: data.info?.businessType || 'individual',
        lastName: data.info?.lastName || user?.lastName || '',
        firstName: data.info?.firstName || user?.firstName || '',
        idNumber: data.info?.idNumber || '',
        taxId: data.info?.taxId || '',
        businessName: data.info?.businessName || '',
        businessRegistration: data.info?.businessRegistration || '',
        businessLicense: data.info?.businessLicense || null,
        idFront: data.info?.idFront || null,
        idBack: data.info?.idBack || null,
        address: data.info?.address || {},
    }));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setInfo({
            businessType: data.info?.businessType || 'individual',
            businessName: data.info?.businessName || '',
            businessRegistration: data.info?.businessRegistration || '',
            lastName: data.info?.lastName || '',
            firstName: data.info?.firstName || '',
            idNumber: data.info?.idNumber || '',
            taxId: data.info?.taxId || '',
            businessLicense: data.info?.businessLicense || null,
            idFront: data.info?.idFront || null,
            idBack: data.info?.idBack || null,
            address: data.info?.address || {},
        });
    }, [data]);

    const isNumber = (value) => /^[0-9]+$/.test(value.trim());

    const validate = () => {
        const newErrors = {};
        if (info.businessType === 'business' && !info.businessName.trim())
            newErrors.businessName = 'Vui lòng nhập tên doanh nghiệp';
        if (!info.lastName.trim())
            newErrors.lastName = 'Vui lòng nhập họ và tên đệm';
        if (!info.firstName.trim()) newErrors.firstName = 'Vui lòng nhập tên';
        if (!info.idNumber.trim()) {
            newErrors.idNumber = 'Vui lòng nhập số định danh';
        } else if (!isNumber(info.idNumber)) {
            newErrors.idNumber = 'Số định danh phải là số';
        }
        if (!info.idFront)
            newErrors.idFront = 'Vui lòng tải lên mặt trước CCCD';
        if (!info.idBack) newErrors.idBack = 'Vui lòng tải lên mặt sau CCCD';

        if (info.businessType === 'individual') {
            if (!info.taxId.trim()) {
                newErrors.taxId = 'Vui lòng nhập mã số thuế thu nhập cá nhân';
            } else if (!isNumber(info.taxId)) {
                newErrors.taxId = 'Mã số thuế phải là số';
            }
        } else {
            if (!info.businessName.trim())
                newErrors.businessName = 'Vui lòng nhập tên doanh nghiệp';
            if (!info.businessRegistration.trim()) {
                newErrors.businessRegistration =
                    'Vui lòng nhập mã số đăng ký kinh doanh';
            } else if (!isNumber(info.businessRegistration)) {
                newErrors.businessRegistration =
                    'Mã số đăng ký kinh doanh phải là số';
            }
            if (!info.taxId.trim()) {
                newErrors.taxId =
                    'Vui lòng nhập mã số thuế doanh nghiệp kinh doanh';
            } else if (!isNumber(info.taxId)) {
                newErrors.taxId = 'Mã số thuế phải là số';
            }
            if (!info.businessLicense)
                newErrors.businessLicense =
                    'Vui lòng tải lên giấy phép đăng ký kinh doanh';
        }

        if (
            !info.address?.province ||
            !info.address?.district ||
            !info.address?.ward
        )
            newErrors.address = 'Vui lòng chọn đầy đủ địa chỉ';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (key, value) => {
        const updated = { ...info, [key]: value };
        setInfo(updated);
        onUpdate && onUpdate({ info: updated });
    };

    const handleFileUpload = async (type, file) => {
        if (!file) return;
        try {
            let res;
            if (type === 'idFront' || type === 'idBack') {
                res = await uploadIdentification([file]);
            } else if (type === 'businessLicense') {
                res = await uploadBusinessLicense([file]);
            }

            if (res?.success && res.data?.paths?.length) {
                const imagePath = res.data.paths[0];
                const updated = { ...info, [type]: imagePath };
                setInfo(updated);
                onUpdate && onUpdate({ info: updated });

                const saved = JSON.parse(
                    localStorage.getItem(STORAGE_KEY) || '{}'
                );
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        ...saved,
                        formData: {
                            ...saved.formData,
                            info: updated,
                        },
                    })
                );
            } else {
                console.error('Upload failed:', res);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleNext = async () => {
        if (!validate()) return;

        try {
            startCreatingRequest?.();
            // ✅ Lấy dữ liệu từ localStorage (vì SellerRegister đã lưu toàn bộ form)
            const saved = localStorage.getItem(STORAGE_KEY);
            const fullData = saved ? JSON.parse(saved).formData : {};
            const shopInfo = fullData?.shopInfo || {};
            const shipping = fullData?.shipping || {};
            const verification = info;

            const payload = {
                role: 'seller',
                details: {
                    firstName: verification.firstName || '',
                    lastName: verification.lastName || '',
                    primaryPhone: shopInfo.phone || '',
                    storeLogo: shopInfo.storeLogo || '',
                    storeName: shopInfo.storeName || '',
                    businessType: verification.businessType || 'individual',
                    businessName:
                        verification.businessType === 'business'
                            ? verification.businessName || ''
                            : '',
                    businessRegistration:
                        verification.businessType === 'business'
                            ? verification.businessRegistration || ''
                            : '',
                    businessLicenseImages:
                        verification.businessType === 'business'
                            ? Array.isArray(verification.businessLicense)
                                ? verification.businessLicense
                                : verification.businessLicense
                                ? [verification.businessLicense]
                                : []
                            : [],
                    taxId: verification.taxId || '',
                    businessAddress: {
                        street:
                            verification.address?.detail ||
                            verification.address?.street ||
                            '',
                        ward: verification.address?.wardName || '',
                        district: verification.address?.districtName || '',
                        province: verification.address?.provinceName || '',
                    },
                    bankDetails: {
                        accountName: shipping.bank?.name || '',
                        accountNumber: shipping.bank?.number || '',
                        bankName: shipping.bank?.bank || '',
                        branchName: shipping.bank?.branch || '',
                    },
                    warehouses:
                        shipping.warehouses?.map((w) => ({
                            street: w.detail || '',
                            ward: w.ward || '',
                            district: w.district || '',
                            province: w.province || '',
                            managerName: w.name || '',
                            managerPhone: w.phone || '',
                        })) || [],
                    identificationNumber: verification.idNumber || '',
                    identificationImages: {
                        front: verification.idFront || '',
                        back: verification.idBack || '',
                    },
                },
            };
            console.log('Payload for role request:', payload);

            const response = await createRoleRequest(payload);

            finishCreatingRequest?.();

            if (response.success) {
                onNext({ info: verification });
            } else {
                alert(
                    response.message ||
                        'Gửi yêu cầu thất bại, vui lòng thử lại.'
                );
            }
        } catch (error) {
            finishCreatingRequest?.();
            console.error('❌ Lỗi khi gửi yêu cầu đăng ký vai trò:', error);
            alert('Gửi yêu cầu thất bại, vui lòng thử lại.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl">
            {/* --- Chọn loại tài khoản --- */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                    onClick={() => handleChange('businessType', 'individual')}
                    className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                        info.businessType === 'individual'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}>
                    <User2
                        className={`w-8 h-8 mb-2 ${
                            info.businessType === 'individual'
                                ? 'text-blue-500'
                                : 'text-gray-400'
                        }`}
                    />
                    <p className="font-medium">Tài khoản Cá nhân</p>
                    {info.businessType === 'individual' && (
                        <span className="mt-2 bg-blue-500 text-white px-4 py-1 rounded text-sm">
                            Đã chọn
                        </span>
                    )}
                </div>

                <div
                    onClick={() => handleChange('businessType', 'business')}
                    className={`border rounded-md p-4 cursor-pointer flex flex-col items-center ${
                        info.businessType === 'business'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}>
                    <Building2
                        className={`w-8 h-8 mb-2 ${
                            info.businessType === 'business'
                                ? 'text-blue-500'
                                : 'text-gray-400'
                        }`}
                    />
                    <p className="font-medium">Tài khoản Doanh nghiệp</p>
                    {info.businessType === 'business' && (
                        <span className="mt-2 bg-blue-500 text-white px-4 py-1 rounded text-sm">
                            Đã chọn
                        </span>
                    )}
                </div>
            </div>

            {/* --- Form nhập thông tin --- */}
            <div className="space-y-5">
                <label className="block text-lg font-medium text-gray-700 mb-1">
                    {info.businessType === 'individual'
                        ? 'Thông tin cá nhân'
                        : 'Thông tin người đại diện'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Họ và tên đệm *"
                        placeholder="Nhập họ và tên đệm"
                        value={info.lastName}
                        onChange={(e) =>
                            handleChange('lastName', e.target.value)
                        }
                        error={errors.lastName}
                    />
                    <Input
                        label="Tên *"
                        placeholder="Nhập tên"
                        value={info.firstName}
                        onChange={(e) =>
                            handleChange('firstName', e.target.value)
                        }
                        error={errors.firstName}
                    />
                </div>

                <Input
                    label="Số định danh / CCCD *"
                    placeholder="Nhập số định danh hoặc CCCD"
                    value={info.idNumber}
                    onChange={(e) => handleChange('idNumber', e.target.value)}
                    error={errors.idNumber}
                />

                {/* Upload 2 mặt giấy tờ */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <ImageUpload
                            label="Ảnh mặt trước CCCD"
                            placeholder="Tải lên ảnh mặt trước"
                            value={
                                info.idFront
                                    ? `${import.meta.env.VITE_API_URL}${
                                          info.idFront
                                      }`
                                    : null
                            }
                            onChange={(file) =>
                                handleFileUpload('idFront', file)
                            }
                        />
                        {errors.idFront && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.idFront}
                            </p>
                        )}
                    </div>
                    <div>
                        <ImageUpload
                            label="Ảnh mặt sau CCCD"
                            placeholder="Tải lên ảnh mặt sau"
                            value={
                                info.idBack
                                    ? `${import.meta.env.VITE_API_URL}${
                                          info.idBack
                                      }`
                                    : null
                            }
                            onChange={(file) =>
                                handleFileUpload('idBack', file)
                            }
                        />
                        {errors.idBack && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.idBack}
                            </p>
                        )}
                    </div>
                </div>

                {info.businessType === 'individual' ? (
                    <Input
                        label="Mã số thuế thu nhập cá nhân *"
                        placeholder="Nhập mã số thuế thu nhập cá nhân"
                        value={info.taxId}
                        onChange={(e) => handleChange('taxId', e.target.value)}
                        error={errors.taxId}
                    />
                ) : (
                    <>
                        <label className="block text-lg font-medium text-gray-700 mb-1">
                            Thông tin doanh nghiệp
                        </label>
                        <Input
                            label="Tên doanh nghiệp *"
                            placeholder="Nhập tên doanh nghiệp"
                            value={info.businessName}
                            onChange={(e) =>
                                handleChange('businessName', e.target.value)
                            }
                            error={errors.taxId}
                        />
                        <Input
                            label="Mã số thuế doanh nghiệp *"
                            placeholder="Nhập mã số thuế doanh nghiệp"
                            helperText="Mã số đầu trên giấy Đăng ký kinh doanh."
                            value={info.taxId}
                            onChange={(e) =>
                                handleChange('taxId', e.target.value)
                            }
                            error={errors.taxId}
                        />
                        <Input
                            label="Mã số đăng ký kinh doanh *"
                            placeholder="Nhập mã số đăng ký kinh doanh"
                            helperText="Trùng với mã số thuế doanh nghiệp trên giấy Đăng ký kinh doanh."
                            value={info.businessRegistration}
                            onChange={(e) =>
                                handleChange(
                                    'businessRegistration',
                                    e.target.value
                                )
                            }
                            error={errors.taxId}
                        />
                        <div>
                            <ImageUpload
                                label="Giấy phép đăng ký kinh doanh"
                                placeholder="Tải lên giấy phép kinh doanh"
                                value={
                                    info.businessLicense
                                        ? `${import.meta.env.VITE_API_URL}${
                                              info.businessLicense
                                          }`
                                        : null
                                }
                                onChange={(file) =>
                                    handleFileUpload('businessLicense', file)
                                }
                            />
                            {errors.businessLicense && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.businessLicense}
                                </p>
                            )}
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-1">
                        {info.businessType === 'individual'
                            ? 'Địa chỉ liên hệ'
                            : 'Địa chỉ doanh nghiệp'}
                    </label>
                    <AddressSelector
                        value={info.address || {}}
                        onChange={(addr) => {
                            const updated = { ...info, address: addr };
                            setInfo(updated);
                            onUpdate && onUpdate({ info: updated });

                            const saved = JSON.parse(
                                localStorage.getItem(STORAGE_KEY) || '{}'
                            );
                            localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify({
                                    ...saved,
                                    formData: {
                                        ...saved.formData,
                                        info: updated,
                                    },
                                })
                            );
                        }}
                    />
                    {errors.address && (
                        <p className="text-red-500 text-sm">{errors.address}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={onBack}
                    className="border border-gray-400 cursor-pointer text-gray-600 px-6 py-2 mr-2 rounded hover:bg-gray-100 transition">
                    Quay lại
                </button>
                <button
                    onClick={handleNext}
                    className="bg-blue-500 cursor-pointer text-white px-6 py-2 rounded hover:bg-blue-600 transition">
                    Tiếp theo
                </button>
            </div>
        </div>
    );
};

export default SellerStep3;
