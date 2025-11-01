import { useState, useEffect, useCallback, useRef } from 'react';
import SellerStep1 from './SellerStep1';
import SellerStep2 from './SellerStep2';
import SellerStep3 from './SellerStep3';
import SellerStep4 from './SellerStep4';
import ProgressSteps from '@/components/ui/ProgressSteps';
import Loading from '@/components/common/Loading';

export default function SellerRegister() {
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

    // --- Load từ localStorage khi khởi tạo ---
    useEffect(() => {
        const saved = localStorage.getItem('sellerRegister');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.formData) {
                    setFormData(parsed.formData);
                }
                if (typeof parsed.currentStep === 'number')
                    setCurrentStep(parsed.currentStep);
            } catch (err) {
                console.error('Lỗi đọc localStorage:', err);
                localStorage.removeItem('sellerRegister');
            }
        }
        setTimeout(() => {
            hasLoadedRef.current = true;
            setLoaded(true);
        }, 100);
    }, []);

    // --- Hàm lưu an toàn ---
    const saveToLocalStorage = useCallback((data, step) => {
        if (!hasLoadedRef.current) return; // ✅ không lưu khi chưa load xong
        const old = localStorage.getItem('sellerRegister');
        const oldParsed = old ? JSON.parse(old) : {};
        const newData = { formData: data, currentStep: step };

        // ✅ chỉ ghi nếu dữ liệu thay đổi thực sự
        if (JSON.stringify(oldParsed) !== JSON.stringify(newData)) {
            localStorage.setItem('sellerRegister', JSON.stringify(newData));
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
