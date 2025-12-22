import { useState, useEffect, useCallback, useRef } from 'react';
import SellerStep1 from './SellerStep1';
import SellerStep2 from './SellerStep2';
import SellerStep3 from './SellerStep3';
import SellerStep4 from './SellerStep4';
import ProgressSteps from '@/components/ui/ProgressSteps';
import Loading from '@/components/common/Loading';
import { getMyRoleRequests } from '@/services/api/roleRequestApi';
import { useUser } from '@/contexts/userContext';

export default function SellerRegister() {
    const { user } = useUser();
    const userId = user?._id;
    const STORAGE_KEY = `sellerRegister_${userId}`;
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        shopInfo: {},
        shipping: {
            warehouses: [],
            bank: { name: '', number: '', bank: '', branch: '' },
        },
        verification: { type: 'personal', info: {} },
    });
    const [loaded, setLoaded] = useState(false);
    const hasLoadedRef = useRef(false); // ✅ flag ngăn vòng lặp

    useEffect(() => {
        const init = async () => {
            try {
                let parsed = null;
                const res = await getMyRoleRequests();

                if (res?.success && Array.isArray(res.data)) {
                    const latestSellerRequest = res.data
                        .filter((r) => r.role === 'seller')
                        .sort(
                            (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                        )[0];

                    // ✅ MỚI: Kiểm tra nếu request đang pending
                    if (latestSellerRequest?.status === 'pending') {
                        console.log(
                            '📋 Có pending request, đi tới bước cuối cùng'
                        );
                        // Đi đến bước cuối cùng (step 3 = index 3)
                        setCurrentStep(3);
                        parsed = { formData, currentStep: 3 };
                        localStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(parsed)
                        );
                    }
                    // kiểm tra bị reject
                    else if (latestSellerRequest?.status === 'rejected') {
                        const lastRejectedId = localStorage.getItem(
                            `lastRejectedId_${userId}`
                        );
                        if (latestSellerRequest._id !== lastRejectedId) {
                            localStorage.setItem(
                                `lastRejectedId_${userId}`,
                                latestSellerRequest._id
                            );

                            // Giữ form cũ nhưng quay lại bước đầu tiên
                            const saved = localStorage.getItem(STORAGE_KEY);
                            const parsedSaved = saved
                                ? JSON.parse(saved)
                                : { formData, currentStep: 0 };
                            parsed = { ...parsedSaved, currentStep: 0 };
                            localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify(parsed)
                            );

                            // ✅ cập nhật state ngay lập tức
                            setCurrentStep(0);
                        } else {
                            const saved = localStorage.getItem(STORAGE_KEY);
                            parsed = saved ? JSON.parse(saved) : null;
                        }
                    } else {
                        const saved = localStorage.getItem(STORAGE_KEY);
                        parsed = saved ? JSON.parse(saved) : null;
                    }
                }

                // ✅ chỉ load nếu chưa reset
                if (parsed) {
                    if (parsed.formData) setFormData(parsed.formData);
                    if (typeof parsed.currentStep === 'number')
                        setCurrentStep(parsed.currentStep);
                }
            } catch (err) {
                console.error('Lỗi khi khởi tạo:', err);
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                hasLoadedRef.current = true;
                setLoaded(true);
            }
        };
        init();
    }, []);

    // --- Hàm lưu an toàn ---
    const saveToLocalStorage = useCallback((data, step) => {
        if (!hasLoadedRef.current) return; // ✅ không lưu khi chưa load xong
        const old = localStorage.getItem(STORAGE_KEY);
        const oldParsed = old ? JSON.parse(old) : {};
        const newData = { formData: data, currentStep: step };

        // ✅ chỉ ghi nếu dữ liệu thay đổi thực sự
        if (JSON.stringify(oldParsed) !== JSON.stringify(newData)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
    }, []);

    const updateFormData = useCallback(
        (section, newData) => {
            setFormData((prev) => {
                const updated = {
                    ...prev,
                    [section]: { ...prev[section], ...newData },
                };
                saveToLocalStorage(updated, currentStep);
                return updated;
            });
        },
        [currentStep, saveToLocalStorage]
    );

    const steps = [
        'Thông tin Shop',
        'Kho hàng và ngân hàng',
        'Định danh',
        'Hoàn tất',
    ];

    const handleNext = useCallback(
        (data) => {
            const nextStep = Math.min(currentStep + 1, steps.length - 1);
            setFormData((prev) => {
                const updated = { ...prev };
                if (currentStep === 0) updated.shopInfo = data;
                if (currentStep === 1) updated.shipping = data;
                if (currentStep === 2) updated.verification = data;
                saveToLocalStorage(updated, nextStep);
                return updated;
            });
            setCurrentStep(nextStep);
        },
        [currentStep, steps.length, saveToLocalStorage]
    );

    const handleBack = useCallback(() => {
        const prevStep = Math.max(currentStep - 1, 0);
        setCurrentStep(prevStep);
        saveToLocalStorage(formData, prevStep);
    }, [currentStep, formData, saveToLocalStorage]);

    if (!loaded) return <Loading />;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow">
            <ProgressSteps steps={steps} currentStep={currentStep} />
            <div className="mt-8">
                {currentStep === 0 && (
                    <SellerStep1
                        data={formData.shopInfo}
                        onNext={handleNext}
                        onUpdate={(newData) =>
                            updateFormData('shopInfo', newData)
                        }
                    />
                )}
                {currentStep === 1 && (
                    <SellerStep2
                        data={formData.shipping}
                        onNext={handleNext}
                        onBack={handleBack}
                        onUpdate={(newData) =>
                            updateFormData('shipping', newData)
                        }
                    />
                )}
                {currentStep === 2 && (
                    <SellerStep3
                        data={formData.verification}
                        phone={formData.shopInfo?.phone}
                        onNext={handleNext}
                        onBack={handleBack}
                        onUpdate={(newData) =>
                            updateFormData('verification', newData)
                        }
                    />
                )}
                {currentStep === 3 && <SellerStep4 />}
            </div>
        </div>
    );
}
