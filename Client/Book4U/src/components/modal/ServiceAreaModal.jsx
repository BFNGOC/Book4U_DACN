import { useState } from 'react';
import AddressSelector from '@/components/common/AddressSelector';
import { provinceApi } from '@/services/api/provinceApi';

const ServiceAreaModal = ({ onClose, onSave, defaultData }) => {
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(
        defaultData || {
            province: '',
            district: '',
        }
    );

    const handleSave = async () => {
        const newErrors = {};
        if (!form.province) newErrors.province = 'Vui lòng chọn Tỉnh/Thành phố';
        if (!form.district) newErrors.district = 'Vui lòng chọn Quận/Huyện';
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            // --- Lấy tên tỉnh, huyện ---
            const provinceRes = await provinceApi.getAll(1);
            const provinces = provinceRes.data || [];
            const provinceObj = provinces.find((p) => p.code == form.province);

            const districtRes = await provinceApi.getDistricts(form.province);
            const districtObj = districtRes.data?.districts?.find(
                (d) => d.code == form.district
            );

            // --- Trả dữ liệu về ---
            onSave({
                province: provinceObj?.name || '',
                provinceCode: provinceObj?.code || '',
                district: districtObj?.name || '',
                districtCode: districtObj?.code || '',
            });
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu địa lý:', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
                <h2 className="text-xl font-semibold mb-4">
                    Chọn khu vực phục vụ
                </h2>

                <div className="grid gap-4">
                    <AddressSelector
                        value={form}
                        hideWard={true}
                        hideDetail={true}
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceAreaModal;
