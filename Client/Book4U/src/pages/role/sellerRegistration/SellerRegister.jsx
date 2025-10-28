import { useState, useEffect } from 'react';
import SellerStep1 from './SellerStep1';
import SellerStep2 from './SellerStep2';
import SellerStep3 from './SellerStep3';
import SellerStep4 from './SellerStep4';
import ProgressSteps from '@/components/ui/ProgressSteps';

export default function SellerRegister() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        shopInfo: {},
        shipping: {},
        verification: {},
    });

    // --- Load từ localStorage khi mở lại ---
    useEffect(() => {
        const saved = localStorage.getItem('sellerRegister');
        if (saved) {
            const parsed = JSON.parse(saved);
            setFormData(parsed.formData || {});
            setCurrentStep(parsed.currentStep || 0);
        }
    }, []);

    // --- Mỗi khi thay đổi, lưu lại ---
    useEffect(() => {
        localStorage.setItem(
            'sellerRegister',
            JSON.stringify({ formData, currentStep })
        );
    }, [formData, currentStep]);

    const steps = [
        'Thông tin Shop',
        'Cài đặt vận chuyển',
        'Định danh',
        'Hoàn tất',
    ];

    const handleNext = (data) => {
        const updated = { ...formData };
        if (currentStep === 0) updated.shopInfo = data;
        if (currentStep === 1) updated.shipping = data;
        if (currentStep === 2) updated.verification = data;
        setFormData(updated);
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow">
            <ProgressSteps steps={steps} currentStep={currentStep} />
            <div className="mt-8">
                {currentStep === 0 && (
                    <SellerStep1 data={formData.shopInfo} onNext={handleNext} />
                )}
                {currentStep === 1 && (
                    <SellerStep2
                        data={formData.shipping}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {currentStep === 2 && (
                    <SellerStep3
                        data={formData.verification}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {currentStep === 3 && <SellerStep4 />}
            </div>
        </div>
    );
}
