import { useState, useEffect } from 'react';
import { Info, Building2, User2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import AddressSelector from '@/components/common/AddressSelector';

const SellerStep3 = ({ data = {}, onNext, onBack }) => {
    const [type, setType] = useState(() => data.type || 'personal');
    const [info, setInfo] = useState(() => ({
        fullName: data.info?.fullName || '',
        idNumber: data.info?.idNumber || '',
        taxId: data.info?.taxId || '',
        businessLicense: data.info?.businessLicense || null,
        idFront: data.info?.idFront || null,
        idBack: data.info?.idBack || null,
        address: data.info?.address || {},
    }));
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!info.fullName.trim())
            newErrors.fullName = 'Vui lòng nhập họ và tên';
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

    const handleNext = () => {
        if (!validate()) return;
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
                    onClick={() => setType('personal')}
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
                    onClick={() => setType('business')}
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
                <Input
                    label="Họ và tên người ký hợp đồng *"
                    value={info.fullName}
                    onChange={(e) =>
                        setInfo({ ...info, fullName: e.target.value })
                    }
                    error={errors.fullName}
                />

                <Input
                    label="Số định danh / CCCD *"
                    value={info.idNumber}
                    onChange={(e) =>
                        setInfo({ ...info, idNumber: e.target.value })
                    }
                    error={errors.idNumber}
                />

                {/* Upload 2 mặt giấy tờ */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <ImageUpload
                            label="Ảnh mặt trước CCCD"
                            placeholder="Tải lên ảnh mặt trước"
                            value={info.idFront}
                            onChange={(file) =>
                                setInfo({ ...info, idFront: file })
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
                            value={info.idBack}
                            onChange={(file) =>
                                setInfo({ ...info, idBack: file })
                            }
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
                        onChange={(e) =>
                            setInfo({ ...info, taxId: e.target.value })
                        }
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
                                    setInfo({
                                        ...info,
                                        businessLicense: file,
                                    })
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

                <AddressSelector
                    value={info.address || {}}
                    onChange={(addr) => setInfo({ ...info, address: addr })}
                />
                {errors.address && (
                    <p className="text-red-500 text-sm">{errors.address}</p>
                )}
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
