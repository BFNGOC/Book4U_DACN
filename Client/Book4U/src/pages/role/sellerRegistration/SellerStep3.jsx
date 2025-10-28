import { useState } from 'react';

const SellerStep3 = ({ data, onNext, onBack }) => {
    const [type, setType] = useState('personal');
    const [idInfo, setIdInfo] = useState({
        idNumber: '',
        taxId: '',
        front: null,
        back: null,
        license: null,
    });

    const validateId = async () => {
        const res = await fetch(`/api/validate-cccd?number=${idInfo.idNumber}`);
        const data = await res.json();
        if (!data.valid) alert('Số CCCD không hợp lệ');
    };

    const handleNext = () => {
        onNext({ type, idInfo });
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Giấy tờ pháp lý</h2>
            <label>Loại tài khoản</label>
            <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border w-full p-2 mb-3">
                <option value="personal">Cá nhân</option>
                <option value="business">Doanh nghiệp</option>
            </select>
            <label>Số CCCD *</label>
            <input
                value={idInfo.idNumber}
                onChange={(e) =>
                    setIdInfo({ ...idInfo, idNumber: e.target.value })
                }
                className="border w-full p-2 mb-3"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label>Ảnh mặt trước</label>
                    <input type="file" accept="image/*" />
                </div>
                <div>
                    <label>Ảnh mặt sau</label>
                    <input type="file" accept="image/*" />
                </div>
            </div>
            {type === 'personal' ? (
                <>
                    <label>Mã số thuế thu nhập cá nhân</label>
                    <input
                        value={idInfo.taxId}
                        onChange={(e) =>
                            setIdInfo({ ...idInfo, taxId: e.target.value })
                        }
                        className="border w-full p-2 mb-3"
                    />
                </>
            ) : (
                <>
                    <label>Mã đăng ký doanh nghiệp</label>
                    <input
                        value={idInfo.taxId}
                        onChange={(e) =>
                            setIdInfo({ ...idInfo, taxId: e.target.value })
                        }
                        className="border w-full p-2 mb-3"
                    />
                    <label>Tải giấy phép đăng ký doanh nghiệp</label>
                    <input type="file" accept="image/*,application/pdf" />
                </>
            )}
            <button
                onClick={validateId}
                className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
                Kiểm tra CCCD
            </button>

            <div className="flex justify-between mt-6">
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
