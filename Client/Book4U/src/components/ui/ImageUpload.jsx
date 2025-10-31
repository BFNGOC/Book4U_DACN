import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const ImageUpload = ({
    label,
    name,
    onChange,
    value,
    placeholder = 'Chọn ảnh để tải lên',
    icon: Icon = Upload,
    width = 'w-40',
    height = 'h-40',
}) => {
    const [preview, setPreview] = useState(
        typeof value === 'string' ? value : null
    );

    useEffect(() => {
        if (typeof value === 'string') {
            setPreview(value);
        } else {
            if (!value) {
                setPreview(null);
            }
        }
    }, [value]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                setPreview(base64);
                onChange(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange(null);
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div
                className={`relative ${width} ${height} border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 overflow-hidden`}>
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="object-cover w-full h-full"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 bg-white rounded-full shadow p-1">
                            <X
                                size={16}
                                className="cursor-pointer text-gray-600"
                            />
                        </button>
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                        <Icon size={28} className="text-gray-400 mb-1" />
                        <p className="text-center text-sm text-gray-600 px-2">
                            {placeholder}
                        </p>
                        <input
                            type="file"
                            name={name}
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
