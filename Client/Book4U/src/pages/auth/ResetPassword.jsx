import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { resetPassword } from '../../services/api/userApi';

function ResetPassword() {
    const { token } = useParams(); // lấy token từ URL
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp');
        }

        const res = await resetPassword({
            token,
            newPassword: password,
        });

        if (res.error) {
            setError(res.message);
        } else {
            setMessage(res.message);
            setTimeout(() => {
                navigate('/login');
            }, 500);
        }
    };

    return (
        <div>
            <h2>Đặt lại mật khẩu</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Đặt lại</button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default ResetPassword;
