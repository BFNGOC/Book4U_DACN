import { useState, useEffect } from 'react';
import { Info, Building2, User2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import AddressSelector from '@/components/common/AddressSelector';

const SellerStep3 = ({ data = {}, onNext, onBack, onUpdate, phone }) => {
    const [type, setType] = useState(() => data.type || 'personal');
    const [info, setInfo] = useState(() => ({
        lastName: data.info?.lastName || '',
        firstName: data.info?.firstName || '',
        idNumber: data.info?.idNumber || '',
        taxId: data.info?.taxId || '',
        businessLicense: data.info?.businessLicense || null,
        idFront: data.info?.idFront || null,
        idBack: data.info?.idBack || null,
        address: data.info?.address || {},
    }));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setType(data.type || 'personal');
        setInfo({
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

    const validate = () => {
        const newErrors = {};
        if (!info.lastName.trim())
            newErrors.lastName = 'Vui lòng nhập họ và tên đệm';
        if (!info.firstName.trim()) newErrors.firstName = 'Vui lòng nhập tên';
        if (!info.idNumber.trim())
            newErrors.idNumber = 'Vui lòng nhập số định danh';
        if (!info.idFront)
            newErrors.idFront = 'Vui lòng tải lên mặt trước CCCD';
        if (!info.idBack) newErrors.idBack = 'Vui lòng tải lên mặt sau CCCD';

        if (type === 'personal') {
            if (!info.taxId.trim())
                newErrors.taxId = 'Vui lòng nhập mã số thuế thu nhập cá nhân';
        } else {
            if (!info.taxId.trim())
                newErrors.taxId = 'Vui lòng nhập mã số đăng ký kinh doanh';
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
        onUpdate && onUpdate({ type, info: updated });
    };

    const handleTypeChange = (newType) => {
        setType(newType);
        onUpdate && onUpdate({ type: newType, info });
    };

    const handleNext = () => {
        if (!validate()) return;
        if (!agreed) {
            setAgreeError(true);
            return;
        }
        onNext({ type, info });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-6">
                Thông tin người ký hợp đồng
            </h2>

            {/* --- Chọn loại tài khoản --- */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                    onClick={() => handleTypeChange('personal')}
                    className={`border rounded-xl p-4 cursor-pointer flex flex-col items-center ${
                        type === 'personal'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}>
                    <User2
                        className={`w-8 h-8 mb-2 ${
                            type === 'personal'
                                ? 'text-blue-500'
                                : 'text-gray-400'
                        }`}
                    />
                    <p className="font-medium">Tài khoản Cá nhân</p>
                    {type === 'personal' && (
                        <span className="mt-2 bg-blue-500 text-white px-4 py-1 rounded text-sm">
                            Đã chọn
                        </span>
                    )}
                </div>

                <div
                    onClick={() => handleTypeChange('business')}
                    className={`border rounded-xl p-4 cursor-pointer flex flex-col items-center ${
                        type === 'business'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}>
                    <Building2
                        className={`w-8 h-8 mb-2 ${
                            type === 'business'
                                ? 'text-blue-500'
                                : 'text-gray-400'
                        }`}
                    />
                    <p className="font-medium">Tài khoản Doanh nghiệp</p>
                    {type === 'business' && (
                        <span className="mt-2 bg-blue-500 text-white px-4 py-1 rounded text-sm">
                            Đã chọn
                        </span>
                    )}
                </div>
            </div>

            {/* --- Form nhập thông tin --- */}
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Họ và tên đệm *"
                        value={info.lastName}
                        onChange={(e) =>
                            handleChange('lastName', e.target.value)
                        }
                        error={errors.lastName}
                    />
                    <Input
                        label="Tên *"
                        value={info.firstName}
                        onChange={(e) =>
                            handleChange('firstName', e.target.value)
                        }
                        error={errors.firstName}
                    />
                </div>

                <Input
                    label="Số định danh / CCCD *"
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
                            value={info.idFront}
                            onChange={(file) => handleChange('idFront', file)}
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
                            value={info.idBack}
                            onChange={(file) => handleChange('idBack', file)}
                        />
                        {errors.idBack && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.idBack}
                            </p>
                        )}
                    </div>
                </div>

                {type === 'personal' ? (
                    <Input
                        label="Mã số thuế thu nhập cá nhân *"
                        value={info.taxId}
                        onChange={(e) => handleChange('taxId', e.target.value)}
                        error={errors.taxId}
                    />
                ) : (
                    <>
                        <Input
                            label="Mã số đăng ký kinh doanh *"
                            value={info.taxId}
                            onChange={(e) =>
                                setInfo({ ...info, taxId: e.target.value })
                            }
                            error={errors.taxId}
                        />
                        <div>
                            <ImageUpload
                                label="Giấy phép đăng ký kinh doanh"
                                placeholder="Tải lên giấy phép kinh doanh"
                                value={info.businessLicense}
                                onChange={(file) =>
                                    handleChange('businessLicense', file)
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
                        {type === 'personal'
                            ? 'Địa chỉ liên hệ *'
                            : 'Địa chỉ doanh nghiệp *'}
                    </label>
                    <AddressSelector
                        value={info.address || {}}
                        onChange={(addr) => handleChange('address', addr)}
                    />
                    {errors.address && (
                        <p className="text-red-500 text-sm">{errors.address}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="border border-gray-400 text-gray-600 px-6 py-2 rounded hover:bg-gray-100">
                    Quay lại
                </button>
                <button
                    onClick={handleNext}
                    className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700">
                    Tiếp theo
                </button>
            </div>
        </div>
    );
};

export default SellerStep3;
