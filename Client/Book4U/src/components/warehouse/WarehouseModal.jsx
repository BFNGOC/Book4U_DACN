import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";

const WarehouseModal = ({ onClose, onSave, defaultData }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(
    defaultData || {
      name: "",
      phone: "",
      province: "",
      district: "",
      ward: "",
      detail: "",
    }
  );

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then((res) => res.json())
      .then(setProvinces);

    if (defaultData?.province) {
      fetch(`https://provinces.open-api.vn/api/p/${defaultData.province}?depth=2`)
        .then((res) => res.json())
        .then((data) => setDistricts(data.districts));
    }
    if (defaultData?.district) {
      fetch(`https://provinces.open-api.vn/api/d/${defaultData.district}?depth=2`)
        .then((res) => res.json())
        .then((data) => setWards(data.wards));
    }
  }, []);

  const handleProvinceChange = (e) => {
    const provinceCode = e.target.value;
    setForm({ ...form, province: provinceCode, district: "", ward: "" });
    fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setDistricts(data.districts));
  };

  const handleDistrictChange = (e) => {
    const districtCode = e.target.value;
    setForm({ ...form, district: districtCode, ward: "" });
    fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards));
  };

  const handleSave = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!/^0\d{9}$/.test(form.phone))
      newErrors.phone = "Số điện thoại không hợp lệ";
    if (!form.province) newErrors.province = "Chọn Tỉnh/Thành phố";
    if (!form.district) newErrors.district = "Chọn Quận/Huyện";
    if (!form.ward) newErrors.ward = "Chọn Phường/Xã";
    if (!form.detail.trim()) newErrors.detail = "Nhập địa chỉ chi tiết";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const provinceName = provinces.find((p) => p.code == form.province)?.name || "";
    const districtName = districts.find((d) => d.code == form.district)?.name || "";
    const wardName = wards.find((w) => w.code == form.ward)?.name || "";

    onSave({
      ...form,
      province: provinceName,
      district: districtName,
      ward: wardName,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
        <h2 className="text-xl font-semibold mb-4">Thông tin kho hàng</h2>

        <div className="grid gap-4">
          <Input
            label="Họ & Tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Số điện thoại"
            maxLength={10}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone}
          />

          <select
            className="border rounded-md px-3 py-2 w-full"
            value={form.province}
            onChange={handleProvinceChange}
          >
            <option value="">Chọn Tỉnh/Thành phố</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.province && <p className="text-red-500 text-sm">{errors.province}</p>}

          <select
            className="border rounded-md px-3 py-2 w-full"
            value={form.district}
            onChange={handleDistrictChange}
            disabled={!districts.length}
          >
            <option value="">Chọn Quận/Huyện</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.district && <p className="text-red-500 text-sm">{errors.district}</p>}

          <select
            className="border rounded-md px-3 py-2 w-full"
            value={form.ward}
            onChange={(e) => setForm({ ...form, ward: e.target.value })}
            disabled={!wards.length}
          >
            <option value="">Chọn Phường/Xã</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.ward && <p className="text-red-500 text-sm">{errors.ward}</p>}

          <textarea
            placeholder="Địa chỉ chi tiết"
            className="border rounded-md px-3 py-2 w-full"
            rows={2}
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
          />
          {errors.detail && <p className="text-red-500 text-sm">{errors.detail}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseModal;
