import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Input from '../../components/ui/Input';
import { register } from '../../services/api/userApi';
import { validateSetPassword } from '../../utils/validate/setPassword';

function SetPassword() {
    const initFormData = {
        password: '',
        confirmPassword: '',
    };

    const [formData, setFormData] = useState(initFormData);
    const [errors, setErrors] = useState({}); // lỗi từng field
    const [generalError, setGeneralError] = useState(''); // lỗi chung

    const navigate = useNavigate();
    const tempToken = localStorage.getItem('tempToken');

    useEffect(() => {
        if (!tempToken) {
            setGeneralError('Chưa xác thực OTP. Vui lòng đăng ký lại.');
            navigate('/register');
        }
    }, [tempToken, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleValidateFormData = (formData) => {
        const validationErrors = validateSetPassword(formData);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = handleValidateFormData(formData);
        if (!isValid) return;

        const res = await register({ tempToken, password: formData.password });
        if (res.error) return setGeneralError(res.message);

        // Clear localStorage sau khi xong
        localStorage.removeItem('registerEmail');
        localStorage.removeItem('otpVerified');
        localStorage.removeItem('tempToken');

        navigate('/');
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md mt-5">
                <h2 className="text-2xl font-bold text-center mb-6">Tạo mật khẩu</h2>

                {generalError && <p className="text-red-500 text-sm mb-4">{generalError}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        label="Mật khẩu"
                        onChange={handleChange}
                        placeholder="Mật khẩu"
                        error={errors.password}
                    />

                    <Input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        label="Xác nhận mật khẩu"
                        onChange={handleChange}
                        placeholder="Xác nhận mật khẩu"
                        error={errors.confirmPassword}
                    />

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                        Tiếp tục
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SetPassword;
