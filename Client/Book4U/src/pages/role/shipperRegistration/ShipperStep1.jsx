import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import ServiceAreaModal from '@/components/modal/ServiceAreaModal';
import { bankApi } from '@/services/api/bankApi';
import { Edit2, Trash2 } from 'lucide-react';
import { useUser } from '@/contexts/userContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/components/ui/modals/ConfirmModal';

const ShipperStep1 = ({ data, onNext, onBack, onUpdate }) => {
    const { user } = useUser();
    const STORAGE_KEY = `sellerRegister_${user?._id}`;
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [areas, setAreas] = useState(() => data?.areas || []);
    const [selectedArea, setSelectedArea] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [banks, setBanks] = useState([]);
    const [bank, setBank] = useState(
        () => data?.bank || { name: '', number: '', bank: '', branch: '' }
    );
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (data) {
            setAreas(data.areas || []);
            setBank(
                data.bank || { name: '', number: '', bank: '', branch: '' }
            );
        }
    }, [data]);

    useEffect(() => {
        const fetchBanks = async () => {
            const result = await bankApi.getAll();
            if (result.success) {
                setBanks(result.data);
            } else {
                console.error(result.message);
            }
        };

        fetchBanks();
    }, []);

    const handleNext = () => {
        const newErrors = {};

        if (areas.length === 0)
            newErrors.areas =
                'Vui lòng chọn ít nhất một khu vực phục vụ trước khi tiếp tục.';
        if (!bank.bank.trim()) newErrors.bank = 'Vui lòng nhập tên ngân hàng';
        if (!bank.branch.trim())
            newErrors.branch = 'Vui lòng nhập chi nhánh ngân hàng';
        if (!bank.name.trim())
            newErrors.name = 'Vui lòng nhập tên chủ tài khoản';
        if (!bank.number.trim())
            newErrors.number = 'Vui lòng nhập số tài khoản';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onNext({ areas, bank });
    };

    const handleCancelConfirm = () => {
        localStorage.removeItem(`userRoleSelected_${user?._id}`);
        localStorage.removeItem(STORAGE_KEY);
        navigate('/register/role/select');
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white">
            {/* --- KHỐI 1: KHU VỰC PHỤC VỤ --- */}
            <div className="bg-white border border-gray-300 p-6 mb-8">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Khu vực phục vụ</h2>
                    <button
                        onClick={() => {
                            setEditMode(false);
                            setSelectedArea(null);
                            setShowModal(true);
                        }}
                        className="bg-white hover:bg-blue-50 text-blue-600 px-2 py-2 rounded-md cursor-pointer transition border-2 border-blue-600">
                        + Thêm khu vực
                    </button>
                </div>

                {/* Hiển thị danh sách khu vực */}
                {areas.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">
                        Vui lòng thêm ít nhất một khu vực phục vụ trước khi tiếp
                        tục.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {areas.map((a, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 p-4 text-gray-700 relative">
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {/* 🖊️ Nút chỉnh sửa */}
                                    <Edit2
                                        size={28}
                                        onClick={() => {
                                            setSelectedArea(a);
                                            setEditMode(true);
                                            setShowModal(true);
                                        }}
                                        className="bg-white rounded-full p-1.5 shadow-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-transform transform hover:scale-105"
                                        title="Chỉnh sửa khu vực"
                                    />

                                    {/* 🗑️ Nút xóa */}
                                    <Trash2
                                        size={28}
                                        onClick={() => {
                                            const updated = areas.filter(
                                                (item) => item !== a
                                            );
                                            setAreas(updated);
                                            onUpdate &&
                                                onUpdate({
                                                    areas: updated,
                                                    bank,
                                                });
                                        }}
                                        className="bg-white rounded-full p-1.5 shadow-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-transform transform hover:scale-105"
                                        title="Xóa khu vực"
                                    />
                                </div>

                                <h4 className="font-semibold mb-2">
                                    Khu vực #{index + 1}
                                </h4>
                                <p>
                                    <strong>Tỉnh/Thành phố:</strong>{' '}
                                    {a.province}
                                </p>
                                <p>
                                    <strong>Quận/Huyện:</strong> {a.district}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {errors.areas && (
                    <p className="text-red-500 text-sm mt-2">{errors.areas}</p>
                )}
            </div>

            {/* --- MODAL --- */}
            {showModal && (
                <ServiceAreaModal
                    onClose={() => setShowModal(false)}
                    onSave={(data) => {
                        let updatedAreas = [];

                        if (editMode && selectedArea) {
                            // 🔁 Nếu đang chỉnh sửa
                            updatedAreas = areas.map((a) =>
                                a === selectedArea ? { ...a, ...data } : a
                            );
                        } else {
                            // ➕ Thêm mới
                            updatedAreas = [...areas, data];
                        }

                        setAreas(updatedAreas);
                        setShowModal(false);

                        onUpdate && onUpdate({ areas: updatedAreas, bank });

                        setEditMode(false);
                        setSelectedArea(null);
                    }}
                    defaultData={editMode ? selectedArea : null}
                />
            )}

            {/* --- KHỐI 2: TÀI KHOẢN NGÂN HÀNG --- */}
            <div className="bg-white border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                        Tài khoản ngân hàng
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ngân hàng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngân hàng *
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={bank.bank}
                            onChange={(e) => {
                                const updated = {
                                    ...bank,
                                    bank: e.target.value,
                                };
                                setBank(updated);
                                onUpdate && onUpdate({ areas, bank: updated });
                            }}>
                            <option value="">Chọn ngân hàng</option>
                            {banks.map((b) => (
                                <option key={b.code} value={b.short_name}>
                                    {b.short_name} - {b.name}
                                </option>
                            ))}
                        </select>
                        {errors.bank && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.bank}
                            </p>
                        )}
                    </div>

                    {/* Chi nhánh */}
                    <Input
                        label="Chi nhánh *"
                        placeholder="Nhập chi nhánh ngân hàng"
                        name="branch"
                        value={bank.branch}
                        onChange={(e) => {
                            const updated = { ...bank, branch: e.target.value };
                            setBank(updated);
                            onUpdate && onUpdate({ areas, bank: updated });
                        }}
                        error={errors.branch}
                    />
                    <Input
                        label="Tên chủ tài khoản *"
                        placeholder="Nhập tên chủ tài khoản"
                        name="accountName"
                        value={bank.name}
                        onChange={(e) => {
                            const updated = { ...bank, name: e.target.value };
                            setBank(updated);
                            onUpdate && onUpdate({ areas, bank: updated });
                        }}
                        error={errors.name}
                    />
                    <Input
                        label="Số tài khoản *"
                        placeholder="Nhập số tài khoản"
                        name="accountNumber"
                        value={bank.number}
                        onChange={(e) => {
                            const updated = { ...bank, number: e.target.value };
                            setBank(updated);
                            onUpdate && onUpdate({ areas, bank: updated });
                        }}
                        error={errors.number}
                    />
                </div>
            </div>

            {/* --- NÚT ĐIỀU HƯỚNG --- */}
            <div className="flex justify-end mt-8">
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

export default ShipperStep1;
