import { useState } from 'react';
import SellerStep1 from './SellerStep1';
import SellerStep2 from './SellerStep2';
import SellerStep3 from './SellerStep3';
import SellerStep4 from './SellerStep4';
import ProgressSteps from '@/components/ui/ProgressSteps';

export default function SellerRegister() {
    // Bước hiện tại (0-3)
    const [currentStep, setCurrentStep] = useState(0);

    // Dữ liệu form chung
    const [formData, setFormData] = useState({
        shopInfo: {},
        shipping: {},
        verification: {},
    });

    const steps = [
        'Thông tin Shop',
        'Cài đặt vận chuyển',
        'Định danh',
        'Hoàn tất',
    ];

    const handleNext = (data) => {
        // lưu data của step hiện tại
        const updated = { ...formData };
        if (currentStep === 0) updated.shopInfo = data;
        if (currentStep === 1) updated.shipping = data;
        if (currentStep === 2) updated.verification = data;
        setFormData(updated);

        // qua bước kế tiếp
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
