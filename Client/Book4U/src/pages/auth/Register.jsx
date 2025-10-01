import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { requestOtp } from '../../services/api/userApi';

function Register() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await requestOtp({ email });
        if (res.error) {
            setError(res.message);
            return;
        }

        // Lưu email tạm để verify OTP
        localStorage.setItem('registerEmail', email);
        navigate('/verify-otp');
    };

    return (
        <div>
            <h2>Đăng ký - Nhập Email</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <button type="submit">Gửi OTP</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default Register;
