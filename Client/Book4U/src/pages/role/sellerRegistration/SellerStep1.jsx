import { useUser } from "@/contexts/userContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressSteps from "@/components/ui/ProgressSteps";
import Input from "@/components/ui/Input";
import ImageUpload from "@/components/ui/ImageUpload";

const SellerStep1 = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [form, setForm] = useState({
    businessName: "",
    storeLogo: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});

  const handleNext = () => {
    const newErrors = {};
    if (!form.businessName.trim()) newErrors.businessName = "Vui lòng nhập tên shop";
    if (form.businessName.length > 30)
      newErrors.businessName = "Tên shop không vượt quá 30 ký tự";
    if (!/^0\d{9}$/.test(form.phone))
      newErrors.phone = "Số điện thoại không hợp lệ";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    navigate("/role/seller/warehouse");
  };

  const steps = ["Thông tin Shop", "Cài đặt vận chuyển", "Định danh", "Hoàn tất"];
  const currentStep = 0;

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow">
      <ProgressSteps steps={steps} currentStep={currentStep} />

      <div className="space-y-5">
        <div>
          <Input
            label="Tên Shop *"
            name="businessName"
            placeholder="Nhập tên shop"
            value={form.businessName}
            onChange={(e) => {
              if (e.target.value.length <= 30)
                setForm({ ...form, businessName: e.target.value });
            }}
            error={errors.businessName} 
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {form.businessName.length}/30
          </div>
        </div>

        <ImageUpload
          label="Logo cửa hàng"
          name="storeLogo"
          value={form.storeLogo}
          onChange={(file) => setForm({ ...form, storeLogo: file })}
        />

        <div className="overflow-x-auto">
          <Input label="Email" name="email" value={user?.email || ''} disabled />
        </div>

        <Input
          label="Số điện thoại *"
          name="phone"
          placeholder="0xxxxxxxxx"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={errors.phone}
          maxLength={10}
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleNext}
          className="bg-orange-600 cursor-pointer text-white px-6 py-2 rounded hover:bg-orange-700 transition"
        >
          Tiếp theo
        </button>
      </div>
    </div>
  );
};

export default SellerStep1;
