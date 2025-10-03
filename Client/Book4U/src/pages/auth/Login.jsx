import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

import Input from '../../components/ui/Input';
import { loginPassword, googleLogin } from '../../services/api/userApi';
import { validateLogin } from '../../utils/validate/Login';
import { useUser } from '../../contexts/userContext';

function Login() {
    const initFormData = { email: '', password: '' };
    const [formData, setFormData] = useState(initFormData);
    const [errors, setErrors] = useState({});
    const { setUser } = useUser();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleValidateFormData = (formData) => {
        const validationErrors = validateLogin(formData);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const fetchLogin = async (formData) => {
        const res = await loginPassword(formData);
        return res;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = handleValidateFormData(formData);
        if (!isValid) return;

        const res = await fetchLogin(formData);
        if (res.error) {
            setErrors({ general: res.message });
            return;
        }

        localStorage.setItem('token', res.token);
        const { id: _ignored1, _id: _ignored2, ...sanitizedUser } = res.data;
        localStorage.setItem('user', JSON.stringify(sanitizedUser));
        setUser(sanitizedUser);

        setTimeout(() => navigate('/'), 500);
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md mt-5">
                {/* Tiêu đề */}
                <h2 className="text-2xl font-bold text-center mb-2">Chào mừng trở lại</h2>
                <p className="text-gray-500 text-center mb-8">Đăng nhập tài khoản của bạn</p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <Input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        label="Email"
                        placeholder="Nhập email"
                        error={errors.email}
                    />

                    <Input
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        label="Password"
                        type="password"
                        placeholder="Nhập password"
                        error={errors.password}
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
                    >
                        Đăng nhập
                    </button>

                    {errors.general && (
                        <p className="text-red-500 text-sm text-center">{errors.general}</p>
                    )}
                </form>

                {/* Google login */}
                <div className="my-4">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            const res = await googleLogin(credentialResponse.credential);
                            if (res.error) return console.error(res.message);

                            localStorage.setItem('token', res.token);
                            localStorage.setItem('user', JSON.stringify(res.data));
                            setUser(res.data);
                            navigate('/');
                        }}
                        onError={() => console.log('❌ Google login failed')}
                    />
                </div>

                {/* Links */}
                <div className="text-center mt-2">
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Quên mật khẩu?
                    </Link>
                </div>

                <p className="text-center text-sm mt-4 text-gray-600">
                    Bạn chưa có tài khoản?{' '}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Đăng ký
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
