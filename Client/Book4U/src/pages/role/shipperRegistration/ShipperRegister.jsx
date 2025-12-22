import { useState, useEffect, useCallback, useRef } from 'react';
import ShipperStep1 from './ShipperStep1';
import ShipperStep2 from './ShipperStep2';
import ShipperStep3 from './ShipperStep3';
import ProgressSteps from '@/components/ui/ProgressSteps';
import Loading from '@/components/common/Loading';
import { getMyRoleRequests } from '@/services/api/roleRequestApi';
import { useUser } from '@/contexts/userContext';

export default function ShipperRegister() {
    const { user } = useUser();
    const userId = user?._id;
    const STORAGE_KEY = `shipperRegister_${userId}`;
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        areaAndBank: {
            areas: [],
            bank: { name: '', number: '', bank: '', branch: '' },
        },
        identity: {},
    });
    const [loaded, setLoaded] = useState(false);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await getMyRoleRequests();
                let parsed = null;

                if (res?.success && Array.isArray(res.data)) {
                    const latest = res.data
                        .filter((r) => r.role === 'shipper')
                        .sort(
                            (a, b) =>
                                new Date(b.createdAt) - new Date(a.createdAt)
                        )[0];

                    // ✅ MỚI: Kiểm tra nếu request đang pending
                    if (latest?.status === 'pending') {
                        console.log(
                            '📋 Có pending request shipper, đi tới bước cuối cùng'
                        );
                        // Đi đến bước cuối cùng (step 2 = index 2 cho shipper)
                        setCurrentStep(2);
                        parsed = { formData, currentStep: 2 };
                        localStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(parsed)
                        );
                    }
                    // Kiểm tra bị reject
                    else if (latest?.status === 'rejected') {
                        const lastRejectedId = localStorage.getItem(
                            `lastRejectedId_${userId}`
                        );
                        if (latest._id !== lastRejectedId) {
                            localStorage.setItem(
                                `lastRejectedId_${userId}`,
                                latest._id
                            );
                            parsed = { formData, currentStep: 0 };
                            localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify(parsed)
                            );
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

                if (parsed) {
                    if (parsed.formData) setFormData(parsed.formData);
                    if (typeof parsed.currentStep === 'number')
                        setCurrentStep(parsed.currentStep);
                }
            } catch (err) {
                console.error('Error loading form:', err);
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                hasLoadedRef.current = true;
                setLoaded(true);
            }
        };
        init();
    }, []);

    const saveToLocalStorage = useCallback((data, step) => {
        if (!hasLoadedRef.current) return;
        const newData = { formData: data, currentStep: step };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
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

    const steps = ['Khu vực & ngân hàng', 'Thông tin cá nhân', 'Hoàn thành'];

    const handleNext = useCallback(
        (data) => {
            const nextStep = Math.min(currentStep + 1, steps.length - 1);
            setFormData((prev) => {
                const updated = { ...prev };
                if (currentStep === 0) updated.areaAndBank = data;
                if (currentStep === 1) updated.identity = data;
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
                    <ShipperStep1
                        data={formData.areaAndBank}
                        onNext={handleNext}
                        onUpdate={(newData) =>
                            updateFormData('areaAndBank', newData)
                        }
                    />
                )}
                {currentStep === 1 && (
                    <ShipperStep2
                        data={formData.identity}
                        onNext={handleNext}
                        onBack={handleBack}
                        onUpdate={(newData) =>
                            updateFormData('identity', newData)
                        }
                    />
                )}
                {currentStep === 2 && <ShipperStep3 />}
            </div>
        </div>
    );
}
