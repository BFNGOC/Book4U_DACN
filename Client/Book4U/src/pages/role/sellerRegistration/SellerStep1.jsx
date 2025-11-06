import { useUser } from '@/contexts/userContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import ConfirmModal from '@/components/ui/modals/ConfirmModal';
import { uploadStoreLogo } from '@/services/api/uploadApi';

const SellerStep1 = ({ data = {}, onNext, onUpdate }) => {
    const { user } = useUser();
    const STORAGE_KEY = `sellerRegister_${user?._id}`;
    const navigate = useNavigate();
    const [form, setForm] = useState({
        storeName: data.storeName || '',
        storeLogo: data.storeLogo || '',
        phone: data.phone || '',
    });

    const [errors, setErrors] = useState({});
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        setForm({
            storeName: data.storeName || '',
            storeLogo: data.storeLogo || null,
            phone: data.phone || '',
        });
    }, [data]);

    const handleFileChange = async (file) => {
        if (!file) return;

        try {
            const res = await uploadStoreLogo(file);
            if (res.success && res.data?.path) {
                const logoPath = res.data.path;

                const updatedForm = { ...form, storeLogo: logoPath };
                setForm(updatedForm);

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        ...JSON.parse(
                            localStorage.getItem(STORAGE_KEY) || '{}'
                        ),
                        formData: { ...form, storeLogo: logoPath },
                    })
                );
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleNext = () => {
        const newErrors = {};
        if (!form.storeName.trim())
            newErrors.storeName = 'Vui lòng nhập tên shop';
        if (form.storeName.length > 30)
            newErrors.storeName = 'Tên shop không vượt quá 30 ký tự';
        if (!/^0\d{9}$/.test(form.phone))
            newErrors.phone = 'Số điện thoại không hợp lệ';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onNext(form);
    };

    const handleCancelConfirm = () => {
        localStorage.removeItem(`userRoleSelected_${user?._id}`);
        localStorage.removeItem(STORAGE_KEY);
        navigate('/register/role/select');
    };

    return (
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl">
            <div className="space-y-5">
                <div>
                    <Input
                        label="Tên Shop *"
                        name="storeName"
                        placeholder="Nhập tên shop"
                        value={form.storeName}
                        onChange={(e) => {
                            if (e.target.value.length <= 30) {
                                const updated = {
                                    ...form,
                                    storeName: e.target.value,
                                };
                                setForm({
                                    ...form,
                                    storeName: e.target.value,
                                });
                                onUpdate && onUpdate(updated);
                            }
                        }}
                        error={errors.storeName}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                        {form.storeName.length}/30
                    </div>
                </div>

                <ImageUpload
                    label="Logo cửa hàng"
                    placeholder="Tải lên logo cửa hàng"
                    name="storeLogo"
                    value={
                        form.storeLogo
                            ? `${import.meta.env.VITE_API_URL}${form.storeLogo}`
                            : null
                    }
                    onChange={handleFileChange}
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
                    onClick={() => setShowConfirm(true)}
                    className="border border-gray-400 cursor-pointer text-gray-600 px-6 py-2 mr-2 rounded hover:bg-gray-100 transition">
                    Hủy
                </button>
                <button
                    onClick={handleNext}
                    className="bg-blue-500 cursor-pointer text-white px-6 py-2 rounded hover:bg-blue-600 transition">
                    Tiếp theo
                </button>

                <ConfirmModal
                    open={showConfirm}
                    title="Xác nhận hủy đăng ký"
                    message="Bạn có chắc muốn hủy đăng ký và quay lại chọn vai trò không?"
                    confirmText="Có, hủy đăng ký"
                    cancelText="Không"
                    onConfirm={handleCancelConfirm}
                    onCancel={() => setShowConfirm(false)}
                />
            </div>
        </div>
    );
};

export default SellerStep1;
