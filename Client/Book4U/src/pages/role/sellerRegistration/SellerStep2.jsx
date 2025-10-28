import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import WarehouseModal from '@/components/warehouse/WarehouseModal';
import { provinceApi } from '@/services/api/provinceApi';
import { bankApi } from '@/services/api/bankApi';

const SellerStep2 = ({ data, onNext, onBack }) => {
    const [showModal, setShowModal] = useState(false);
    const [warehouses, setWarehouses] = useState(() => data?.warehouses || []);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null); // để edit
    const [editMode, setEditMode] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [address, setAddress] = useState({
        province: '',
        district: '',
        ward: '',
        detail: '',
    });
    const [banks, setBanks] = useState([]);
    const [bank, setBank] = useState(
        () => data?.bank || { name: '', number: '', bank: '', branch: '' }
    );
    const [errors, setErrors] = useState({});

    // useEffect(() => {
    //     if (data) {
    //         setWarehouses(data.warehouses || []);
    //         setBank(
    //             data.bank || { name: '', number: '', bank: '', branch: '' }
    //         );
    //     }
    // }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await provinceApi.getAll();
            if (res.success) setProvinces(res.data);
        };
        fetchData();
    }, []);

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

        if (warehouses.length === 0)
            newErrors.warehouse =
                'Vui lòng tạo ít nhất một kho hàng trước khi tiếp tục.';
        if (!bank.bank.trim()) newErrors.bank = 'Vui lòng nhập tên ngân hàng';
        if (!bank.branch.trim())
            newErrors.branch = 'Vui lòng nhập chi nhánh ngân hàng';
        if (!bank.name.trim())
            newErrors.name = 'Vui lòng nhập tên chủ tài khoản';
        if (!bank.number.trim())
            newErrors.number = 'Vui lòng nhập số tài khoản';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onNext({ warehouses, bank });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white">
            {/* --- KHỐI 1: KHO HÀNG --- */}
            <div className="bg-white border border-gray-300 p-6 mb-8">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">
                        Kho lấy và trả hàng
                    </h2>
                    <button
                        onClick={() => {
                            setEditMode(false);
                            setSelectedWarehouse(null);
                            setShowModal(true);
                        }}
                        className="bg-white hover:bg-blue-50 text-blue-600 px-2 py-2 rounded-md cursor-pointer transition border-2 border-blue-600">
                        + Tạo kho hàng mới
                    </button>
                </div>
                {/* Hiển thị nội dung */}
                {warehouses.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">
                        Vui lòng tạo ít nhất một địa chỉ kho để lấy và trả hàng.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {warehouses.map((w, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 p-4 text-gray-700 relative">
                                <button
                                    onClick={() => {
                                        setSelectedWarehouse(w);
                                        setEditMode(true);
                                        setShowModal(true);
                                    }}
                                    className="absolute cursor-pointer top-2 right-2 text-sm text-blue-600 border border-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                                    Chỉnh sửa
                                </button>

                                <h4 className="font-semibold mb-2">
                                    Kho hàng #{index + 1}
                                </h4>
                                <p>
                                    <strong>Họ tên:</strong> {w.name}
                                </p>
                                <p>
                                    <strong>Số điện thoại:</strong> {w.phone}
                                </p>
                                <p>
                                    <strong>Địa chỉ:</strong> {w.detail},{' '}
                                    {w.ward}, {w.district}, {w.province}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {errors.warehouse && (
                    <p className="text-red-500 text-sm mt-2">
                        {errors.warehouse}
                    </p>
                )}
            </div>

            {/* --- MODAL --- */}
            {showModal && (
                <WarehouseModal
                    onClose={() => setShowModal(false)}
                    onSave={(data) => {
                        if (editMode) {
                            setWarehouses((prev) =>
                                prev.map((w) =>
                                    w === selectedWarehouse
                                        ? { ...w, ...data }
                                        : w
                                )
                            );
                        } else {
                            setWarehouses((prev) => [...prev, data]);
                        }
                        setShowModal(false);
                    }}
                    defaultData={editMode ? selectedWarehouse : null}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngân hàng *
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={bank.bank}
                            onChange={(e) =>
                                setBank({ ...bank, bank: e.target.value })
                            }>
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
                    <Input
                        label="Chi nhánh *"
                        name="branch"
                        value={bank.branch}
                        onChange={(e) =>
                            setBank({ ...bank, branch: e.target.value })
                        }
                        error={errors.branch}
                    />
                    <Input
                        label="Tên chủ tài khoản *"
                        name="accountName"
                        value={bank.name}
                        onChange={(e) =>
                            setBank({ ...bank, name: e.target.value })
                        }
                        error={errors.name}
                    />
                    <Input
                        label="Số tài khoản *"
                        name="accountNumber"
                        value={bank.number}
                        onChange={(e) =>
                            setBank({ ...bank, number: e.target.value })
                        }
                        error={errors.number}
                    />
                </div>
            </div>

            {/* --- NÚT --- */}
            <div className="flex justify-end mt-8">
                <button
                    onClick={onBack}
                    className="border border-gray-400 text-gray-600 px-6 py-2.5 rounded-md hover:bg-gray-100 transition">
                    Quay lại
                </button>
                <button
                    onClick={handleNext}
                    className="bg-orange-600 text-white px-6 py-2.5 rounded-md hover:bg-orange-700 transition">
                    Tiếp theo
                </button>
            </div>
        </div>
    );
};

export default SellerStep2;
