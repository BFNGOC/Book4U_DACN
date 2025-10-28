import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import AddressSelector from '@/components/common/AddressSelector.jsx';
import { provinceApi } from '@/services/api/provinceApi.js';

const WarehouseModal = ({ onClose, onSave, defaultData }) => {
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState(
        defaultData || {
            name: '',
            phone: '',
            province: '',
            district: '',
            ward: '',
            detail: '',
        }
    );

    const handleSave = async () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
        if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
        if (!/^0\d{9}$/.test(form.phone))
            newErrors.phone = 'Số điện thoại không hợp lệ';
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
                        label="Họ & Tên"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        error={errors.name}
                    />
                    <Input
                        label="Số điện thoại"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                        }
                        error={errors.phone}
                    />

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
