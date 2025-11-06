import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import AddressSelector from '@/components/common/AddressSelector';
import { createRoleRequest } from '@/services/api/roleRequestApi';
import {
    uploadIdentification,
    uploadDriverLicense,
    uploadPortrait,
} from '@/services/api/uploadApi';
import { useUser } from '@/contexts/userContext';

const ShipperStep2 = ({ data = {}, onNext, onBack, onUpdate }) => {
    const { user } = useUser();
    const STORAGE_KEY = `shipperRegister_${user?._id}`;

    const [info, setInfo] = useState(() => ({
        lastName: data.lastName || '',
        firstName: data.firstName || '',
        phone: data.phone || user?.phone || '',
        idNumber: data.idNumber || '',
        idFront: data.idFront || null,
        idBack: data.idBack || null,
        licenseNumber: data.licenseNumber || '',
        licenseFront: data.licenseFront || null,
        licenseBack: data.licenseBack || null,
        portrait: data.portrait || null,
        vehicleType: data.vehicleType || 'motorcycle',
        vehiclePlate: data.vehiclePlate || '',
        address: data.address || {},
    }));

    const [errors, setErrors] = useState({});

    useEffect(() => {
        setInfo({
            ...info,
            ...data,
        });
    }, [data]);

    const handleChange = (key, value) => {
        const updated = { ...info, [key]: value };
        setInfo(updated);
        onUpdate && onUpdate(updated);
    };

    const handleFileUpload = async (type, file) => {
        if (!file) return;
        try {
            let res;

            // 🧠 Chọn đúng API theo loại ảnh
            if (['idFront', 'idBack'].includes(type)) {
                res = await uploadIdentification([file]);
            } else if (['licenseFront', 'licenseBack'].includes(type)) {
                res = await uploadDriverLicense([file]);
            } else if (type === 'portrait') {
                res = await uploadPortrait(file);
            } else {
                console.warn(`Không xác định được loại upload cho: ${type}`);
                return;
            }

            if (res?.success) {
                const imagePath =
                    res.data?.paths?.[0] || res.data?.path || null;
                if (!imagePath) return;

                const updated = { ...info, [type]: imagePath };
                setInfo(updated);
                onUpdate && onUpdate(updated);

                // ✅ Lưu localStorage
                const saved = JSON.parse(
                    localStorage.getItem(STORAGE_KEY) || '{}'
                );
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        ...saved,
                        formData: {
                            ...saved.formData,
                            identity: updated,
                        },
                    })
                );
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!info.lastName.trim())
            newErrors.lastName = 'Vui lòng nhập họ và tên đệm';
        if (!info.firstName.trim()) newErrors.firstName = 'Vui lòng nhập tên';

        if (!/^0\d{9}$/.test(info.phone))
            newErrors.phone = 'Số điện thoại không hợp lệ';

        if (!info.idNumber.trim()) {
            newErrors.idNumber = 'Vui lòng nhập số CCCD';
        } else if (!/^\d+$/.test(info.idNumber.trim())) {
            newErrors.idNumber = 'Số CCCD chỉ được chứa chữ số';
        }

        if (!info.idFront)
            newErrors.idFront = 'Vui lòng tải ảnh mặt trước CCCD';
        if (!info.idBack) newErrors.idBack = 'Vui lòng tải ảnh mặt sau CCCD';

        if (!info.licenseNumber.trim()) {
            newErrors.licenseNumber = 'Nhập số GPLX';
        } else if (!/^\d+$/.test(info.licenseNumber.trim())) {
            newErrors.licenseNumber = 'Số GPLX chỉ được chứa chữ số';
        }

        if (!info.licenseFront)
            newErrors.licenseFront = 'Tải ảnh mặt trước GPLX';
        if (!info.licenseBack) newErrors.licenseBack = 'Tải ảnh mặt sau GPLX';

        if (!info.portrait) newErrors.portrait = 'Tải ảnh chân dung';
        if (!info.vehicleType.trim())
            newErrors.vehicleType = 'Chọn loại phương tiện';
        if (!info.vehiclePlate.trim())
            newErrors.vehiclePlate = 'Nhập biển số xe';
        if (
            !info.address?.province ||
            !info.address?.district ||
            !info.address?.ward
        )
            newErrors.address = 'Vui lòng chọn đầy đủ địa chỉ';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (!validate()) return;
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const areaAndBank = saved?.formData?.areaAndBank || {};

            const payload = {
                role: 'shipper',
                details: {
                    firstName: info.firstName,
                    lastName: info.lastName,
                    primaryPhone: info.phone,

                    identificationNumber: info.idNumber,
                    identificationImages: {
                        front: info.idFront,
                        back: info.idBack,
                    },

                    driverLicenseNumber: info.licenseNumber,
                    driverLicenseImages: {
                        front: info.licenseFront,
                        back: info.licenseBack,
                    },

                    portraitImage: info.portrait,

                    vehicleType: info.vehicleType,
                    vehicleRegistration: info.vehiclePlate,

                    addresses: [
                        {
                            fullName:
                                `${info.lastName} ${info.firstName}`.trim(),
                            receiverPhone: info.phone,
                            street: info.address?.detail || '',
                            ward: info.address?.wardName || '',
                            district: info.address?.districtName || '',
                            province: info.address?.provinceName || '',
                            country: 'Vietnam',
                            postalCode: '',
                            isDefault: true,
                        },
                    ],

                    serviceArea: (areaAndBank.areas || []).map((a) => ({
                        province: a.provinceCode || '',
                        provinceName: a.province || '',
                        district: a.districtCode || '',
                        districtName: a.district || '',
                    })),

                    bankDetails: {
                        accountName: areaAndBank.bank?.name || '',
                        accountNumber: areaAndBank.bank?.number || '',
                        bankName: areaAndBank.bank?.bank || '',
                        branchName: areaAndBank.bank?.branch || '',
                    },
                },
            };

            const res = await createRoleRequest(payload);
            if (res.success) {
                onNext(info);
            } else {
                alert(res.message || 'Đăng ký thất bại, vui lòng thử lại.');
            }
        } catch (error) {
            console.error('❌ Lỗi gửi đăng ký shipper:', error);
            alert('Gửi yêu cầu thất bại.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl">
            <h2 className="text-xl font-semibold mb-6">
                Thông tin cá nhân & phương tiện
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Input
                    label="Họ và tên đệm *"
                    placeholder="Nhập họ và tên đệm"
                    value={info.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    error={errors.lastName}
                />
                <Input
                    label="Tên *"
                    placeholder="Nhập tên"
                    value={info.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    error={errors.firstName}
                />
                <Input
                    label="Số điện thoại *"
                    placeholder="Nhập số điện thoại"
                    maxLength={10}
                    value={info.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={errors.phone}
                />
                <div>
                    <ImageUpload
                        label="Ảnh chân dung *"
                        placeholder="Tải lên ảnh chân dung"
                        value={
                            info.portrait
                                ? `${import.meta.env.VITE_API_URL}${
                                      info.portrait
                                  }`
                                : null
                        }
                        onChange={(file) => handleFileUpload('portrait', file)}
                    />
                    {errors.portrait && (
                        <p className="text-red-500 text-sm">
                            {errors.portrait}
                        </p>
                    )}
                </div>
            </div>

            {/* CCCD */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-10">
                    <Input
                        label="Số CCCD *"
                        placeholder="Nhập số định danh hoặc CCCD"
                        value={info.idNumber}
                        onChange={(e) =>
                            handleChange('idNumber', e.target.value)
                        }
                        error={errors.idNumber}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <ImageUpload
                            label="Ảnh mặt trước CCCD"
                            placeholder="Tải lên ảnh mặt trước CCCD"
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
                            <p className="text-red-500 text-sm">
                                {errors.idFront}
                            </p>
                        )}
                    </div>
                    <div>
                        <ImageUpload
                            label="Ảnh mặt sau CCCD"
                            placeholder="Tải lên ảnh mặt sau CCCD"
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
                            <p className="text-red-500 text-sm">
                                {errors.idBack}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* GPLX */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <Input
                    label="Số giấy phép lái xe *"
                    placeholder="Nhập số giấy phép lái xe"
                    value={info.licenseNumber}
                    onChange={(e) =>
                        handleChange('licenseNumber', e.target.value)
                    }
                    error={errors.licenseNumber}
                />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <ImageUpload
                            label="Ảnh mặt trước GPLX"
                            placeholder="Tải lên ảnh mặt trước GPLX"
                            value={
                                info.licenseFront
                                    ? `${import.meta.env.VITE_API_URL}${
                                          info.licenseFront
                                      }`
                                    : null
                            }
                            onChange={(file) =>
                                handleFileUpload('licenseFront', file)
                            }
                        />
                        {errors.licenseFront && (
                            <p className="text-red-500 text-sm">
                                {errors.licenseFront}
                            </p>
                        )}
                    </div>
                    <div>
                        <ImageUpload
                            label="Ảnh mặt sau GPLX"
                            placeholder="Tải lên ảnh mặt trước GPLX"
                            value={
                                info.licenseBack
                                    ? `${import.meta.env.VITE_API_URL}${
                                          info.licenseBack
                                      }`
                                    : null
                            }
                            onChange={(file) =>
                                handleFileUpload('licenseBack', file)
                            }
                        />
                        {errors.licenseBack && (
                            <p className="text-red-500 text-sm">
                                {errors.licenseBack}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phương tiện *
                    </label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={info.vehicleType || 'motorcycle'}
                        onChange={(e) =>
                            handleChange('vehicleType', e.target.value)
                        }>
                        <option value="">-- Chọn loại phương tiện --</option>
                        <option value="motorcycle">Xe máy</option>
                        <option value="car">Ô tô</option>
                        <option value="van">Xe tải nhỏ (van)</option>
                        <option value="truck">Xe tải</option>
                    </select>
                    {errors.vehicleType && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.vehicleType}
                        </p>
                    )}
                </div>
                <Input
                    label="Biển số xe *"
                    placeholder="Nhập biển số xe"
                    value={info.vehiclePlate}
                    onChange={(e) =>
                        handleChange('vehiclePlate', e.target.value)
                    }
                    error={errors.vehiclePlate}
                />
            </div>

            {/* Địa chỉ */}
            <div className="mt-6">
                <label className="block text-lg font-medium text-gray-700 mb-1">
                    Địa chỉ cư trú *
                </label>
                <AddressSelector
                    value={info.address || {}}
                    onChange={(addr) => {
                        const updated = { ...info, address: addr };
                        setInfo(updated);
                        onUpdate && onUpdate(updated);
                    }}
                />
                {errors.address && (
                    <p className="text-red-500 text-sm">{errors.address}</p>
                )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end mt-8">
                <button
                    onClick={onBack}
                    className="border border-gray-400 text-gray-600 px-6 py-2 mr-2 rounded hover:bg-gray-100 transition">
                    Quay lại
                </button>
                <button
                    onClick={handleNext}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition">
                    Hoàn tất
                </button>
            </div>
        </div>
    );
};

export default ShipperStep2;
