import { useState } from 'react';
import { X } from 'lucide-react';

const ImageUpload = ({ label, name, onChange, value }) => {
    const [preview, setPreview] = useState(
        typeof value === 'string' ? value : null
    );

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            onChange(file);
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
            <div className="relative w-40 h-40 border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 overflow-hidden">
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
                            <X size={16} className="cursor-pointer" />
                        </button>
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                        <span className="text-3xl text-gray-400">+</span>
                        <p className="text-center text-sm text-gray-600 px-2 mt-1">
                            Tải lên logo cửa hàng
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
