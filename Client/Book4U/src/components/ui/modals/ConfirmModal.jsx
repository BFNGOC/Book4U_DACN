import React from 'react';

const ConfirmModal = ({
    open,
    title = 'Xác nhận',
    message = 'Bạn có chắc muốn thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded shadow-lg w-[90%] max-w-sm p-6 animate-fadeIn">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    {title}
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
