import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import AddressSelector from '@/components/common/AddressSelector.jsx';
import { provinceApi } from '@/services/api/provinceApi.js';

const WarehouseModal = ({ onClose, onSave, defaultData }) => {
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState(
        defaultData || {
            name: '',
            managerName: '',
            managerPhone: '',
            province: '',
            district: '',
            ward: '',
            detail: '',
        }
    );

    const handleSave = async () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên kho';
        if (!form.managerName.trim())
            newErrors.managerName = 'Vui lòng nhập họ tên quản lý';
        if (!form.managerPhone.trim())
            newErrors.managerPhone = 'Vui lòng nhập số điện thoại';
        if (!/^0\d{9}$/.test(form.managerPhone))
            newErrors.managerPhone = 'Số điện thoại không hợp lệ';
        if (!form.province) newErrors.province = 'Chọn Tỉnh/Thành phố';
        if (!form.district) newErrors.district = 'Chọn Quận/Huyện';
        if (!form.ward) newErrors.ward = 'Chọn Phường/Xã';
        if (!form.detail.trim()) newErrors.detail = 'Nhập địa chỉ chi tiết';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        // Lấy tên địa lý từ API
        const provinceRes = await provinceApi.getAll(1);
        const provinces = provinceRes.data || [];
        const provinceObj = provinces.find((p) => p.code == form.province);

        const districtRes = await provinceApi.getDistricts(form.province);
        const districtObj = districtRes.data?.districts?.find(
            (d) => d.code == form.district
        );

        const wardRes = await provinceApi.getWards(form.district);
        const wardObj = wardRes.data?.wards?.find((w) => w.code == form.ward);

        onSave({
            ...form,
            province: provinceObj?.name || '',
            district: districtObj?.name || '',
            ward: wardObj?.name || '',
            provinceCode: provinceObj?.code || '',
            districtCode: districtObj?.code || '',
            wardCode: wardObj?.code || '',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
                <h2 className="text-xl font-semibold mb-4">
                    Thông tin kho hàng
                </h2>

                <div className="grid gap-4">
                    <Input
                        label="Tên kho"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        error={errors.name}
                    />
                    <div className="flex gap-4 space-between">
                        <div className="flex-2">
                            <Input
                                label="Họ & Tên người quản lý"
                                value={form.managerName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        managerName: e.target.value,
                                    })
                                }
                                error={errors.managerName}
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="Số điện thoại"
                                maxLength={10}
                                value={form.managerPhone}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        managerPhone: e.target.value,
                                    })
                                }
                                error={errors.managerPhone}
                            />
                        </div>
                    </div>

                    <AddressSelector
                        value={form}
                        onChange={(newAddr) => setForm({ ...form, ...newAddr })}
                        errors={errors}
                        defaultData={defaultData}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md hover:bg-gray-100">
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarehouseModal;
