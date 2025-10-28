import { useEffect, useState } from 'react';
import { provinceApi } from '@/services/api/provinceApi';

const AddressSelector = ({ value, onChange, errors = {}, defaultData }) => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const provinceRes = await provinceApi.getAll(1);
            if (provinceRes.success) setProvinces(provinceRes.data);

            const { provinceCode, districtCode, wardCode, detail } =
                defaultData || {};

            if (provinceCode) {
                const districtRes = await provinceApi.getDistricts(
                    provinceCode
                );
                if (districtRes.success)
                    setDistricts(districtRes.data?.districts || []);
            }

            if (districtCode) {
                const wardRes = await provinceApi.getWards(districtCode);
                if (wardRes.success) setWards(wardRes.data?.wards || []);
            }

            if (defaultData) {
                onChange({
                    province: provinceCode || '',
                    district: districtCode || '',
                    ward: wardCode || '',
                    detail: detail || '',
                });
            }
        };

        fetchData();
    }, [defaultData]);

    const handleProvinceChange = async (e) => {
        const provinceCode = e.target.value;
        onChange({
            province: provinceCode,
            district: '',
            ward: '',
            detail: value.detail,
        });
        setDistricts([]);
        setWards([]);

        if (provinceCode) {
            const res = await provinceApi.getDistricts(provinceCode);
            if (res.success) setDistricts(res.data.districts || []);
        }
    };

    const handleDistrictChange = async (e) => {
        const districtCode = e.target.value;
        onChange({ ...value, district: districtCode, ward: '' });
        setWards([]);

        if (districtCode) {
            const res = await provinceApi.getWards(districtCode);
            if (res.success) setWards(res.data.wards || []);
        }
    };

    return (
        <div className="space-y-4">
            {/* --- Province --- */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                </label>
                <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={value.province || ''}
                    onChange={handleProvinceChange}>
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                            {p.name}
                        </option>
                    ))}
                </select>
                {errors.province && (
                    <p className="text-red-500 text-xs mt-1">
                        {errors.province}
                    </p>
                )}
            </div>

            {/* --- District --- */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Quận / Huyện <span className="text-red-500">*</span>
                </label>
                <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                    value={value.district || ''}
                    onChange={handleDistrictChange}
                    disabled={!districts.length}>
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                            {d.name}
                        </option>
                    ))}
                </select>
                {errors.district && (
                    <p className="text-red-500 text-xs mt-1">
                        {errors.district}
                    </p>
                )}
            </div>

            {/* --- Ward --- */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Phường / Xã <span className="text-red-500">*</span>
                </label>
                <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                    value={value.ward || ''}
                    onChange={(e) =>
                        onChange({ ...value, ward: e.target.value })
                    }
                    disabled={!wards.length}>
                    <option value="">-- Chọn Phường/Xã --</option>
                    {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                            {w.name}
                        </option>
                    ))}
                </select>
                {errors.ward && (
                    <p className="text-red-500 text-xs mt-1">{errors.ward}</p>
                )}
            </div>

            {/* --- Detail --- */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                    placeholder="Số nhà, tên đường..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    rows={2}
                    value={value.detail || ''}
                    onChange={(e) =>
                        onChange({ ...value, detail: e.target.value })
                    }
                />
                {errors.detail && (
                    <p className="text-red-500 text-xs mt-1">{errors.detail}</p>
                )}
            </div>
        </div>
    );
};

export default AddressSelector;
