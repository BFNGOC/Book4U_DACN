import { useUser } from '@/contexts/userContext';
import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';

const SellerStep1 = ({ data = {}, onNext, onUpdate }) => {
    const { user } = useUser();
    const [form, setForm] = useState({
        businessName: data.businessName || '',
        storeLogo: data.storeLogo || '',
        phone: data.phone || '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        setForm({
            businessName: data.businessName || '',
            storeLogo: data.storeLogo || null,
            phone: data.phone || '',
        });
    }, [data]);

    const handleFileChange = (key, file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm((prevForm) => ({ ...prevForm, [key]: reader.result }));
            };
            reader.readAsDataURL(file);
        } else {
            setForm((prevForm) => ({ ...prevForm, [key]: null }));
        }
    };

    const handleNext = () => {
        const newErrors = {};
        if (!form.businessName.trim())
            newErrors.businessName = 'Vui lòng nhập tên shop';
        if (form.businessName.length > 30)
            newErrors.businessName = 'Tên shop không vượt quá 30 ký tự';
        if (!/^0\d{9}$/.test(form.phone))
            newErrors.phone = 'Số điện thoại không hợp lệ';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onNext(form);
    };

    return (
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow">
            <div className="space-y-5">
                <div>
                    <Input
                        label="Tên Shop *"
                        name="businessName"
                        placeholder="Nhập tên shop"
                        value={form.businessName}
                        onChange={(e) => {
                            if (e.target.value.length <= 30) {
                                const updated = {
                                    ...form,
                                    businessName: e.target.value,
                                };
                                setForm({
                                    ...form,
                                    businessName: e.target.value,
                                });
                                onUpdate && onUpdate(updated);
                            }
                        }}
                        error={errors.businessName}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                        {form.businessName.length}/30
                    </div>
                </div>

                <ImageUpload
                    label="Logo cửa hàng"
                    placeholder="Tải lên logo cửa hàng"
                    name="storeLogo"
                    value={form.storeLogo}
                    onChange={(base64) => {
                        const updated = { ...form, storeLogo: base64 };
                        setForm({ ...form, storeLogo: base64 });
                        onUpdate && onUpdate(updated);
                    }}
                />

                <div className="overflow-x-auto">
                    <Input
                        label="Email"
                        name="email"
                        value={user?.email || ''}
                        disabled
                    />
                </div>

                <Input
                    label="Số điện thoại *"
                    name="phone"
                    placeholder="0xxxxxxxxx"
                    value={form.phone}
                    onChange={(e) => {
                        const updated = { ...form, phone: e.target.value };
                        setForm(updated);
                        onUpdate && onUpdate(updated);
                    }}
                    error={errors.phone}
                    maxLength={10}
                />
            </div>

            <div className="flex justify-end mt-6">
                <button
                    onClick={handleNext}
                    className="bg-orange-600 cursor-pointer text-white px-6 py-2 rounded hover:bg-orange-700 transition">
                    Tiếp theo
                </button>
            </div>
        </div>
    );
};

export default SellerStep1;
