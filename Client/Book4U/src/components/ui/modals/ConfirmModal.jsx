import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const ConfirmModal = ({
    open,
    title = 'Xác nhận',
    message = 'Bạn có chắc muốn thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    onConfirm,
    onCancel,
    type = 'default', // default, success, danger, warning
}) => {
    if (!open) return null;

    const getConfig = () => {
        const configs = {
            default: {
                icon: AlertCircle,
                headerColor: 'from-blue-500 to-blue-600',
                buttonColor:
                    'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
            },
            success: {
                icon: CheckCircle,
                headerColor: 'from-green-500 to-green-600',
                buttonColor:
                    'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
            },
            danger: {
                icon: XCircle,
                headerColor: 'from-red-500 to-red-600',
                buttonColor:
                    'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
            },
            warning: {
                icon: AlertCircle,
                headerColor: 'from-amber-500 to-amber-600',
                buttonColor:
                    'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
            },
        };
        return configs[type] || configs.default;
    };

    const config = getConfig();
    const IconComponent = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
                {/* Header với icon */}
                <div
                    className={`bg-gradient-to-r ${config.headerColor} px-6 py-6 flex items-start gap-4`}>
                    <div className="flex-shrink-0">
                        <IconComponent className="w-7 h-7 text-white mt-1" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">
                            {title}
                        </h2>
                    </div>
                </div>

                {/* Message */}
                <div className="px-6 py-5">
                    <p className="text-gray-600 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 hover:border-gray-400 transition duration-200">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${config.buttonColor} text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg transform hover:scale-105`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
