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
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const tempToken = localStorage.getItem('tempToken');

    useEffect(() => {
        if (!tempToken) {
            setError('Chưa xác thực otp. Vui lòng đăng ký lại.');
            navigate('/register');
        }
    }, [tempToken, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleValidateFormData = (formData) => {
        const validationErrors = validateSetPassword(formData);
        setError(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = handleValidateFormData(formData);

        if (!isValid) return;

        const res = await register({ tempToken, password: formData.password });
        if (res.error) return setError(res.message);

        localStorage.removeItem('registerEmail');
        localStorage.removeItem('otpVerified');
        localStorage.removeItem('tempToken');
        navigate('/profile-setup');
    };

    return (
        <div>
            <h2>Tạo mật khẩu</h2>
            <form onSubmit={handleSubmit}>
                <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    label="Mật khẩu"
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    error={error.password}
                />

                <Input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    label="Xac nhận mật khẩu"
                    onChange={handleChange}
                    placeholder="Xac nhận mật khẩu"
                    error={error.confirmPassword}
                />
                <button type="submit">Tiếp tục</button>
            </form>
        </div>
    );
}

export default SetPassword;
