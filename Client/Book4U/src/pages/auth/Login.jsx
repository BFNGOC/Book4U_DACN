import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import Input from '../../components/ui/Input';

import { GoogleLogin } from '@react-oauth/google';

import { loginPassword, googleLogin } from '../../services/api/userApi';

import { validateLogin } from '../../utils/validate/Login';

import { useUser } from '../../contexts/userContext';

function Login() {
    const initFormData = {
        email: '',
        password: '',
    };

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
        <div>
            <h2>Đăng nhập</h2>
            <form onSubmit={handleSubmit}>
                <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    label="Email"
                    placeholder="Email"
                    error={errors.email}
                />

                <Input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    label="Mật khẩu"
                    type="password"
                    placeholder="Mật khẩu"
                    error={errors.password}
                />

                <button type="submit" className="border">
                    Đăng nhập
                </button>

                {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}
            </form>
            <GoogleLogin
                onSuccess={async (credentialResponse) => {
                    console.log('✅ Đăng nhập thành công:', credentialResponse);

                    const res = await googleLogin(credentialResponse.credential);

                    if (res.error) {
                        console.error(res.message);
                        return;
                    }

                    localStorage.setItem('token', res.token);
                    localStorage.setItem('user', JSON.stringify(res.data));
                    setUser(res.data);

                    navigate('/');
                }}
                onError={() => {
                    console.log('❌ Đăng nhập thất bại');
                }}
            />

            <Link to="/forgot-password">Quên mật khẩu?</Link>
            <br />
            <span>
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-blue-500">
                    Đăng ký
                </Link>
            </span>
        </div>
    );
}

export default Login;
